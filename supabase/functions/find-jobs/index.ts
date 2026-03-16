import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyLink(url: string): Promise<"live" | "expired" | "unknown"> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ResumeOS/1.0)" },
    });
    clearTimeout(timeout);
    if (resp.ok) return "live";
    if (resp.status === 404 || resp.status === 410 || resp.status === 403) return "expired";
    // Some sites block HEAD, try GET
    if (resp.status === 405 || resp.status === 400) {
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 5000);
      const resp2 = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller2.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ResumeOS/1.0)" },
      });
      clearTimeout(timeout2);
      if (resp2.ok) return "live";
      if (resp2.status === 404 || resp2.status === 410) return "expired";
      return "unknown";
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { skills, title, experience, location, industries, summary, bulletSamples } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY is not configured");

    const jobTitle = title || "Software Engineer";
    const loc = location || "";

    // Build diverse search queries
    const searchQueries = [
      `${jobTitle} job openings ${loc} 2026 hiring`,
      `${jobTitle} careers apply now ${loc}`,
      `"${jobTitle}" site:linkedin.com/jobs OR site:indeed.com OR site:glassdoor.com ${loc}`,
    ];
    if (skills?.length > 0) {
      searchQueries.push(`${skills.slice(0, 4).join(" ")} jobs hiring ${loc}`);
    }
    if (industries?.length > 0) {
      searchQueries.push(`${jobTitle} ${industries[0]} jobs hiring now`);
    }

    console.log(`Searching with ${searchQueries.length} queries...`);

    // Step 1: Parallel Firecrawl searches (no markdown scraping for speed)
    const searchPromises = searchQueries.slice(0, 4).map(async (query) => {
      try {
        const resp = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, limit: 10 }),
        });
        if (resp.ok) {
          const data = await resp.json();
          return (data.data || []).map((r: any) => ({
            url: r.url || "",
            title: r.title || "",
            description: r.description || "",
            markdown: (r.markdown || "").substring(0, 2000),
          }));
        }
        return [];
      } catch (e) {
        console.error("Search failed:", query, e);
        return [];
      }
    });

    const results = await Promise.all(searchPromises);
    const allResults: any[] = [];
    results.forEach(r => allResults.push(...r));

    // Deduplicate
    const seen = new Set<string>();
    const unique = allResults.filter(r => {
      if (!r.url || seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    console.log(`Found ${unique.length} unique results`);

    if (unique.length === 0) {
      return new Response(JSON.stringify({ jobs: [], error: "No job listings found." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: AI extraction + scoring
    const candidateProfile = `Title: ${jobTitle}\nSkills: ${skills?.join(", ") || "N/A"}\nExperience: ${experience || "N/A"}\nSummary: ${summary || "N/A"}\nLocation: ${loc || "Open"}\nIndustries: ${industries?.join(", ") || "Open"}${bulletSamples?.length ? `\nAchievements:\n${bulletSamples.map((b: string) => `- ${b}`).join("\n")}` : ""}`;

    const extractionPrompt = `Extract REAL job listings from these web search results. Preserve actual URLs.

## CANDIDATE
${candidateProfile}

## SCORING (0-100): skill overlap 40%, domain 20%, seniority 15%, trajectory 15%, location 10%

## RESULTS
${unique.map((r, i) => `[${i + 1}] URL: ${r.url}\nTitle: ${r.title}\nDesc: ${r.description}\n${r.markdown ? `Content: ${r.markdown}` : ""}`).join("\n---\n")}

RULES: Only real jobs. career_page_url must be the REAL URL from results. Skip articles/guides.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [
          { role: "system", content: "Extract and score real job listings from web results. Never fabricate URLs." },
          { role: "user", content: extractionPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_jobs",
            description: "Return extracted real job listings",
            parameters: {
              type: "object",
              properties: {
                jobs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      job_id: { type: "string" },
                      title: { type: "string" },
                      company: { type: "string" },
                      company_logo_letter: { type: "string" },
                      location: { type: "string" },
                      work_mode: { type: "string", enum: ["Remote", "Hybrid", "On-site"] },
                      employment_type: { type: "string" },
                      seniority: { type: "string" },
                      salary_range: { type: "string" },
                      posted_date: { type: "string" },
                      short_description: { type: "string" },
                      key_requirements: { type: "array", items: { type: "string" } },
                      matching_skills: { type: "array", items: { type: "string" } },
                      missing_skills: { type: "array", items: { type: "string" } },
                      match_score: { type: "number" },
                      career_page_url: { type: "string", description: "REAL URL from search results" },
                      company_industry: { type: "string" },
                      company_size: { type: "string" },
                      why_good_fit: { type: "string" },
                      application_tips: { type: "string" },
                      tech_stack: { type: "array", items: { type: "string" } },
                      benefits: { type: "array", items: { type: "string" } },
                    },
                    required: ["title", "company", "location", "work_mode", "seniority", "salary_range", "short_description", "key_requirements", "matching_skills", "match_score", "company_industry", "career_page_url"],
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
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      throw new Error("AI extraction failed");
    }

    const result = await aiResp.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response from AI");

    const parsed = JSON.parse(toolCall.function.arguments);

    // Normalize jobs
    let jobsList = (parsed.jobs || []).map((j: any, i: number) => ({
      ...j,
      job_id: j.job_id || `JOB-${Date.now()}-${i}`,
      company_logo_letter: j.company_logo_letter || j.company?.[0] || "?",
      missing_skills: j.missing_skills || [],
      matching_skills: j.matching_skills || [],
      key_requirements: j.key_requirements || [],
    }));

    // Step 3: Verify links in parallel (batch of 10 max to avoid timeout)
    console.log(`Verifying ${jobsList.length} job links...`);
    const verifyPromises = jobsList.slice(0, 20).map(async (job: any) => {
      if (!job.career_page_url) {
        return { ...job, link_status: "unknown" };
      }
      const status = await verifyLink(job.career_page_url);
      return { ...job, link_status: status };
    });

    jobsList = await Promise.all(verifyPromises);

    // Sort: live links first, then by match score
    jobsList.sort((a: any, b: any) => {
      if (a.link_status === "expired" && b.link_status !== "expired") return 1;
      if (b.link_status === "expired" && a.link_status !== "expired") return -1;
      return (b.match_score || 0) - (a.match_score || 0);
    });

    console.log(`Done: ${jobsList.length} jobs, ${jobsList.filter((j: any) => j.link_status === "live").length} verified live`);

    return new Response(JSON.stringify({ jobs: jobsList }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("find-jobs error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
