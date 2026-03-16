import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { analysis, resumeData, targetRole } = await req.json();

    if (!analysis) {
      return new Response(JSON.stringify({ error: "No analysis data provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a world-class career strategist and resume optimization AI. Given the following resume analysis data, generate a comprehensive, personalized recommendation engine output.

ANALYSIS DATA:
${JSON.stringify(analysis, null, 2).substring(0, 12000)}

${resumeData ? `RESUME DATA: ${JSON.stringify(resumeData).substring(0, 3000)}` : ""}
${targetRole ? `TARGET ROLE: ${targetRole}` : ""}

Generate deeply personalized recommendations. Be SPECIFIC — reference actual content from the analysis. Provide exact rewrites, not generic advice.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [
          { role: "system", content: "You are a career strategy AI that generates actionable, personalized recommendations from resume analysis data. Return only via the provided tool." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_recommendations",
            description: "Return comprehensive personalized recommendations",
            parameters: {
              type: "object",
              properties: {
                overall_strategy: {
                  type: "object",
                  properties: {
                    positioning_statement: { type: "string" },
                    target_roles: { type: "array", items: { type: "string" } },
                    market_readiness: { type: "string", enum: ["ready", "almost_ready", "needs_work", "major_overhaul"] },
                    estimated_weeks_to_ready: { type: "number" },
                    competitive_advantage: { type: "string" },
                    biggest_gap: { type: "string" },
                  },
                  required: ["positioning_statement", "target_roles", "market_readiness"],
                },
                quick_wins: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      action: { type: "string" },
                      current_text: { type: "string" },
                      improved_text: { type: "string" },
                      impact: { type: "string", enum: ["critical", "high", "medium"] },
                      time_minutes: { type: "number" },
                      category: { type: "string", enum: ["content", "formatting", "keywords", "structure", "branding"] },
                    },
                    required: ["action", "impact", "time_minutes", "category"],
                  },
                },
                skill_development: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      skill: { type: "string" },
                      current_level: { type: "string", enum: ["missing", "beginner", "intermediate", "advanced"] },
                      target_level: { type: "string" },
                      importance: { type: "string", enum: ["critical", "important", "nice_to_have"] },
                      learning_path: { type: "string" },
                      free_resources: { type: "array", items: { type: "string" } },
                      timeline_weeks: { type: "number" },
                    },
                    required: ["skill", "current_level", "importance", "learning_path"],
                  },
                },
                application_strategy: {
                  type: "object",
                  properties: {
                    daily_target: { type: "number" },
                    best_channels: { type: "array", items: { type: "string" } },
                    networking_tips: { type: "array", items: { type: "string" } },
                    cold_outreach_template: { type: "string" },
                    linkedin_optimization: { type: "array", items: { type: "string" } },
                    portfolio_suggestions: { type: "array", items: { type: "string" } },
                  },
                  required: ["daily_target", "best_channels"],
                },
                interview_preparation: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      why_asked: { type: "string" },
                      strong_answer_framework: { type: "string" },
                      weak_answer_red_flags: { type: "array", items: { type: "string" } },
                      practice_tip: { type: "string" },
                    },
                    required: ["question", "why_asked", "strong_answer_framework"],
                  },
                },
                weekly_action_plan: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      week: { type: "number" },
                      theme: { type: "string" },
                      tasks: { type: "array", items: { type: "string" } },
                      milestone: { type: "string" },
                    },
                    required: ["week", "theme", "tasks"],
                  },
                },
                salary_insights: {
                  type: "object",
                  properties: {
                    estimated_range: { type: "string" },
                    negotiation_leverage: { type: "array", items: { type: "string" } },
                    market_position: { type: "string" },
                    tips: { type: "array", items: { type: "string" } },
                  },
                  required: ["estimated_range", "market_position"],
                },
              },
              required: ["overall_strategy", "quick_wins", "skill_development", "application_strategy", "interview_preparation", "weekly_action_plan", "salary_insights"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_recommendations" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI recommendation failed");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response");

    const recommendations = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommendations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
