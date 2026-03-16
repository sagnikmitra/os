import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { urls, query, sources } = await req.json();

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Firecrawl not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const allResults: any[] = [];

    // 1. Search the web for jobs if query is provided
    if (query) {
      const searchQueries = [
        `${query} job openings 2026`,
        `${query} careers hiring now`,
        ...(sources?.includes("startups") ? [`${query} startup jobs YC hiring`] : []),
        ...(sources?.includes("boards") ? [`${query} jobs site:linkedin.com OR site:indeed.com OR site:glassdoor.com`] : []),
      ];

      for (const sq of searchQueries.slice(0, 3)) {
        try {
          const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: sq,
              limit: 8,
              scrapeOptions: { formats: ["markdown"] },
            }),
          });

          if (searchResp.ok) {
            const searchData = await searchResp.json();
            if (searchData.data) {
              allResults.push(...searchData.data.map((r: any) => ({
                url: r.url,
                title: r.title || "",
                description: r.description || "",
                markdown: r.markdown?.substring(0, 2000) || "",
                source: "search",
              })));
            }
          }
        } catch (e) {
          console.error("Search query failed:", sq, e);
        }
      }
    }

    // 2. Scrape specific career page URLs if provided
    if (urls?.length) {
      for (const url of urls.slice(0, 5)) {
        try {
          let formattedUrl = url.trim();
          if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

          const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: formattedUrl,
              formats: ["markdown"],
              onlyMainContent: true,
            }),
          });

          if (scrapeResp.ok) {
            const scrapeData = await scrapeResp.json();
            const md = scrapeData.data?.markdown || scrapeData.markdown || "";
            allResults.push({
              url: formattedUrl,
              title: scrapeData.data?.metadata?.title || formattedUrl,
              description: scrapeData.data?.metadata?.description || "",
              markdown: md.substring(0, 3000),
              source: "career_page",
            });
          }
        } catch (e) {
          console.error("Scrape failed:", url, e);
        }
      }
    }

    if (allResults.length === 0) {
      return new Response(JSON.stringify({ error: "No results found. Try different search terms." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Use AI to extract structured job listings from scraped content
    const extractionPrompt = `You are a job listing extraction engine. Given the following scraped web content from career pages and job boards, extract ALL distinct job listings found.

For each job found, extract:
- title: exact job title
- company: company name
- location: city/state or "Remote"
- work_mode: "Remote" | "Hybrid" | "On-site"
- salary_range: if mentioned, else "Not disclosed"
- seniority: "Entry" | "Mid" | "Senior" | "Staff" | "Principal" | "Director" | "VP"
- short_description: 2-3 sentence summary
- key_requirements: array of 3-5 key requirements
- apply_url: direct application link if available
- company_industry: inferred industry
- posted_date: if available
- employment_type: "Full-time" | "Contract" | "Part-time"

SCRAPED CONTENT:
${allResults.map((r, i) => `--- Source ${i + 1}: ${r.title} (${r.url}) ---\n${r.markdown}`).join("\n\n")}

Extract ONLY real job listings. Do not fabricate jobs. If a page doesn't contain job listings, skip it.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [
          { role: "system", content: "You extract structured job listings from web content. Return only via the provided tool." },
          { role: "user", content: extractionPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_scraped_jobs",
            description: "Return extracted job listings from scraped content",
            parameters: {
              type: "object",
              properties: {
                jobs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      company: { type: "string" },
                      location: { type: "string" },
                      work_mode: { type: "string", enum: ["Remote", "Hybrid", "On-site"] },
                      salary_range: { type: "string" },
                      seniority: { type: "string" },
                      short_description: { type: "string" },
                      key_requirements: { type: "array", items: { type: "string" } },
                      apply_url: { type: "string" },
                      company_industry: { type: "string" },
                      posted_date: { type: "string" },
                      employment_type: { type: "string" },
                    },
                    required: ["title", "company", "location", "short_description"],
                  },
                },
                total_sources_scanned: { type: "number" },
                sources_with_jobs: { type: "number" },
              },
              required: ["jobs"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_scraped_jobs" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      throw new Error("AI extraction failed");
    }

    const aiResult = await aiResp.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response");

    const extracted = JSON.parse(toolCall.function.arguments);

    // Add job_id and metadata
    extracted.jobs = extracted.jobs.map((j: any, i: number) => ({
      ...j,
      job_id: `SCRAPE-${Date.now()}-${i}`,
      company_logo_letter: j.company?.[0] || "?",
      matching_skills: [],
      missing_skills: [],
      match_score: 0,
      scraped: true,
    }));

    return new Response(JSON.stringify({
      ...extracted,
      sources_scanned: allResults.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scrape-jobs error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
