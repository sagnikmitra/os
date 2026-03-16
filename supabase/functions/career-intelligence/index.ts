import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText, analysisData } = await req.json();
    if (!resumeText) throw new Error("Resume text is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an elite career intelligence analyst with deep knowledge of job markets, salary data, career trajectories, and industry trends. Analyze the resume and provide comprehensive career intelligence.

Return a JSON response using the extract_career_intelligence tool.`;

    const userPrompt = `Analyze this resume and provide deep career intelligence:

RESUME TEXT:
${resumeText}

${analysisData ? `EXISTING ANALYSIS DATA:\n${JSON.stringify(analysisData)}` : ""}

Provide comprehensive analysis covering:
1. Salary Intelligence - estimated salary range based on role, skills, experience, and location. Include base, total comp, and equity estimates for different company tiers (startup, mid-market, enterprise/FAANG).
2. Career Path Predictions - 3 possible career trajectories (conservative, ambitious, pivot) with timeline, required skills, and probability.
3. Market Demand Analysis - how in-demand are their skills? Which are trending up/down? Supply-demand ratio.
4. Industry Positioning - where they stand vs peers, what makes them unique, blind spots.
5. Competitive Landscape - what other candidates with similar profiles look like, differentiators needed.
6. Role Fit Analysis - top 5 specific job titles that best match, with fit percentage.
7. Geographic Insights - best cities/regions for their profile, remote work potential.
8. Company Tier Analysis - which tier of company they're best positioned for and why.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_career_intelligence",
            description: "Extract comprehensive career intelligence from resume analysis",
            parameters: {
              type: "object",
              properties: {
                salary_intelligence: {
                  type: "object",
                  properties: {
                    estimated_base_range: { type: "object", properties: { low: { type: "number" }, mid: { type: "number" }, high: { type: "number" }, currency: { type: "string" } }, required: ["low", "mid", "high", "currency"] },
                    total_comp_range: { type: "object", properties: { low: { type: "number" }, mid: { type: "number" }, high: { type: "number" } }, required: ["low", "mid", "high"] },
                    by_company_tier: { type: "array", items: { type: "object", properties: { tier: { type: "string" }, base: { type: "string" }, total_comp: { type: "string" }, equity: { type: "string" } }, required: ["tier", "base", "total_comp"] } },
                    factors_increasing_pay: { type: "array", items: { type: "string" } },
                    factors_limiting_pay: { type: "array", items: { type: "string" } },
                    negotiation_leverage: { type: "string" }
                  },
                  required: ["estimated_base_range", "by_company_tier", "factors_increasing_pay", "factors_limiting_pay"]
                },
                career_paths: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      trajectory: { type: "string" },
                      description: { type: "string" },
                      timeline: { type: "string" },
                      next_role: { type: "string" },
                      five_year_role: { type: "string" },
                      required_skills: { type: "array", items: { type: "string" } },
                      probability: { type: "number" },
                      salary_growth: { type: "string" },
                      key_actions: { type: "array", items: { type: "string" } }
                    },
                    required: ["trajectory", "description", "next_role", "five_year_role", "required_skills", "probability"]
                  }
                },
                market_demand: {
                  type: "object",
                  properties: {
                    overall_demand: { type: "string" },
                    demand_score: { type: "number" },
                    trending_up_skills: { type: "array", items: { type: "object", properties: { skill: { type: "string" }, trend: { type: "string" }, demand_level: { type: "string" } }, required: ["skill", "trend"] } },
                    trending_down_skills: { type: "array", items: { type: "object", properties: { skill: { type: "string" }, trend: { type: "string" }, replacement: { type: "string" } }, required: ["skill", "trend"] } },
                    emerging_skills_to_learn: { type: "array", items: { type: "object", properties: { skill: { type: "string" }, why: { type: "string" }, urgency: { type: "string" } }, required: ["skill", "why", "urgency"] } },
                    supply_demand_ratio: { type: "string" }
                  },
                  required: ["overall_demand", "demand_score", "trending_up_skills", "emerging_skills_to_learn"]
                },
                industry_positioning: {
                  type: "object",
                  properties: {
                    percentile_estimate: { type: "number" },
                    unique_differentiators: { type: "array", items: { type: "string" } },
                    blind_spots: { type: "array", items: { type: "string" } },
                    competitive_advantages: { type: "array", items: { type: "string" } },
                    market_positioning_statement: { type: "string" }
                  },
                  required: ["percentile_estimate", "unique_differentiators", "blind_spots"]
                },
                role_fit: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      fit_percentage: { type: "number" },
                      why: { type: "string" },
                      gaps: { type: "array", items: { type: "string" } },
                      companies_hiring: { type: "array", items: { type: "string" } }
                    },
                    required: ["title", "fit_percentage", "why"]
                  }
                },
                geographic_insights: {
                  type: "object",
                  properties: {
                    best_cities: { type: "array", items: { type: "object", properties: { city: { type: "string" }, reason: { type: "string" }, salary_adjustment: { type: "string" } }, required: ["city", "reason"] } },
                    remote_potential: { type: "string" },
                    relocation_impact: { type: "string" }
                  },
                  required: ["best_cities", "remote_potential"]
                },
                overall_assessment: {
                  type: "object",
                  properties: {
                    market_readiness: { type: "number" },
                    strongest_signal: { type: "string" },
                    biggest_opportunity: { type: "string" },
                    biggest_risk: { type: "string" },
                    one_liner: { type: "string" }
                  },
                  required: ["market_readiness", "strongest_signal", "biggest_opportunity", "biggest_risk", "one_liner"]
                }
              },
              required: ["salary_intelligence", "career_paths", "market_demand", "industry_positioning", "role_fit", "overall_assessment"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_career_intelligence" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const intelligence = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(intelligence), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("career-intelligence error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
