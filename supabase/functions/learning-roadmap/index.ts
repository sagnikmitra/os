import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText, targetRole } = await req.json();
    if (!resumeText) throw new Error("Resume text is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userPrompt = `Analyze this resume and create a comprehensive learning roadmap.

RESUME TEXT:
${resumeText}

${targetRole ? `TARGET ROLE: ${targetRole}` : ""}

Provide:
1. Skills gap analysis with severity (critical/important/nice-to-have)
2. Recommended certifications with ROI estimates
3. Online courses from real platforms (Coursera, Udemy, LinkedIn Learning, etc.)
4. Books and resources
5. Projects to build for portfolio
6. A phased learning plan (30/60/90 days, 6 months, 1 year)
7. Community and networking recommendations
8. Conference and event suggestions`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [
          { role: "system", content: "You are a career development coach and learning strategist. Create actionable, realistic learning roadmaps." },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_learning_roadmap",
            description: "Extract a structured learning roadmap",
            parameters: {
              type: "object",
              properties: {
                skills_gap: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      skill: { type: "string" },
                      current_level: { type: "string" },
                      target_level: { type: "string" },
                      severity: { type: "string", enum: ["critical", "important", "nice-to-have"] },
                      time_to_learn: { type: "string" },
                      how_to_learn: { type: "string" }
                    },
                    required: ["skill", "current_level", "target_level", "severity"]
                  }
                },
                certifications: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      provider: { type: "string" },
                      cost: { type: "string" },
                      duration: { type: "string" },
                      roi_estimate: { type: "string" },
                      salary_impact: { type: "string" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                      url: { type: "string" }
                    },
                    required: ["name", "provider", "priority"]
                  }
                },
                courses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      platform: { type: "string" },
                      instructor: { type: "string" },
                      duration: { type: "string" },
                      cost: { type: "string" },
                      skill_covered: { type: "string" },
                      level: { type: "string" },
                      rating: { type: "string" },
                      url: { type: "string" }
                    },
                    required: ["title", "platform", "skill_covered"]
                  }
                },
                books: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      author: { type: "string" },
                      why: { type: "string" },
                      category: { type: "string" }
                    },
                    required: ["title", "author", "why"]
                  }
                },
                portfolio_projects: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      skills_demonstrated: { type: "array", items: { type: "string" } },
                      difficulty: { type: "string" },
                      estimated_time: { type: "string" },
                      impact_on_resume: { type: "string" }
                    },
                    required: ["name", "description", "skills_demonstrated"]
                  }
                },
                phased_plan: {
                  type: "object",
                  properties: {
                    thirty_days: { type: "array", items: { type: "object", properties: { action: { type: "string" }, goal: { type: "string" }, metric: { type: "string" } }, required: ["action", "goal"] } },
                    sixty_days: { type: "array", items: { type: "object", properties: { action: { type: "string" }, goal: { type: "string" }, metric: { type: "string" } }, required: ["action", "goal"] } },
                    ninety_days: { type: "array", items: { type: "object", properties: { action: { type: "string" }, goal: { type: "string" }, metric: { type: "string" } }, required: ["action", "goal"] } },
                    six_months: { type: "array", items: { type: "object", properties: { action: { type: "string" }, goal: { type: "string" }, metric: { type: "string" } }, required: ["action", "goal"] } },
                    one_year: { type: "array", items: { type: "object", properties: { action: { type: "string" }, goal: { type: "string" }, metric: { type: "string" } }, required: ["action", "goal"] } }
                  },
                  required: ["thirty_days", "sixty_days", "ninety_days"]
                },
                communities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { name: { type: "string" }, type: { type: "string" }, why: { type: "string" }, url: { type: "string" } },
                    required: ["name", "type", "why"]
                  }
                },
                conferences: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { name: { type: "string" }, focus: { type: "string" }, typical_cost: { type: "string" }, value: { type: "string" } },
                    required: ["name", "focus"]
                  }
                },
                weekly_time_commitment: { type: "string" },
                estimated_total_investment: { type: "string" },
                summary: { type: "string" }
              },
              required: ["skills_gap", "certifications", "courses", "phased_plan", "summary"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_learning_roadmap" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const roadmap = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(roadmap), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("learning-roadmap error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
