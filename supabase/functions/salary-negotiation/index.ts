import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText, currentSalary, targetRole, targetCompany, offerDetails } = await req.json();
    if (!resumeText) throw new Error("Resume text is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userPrompt = `Analyze this resume and provide salary negotiation intelligence.

RESUME TEXT:
${resumeText}

${currentSalary ? `CURRENT SALARY: ${currentSalary}` : ""}
${targetRole ? `TARGET ROLE: ${targetRole}` : ""}
${targetCompany ? `TARGET COMPANY: ${targetCompany}` : ""}
${offerDetails ? `OFFER DETAILS: ${offerDetails}` : ""}

Provide comprehensive negotiation strategy including:
1. Market value assessment with data-backed ranges
2. Negotiation scripts for different scenarios (initial offer, counter, competing offers)
3. Benefits negotiation strategy (equity, bonus, PTO, remote, signing bonus, relocation)
4. Counter-offer email templates
5. Questions to ask during negotiation
6. Red flags to watch for
7. Walk-away point analysis
8. Total compensation framework`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [
          { role: "system", content: "You are an expert salary negotiation coach with deep knowledge of compensation structures across industries. Provide specific, actionable negotiation strategies." },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_negotiation_strategy",
            description: "Extract salary negotiation strategy",
            parameters: {
              type: "object",
              properties: {
                market_value: {
                  type: "object",
                  properties: {
                    base_range: { type: "object", properties: { low: { type: "number" }, mid: { type: "number" }, high: { type: "number" }, currency: { type: "string" } }, required: ["low", "mid", "high"] },
                    total_comp_range: { type: "object", properties: { low: { type: "number" }, mid: { type: "number" }, high: { type: "number" } }, required: ["low", "mid", "high"] },
                    confidence: { type: "string" },
                    data_sources: { type: "array", items: { type: "string" } },
                    key_factors: { type: "array", items: { type: "string" } }
                  },
                  required: ["base_range", "total_comp_range", "key_factors"]
                },
                negotiation_scripts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      scenario: { type: "string" },
                      script: { type: "string" },
                      tips: { type: "array", items: { type: "string" } },
                      what_if_they_say: { type: "array", items: { type: "object", properties: { objection: { type: "string" }, response: { type: "string" } }, required: ["objection", "response"] } }
                    },
                    required: ["scenario", "script"]
                  }
                },
                benefits_strategy: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      benefit: { type: "string" },
                      typical_range: { type: "string" },
                      negotiation_tip: { type: "string" },
                      priority: { type: "string" },
                      monetary_value: { type: "string" }
                    },
                    required: ["benefit", "negotiation_tip", "priority"]
                  }
                },
                counter_offer_templates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      scenario: { type: "string" },
                      subject: { type: "string" },
                      email: { type: "string" }
                    },
                    required: ["scenario", "subject", "email"]
                  }
                },
                questions_to_ask: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      why: { type: "string" },
                      when_to_ask: { type: "string" }
                    },
                    required: ["question", "why"]
                  }
                },
                red_flags: { type: "array", items: { type: "object", properties: { flag: { type: "string" }, why: { type: "string" }, action: { type: "string" } }, required: ["flag", "why"] } },
                walk_away_analysis: {
                  type: "object",
                  properties: {
                    minimum_acceptable: { type: "string" },
                    factors: { type: "array", items: { type: "string" } },
                    signs_to_walk_away: { type: "array", items: { type: "string" } },
                    how_to_decline_gracefully: { type: "string" }
                  },
                  required: ["minimum_acceptable", "factors"]
                },
                timeline_strategy: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { phase: { type: "string" }, actions: { type: "array", items: { type: "string" } }, timing: { type: "string" } },
                    required: ["phase", "actions"]
                  }
                },
                power_moves: { type: "array", items: { type: "string" } },
                summary: { type: "string" }
              },
              required: ["market_value", "negotiation_scripts", "benefits_strategy", "counter_offer_templates", "questions_to_ask", "red_flags", "walk_away_analysis", "summary"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_negotiation_strategy" } },
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

    const strategy = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(strategy), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("salary-negotiation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
