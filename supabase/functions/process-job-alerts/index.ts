import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!FIRECRAWL_API_KEY || !LOVABLE_API_KEY) {
      throw new Error("Missing required API keys");
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if a specific alert_id was passed (manual trigger) or process all due alerts
    let alertFilter: any;
    try {
      const body = await req.json();
      alertFilter = body?.alert_id;
    } catch { /* no body = cron trigger */ }

    let query = admin.from("job_alerts").select("*, saved_resumes(resume_data)").eq("is_active", true);

    if (alertFilter) {
      query = query.eq("id", alertFilter);
    } else {
      // Only process alerts that haven't run in the last 20 hours (daily)
      const cutoff = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
      query = query.or(`last_run_at.is.null,last_run_at.lt.${cutoff}`);
    }

    const { data: alerts, error: alertsErr } = await query;
    if (alertsErr) throw alertsErr;
    if (!alerts?.length) {
      return new Response(JSON.stringify({ message: "No alerts to process", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalNewJobs = 0;

    for (const alert of alerts) {
      try {
        // Build search query from alert config
        let searchQuery = alert.keywords;
        if (alert.location) searchQuery += ` ${alert.location}`;
        if (alert.seniority?.length) searchQuery += ` ${alert.seniority[0]}`;

        // If resume-based, extract skills from resume
        let resumeContext = "";
        if (alert.resume_based && alert.saved_resumes?.resume_data) {
          const rd = alert.saved_resumes.resume_data as any;
          const skills = rd.skills?.join(", ") || "";
          const title = rd.title || rd.personalInfo?.title || "";
          resumeContext = `Target role: ${title}. Skills: ${skills}. `;
        }

        // Search for jobs using Firecrawl
        const searchQueries = [
          `${searchQuery} job openings 2026`,
          ...(alert.sources?.includes("startups") ? [`${searchQuery} startup jobs YC Wellfound hiring`] : []),
          ...(alert.sources?.includes("boards") ? [`${searchQuery} jobs site:linkedin.com OR site:indeed.com`] : []),
        ];

        const allResults: any[] = [];
        for (const sq of searchQueries.slice(0, 2)) {
          try {
            const resp = await fetch("https://api.firecrawl.dev/v1/search", {
              method: "POST",
              headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({ query: sq, limit: 6, scrapeOptions: { formats: ["markdown"] } }),
            });
            if (resp.ok) {
              const d = await resp.json();
              if (d.data) allResults.push(...d.data.map((r: any) => ({
                url: r.url, title: r.title || "", markdown: r.markdown?.substring(0, 1500) || "",
              })));
            }
          } catch (e) { console.error("Search failed:", sq, e); }
        }

        if (!allResults.length) {
          await admin.from("job_alerts").update({ last_run_at: new Date().toISOString() }).eq("id", alert.id);
          continue;
        }

        // Extract jobs with AI
        const extractionPrompt = `Extract ALL distinct job listings from this scraped content.
${resumeContext}
For each job: title, company, location, work_mode (Remote/Hybrid/On-site), salary_range, seniority, short_description (2 sentences), key_requirements (3-5 items), apply_url, company_industry, employment_type.
${alert.seniority?.length ? `Filter for seniority: ${alert.seniority.join(", ")}` : ""}
${alert.work_mode?.length ? `Filter for work mode: ${alert.work_mode.join(", ")}` : ""}
${alert.industries?.length ? `Filter for industries: ${alert.industries.join(", ")}` : ""}

CONTENT:
${allResults.map((r, i) => `--- ${i + 1}: ${r.title} (${r.url}) ---\n${r.markdown}`).join("\n\n")}

Only real listings. No fabrication.`;

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash",
            messages: [
              { role: "system", content: "Extract structured job listings. Return only via the tool." },
              { role: "user", content: extractionPrompt },
            ],
            tools: [{
              type: "function",
              function: {
                name: "return_jobs",
                description: "Return extracted jobs",
                parameters: {
                  type: "object",
                  properties: {
                    jobs: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" }, company: { type: "string" },
                          location: { type: "string" }, work_mode: { type: "string" },
                          salary_range: { type: "string" }, seniority: { type: "string" },
                          short_description: { type: "string" },
                          key_requirements: { type: "array", items: { type: "string" } },
                          apply_url: { type: "string" }, company_industry: { type: "string" },
                          employment_type: { type: "string" },
                        },
                        required: ["title", "company", "location", "short_description"],
                      },
                    },
                  },
                  required: ["jobs"],
                  additionalProperties: false,
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "return_jobs" } },
          }),
        });

        if (!aiResp.ok) {
          console.error("AI failed for alert", alert.id, aiResp.status);
          continue;
        }

        const aiResult = await aiResp.json();
        const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall) continue;

        const extracted = JSON.parse(toolCall.function.arguments);
        if (!extracted.jobs?.length) {
          await admin.from("job_alerts").update({ last_run_at: new Date().toISOString() }).eq("id", alert.id);
          continue;
        }

        // Check for duplicates against existing results for this alert
        const { data: existing } = await admin.from("job_alert_results")
          .select("job_data")
          .eq("alert_id", alert.id)
          .order("created_at", { ascending: false })
          .limit(100);

        const existingTitles = new Set(
          (existing || []).map((e: any) => `${e.job_data?.title}|${e.job_data?.company}`.toLowerCase())
        );

        const newJobs = extracted.jobs.filter((j: any) =>
          !existingTitles.has(`${j.title}|${j.company}`.toLowerCase())
        );

        if (newJobs.length > 0) {
          const inserts = newJobs.map((j: any) => ({
            alert_id: alert.id,
            user_id: alert.user_id,
            job_data: { ...j, found_at: new Date().toISOString(), alert_name: alert.name },
          }));

          await admin.from("job_alert_results").insert(inserts);
          totalNewJobs += newJobs.length;
        }

        await admin.from("job_alerts").update({
          last_run_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", alert.id);

      } catch (e) {
        console.error("Alert processing failed:", alert.id, e);
      }
    }

    return new Response(JSON.stringify({
      processed: alerts.length,
      new_jobs_found: totalNewJobs,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("process-job-alerts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
