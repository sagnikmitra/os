import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText } = await req.json();
    if (!resumeText) throw new Error("Resume text is required");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const userPrompt = `Analyze this resume for personal branding and generate comprehensive branding assets.

RESUME TEXT:
${resumeText}

Provide:
1. Brand audit - tone consistency, uniqueness score, brand clarity
2. Multiple elevator pitches (15-sec, 30-sec, 60-sec) for different contexts (networking, interview, cold email)
3. LinkedIn headline and summary suggestions (multiple variants)
4. Personal brand statement
5. Tagline options
6. Online presence strategy (what to post, where, frequency)
7. Networking email templates (introduction, follow-up, informational interview request)
8. Brand keywords - words that should define their professional identity
9. Brand gaps - what's missing from their professional narrative`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a personal branding expert and career communications strategist. Create compelling, authentic brand assets." },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_personal_branding",
            description: "Extract personal branding analysis and assets",
            parameters: {
              type: "object",
              properties: {
                brand_audit: {
                  type: "object",
                  properties: {
                    brand_clarity_score: { type: "number" },
                    uniqueness_score: { type: "number" },
                    consistency_score: { type: "number" },
                    overall_brand_grade: { type: "string" },
                    current_brand_perception: { type: "string" },
                    ideal_brand_perception: { type: "string" },
                    brand_gaps: { type: "array", items: { type: "string" } },
                    strengths: { type: "array", items: { type: "string" } }
                  },
                  required: ["brand_clarity_score", "uniqueness_score", "consistency_score", "overall_brand_grade"]
                },
                elevator_pitches: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      context: { type: "string" },
                      duration: { type: "string" },
                      pitch: { type: "string" },
                      tips: { type: "string" }
                    },
                    required: ["context", "duration", "pitch"]
                  }
                },
                linkedin_optimization: {
                  type: "object",
                  properties: {
                    headlines: { type: "array", items: { type: "object", properties: { headline: { type: "string" }, style: { type: "string" } }, required: ["headline", "style"] } },
                    summary_variants: { type: "array", items: { type: "object", properties: { tone: { type: "string" }, summary: { type: "string" } }, required: ["tone", "summary"] } },
                    profile_tips: { type: "array", items: { type: "string" } }
                  },
                  required: ["headlines", "summary_variants"]
                },
                brand_statement: { type: "string" },
                taglines: { type: "array", items: { type: "string" } },
                brand_keywords: { type: "array", items: { type: "string" } },
                online_presence_strategy: {
                  type: "object",
                  properties: {
                    platforms: { type: "array", items: { type: "object", properties: { platform: { type: "string" }, priority: { type: "string" }, content_types: { type: "array", items: { type: "string" } }, posting_frequency: { type: "string" }, sample_posts: { type: "array", items: { type: "string" } } }, required: ["platform", "priority", "content_types"] } },
                    content_pillars: { type: "array", items: { type: "string" } },
                    thought_leadership_topics: { type: "array", items: { type: "string" } }
                  },
                  required: ["platforms", "content_pillars"]
                },
                networking_templates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      subject: { type: "string" },
                      body: { type: "string" },
                      context: { type: "string" }
                    },
                    required: ["type", "subject", "body"]
                  }
                },
                action_plan: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      week: { type: "string" },
                      actions: { type: "array", items: { type: "string" } }
                    },
                    required: ["week", "actions"]
                  }
                }
              },
              required: ["brand_audit", "elevator_pitches", "linkedin_optimization", "brand_statement", "taglines", "brand_keywords", "online_presence_strategy", "networking_templates"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_personal_branding" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const branding = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(branding), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("personal-branding error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
