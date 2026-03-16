import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { bullets, style, context, multiVariant } = await req.json();

    if (!bullets || !Array.isArray(bullets) || bullets.length === 0) {
      return new Response(JSON.stringify({ error: "No bullets provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const styleGuides: Record<string, string> = {
      executive: "Rewrite for C-suite/VP level. Use strategic language: 'Spearheaded', 'Orchestrated', 'Championed'. Focus on business impact, revenue, team scale, and organizational outcomes.",
      metrics: "Maximize quantifiable impact. Add specific numbers, percentages, dollar amounts, and timeframes. Every bullet must have at least one metric.",
      strategic: "Frame accomplishments as strategic initiatives. Show business thinking, cross-functional impact, and alignment with company goals.",
      ats: "Optimize for ATS parsing. Use standard action verbs, include industry keywords, avoid special characters. Keep structure simple: Action Verb + Task + Result.",
      concise: "Make each bullet punchy and scannable. Maximum 1-2 lines. Lead with the strongest verb. Cut filler words ruthlessly.",
      star: "Structure using STAR method: Situation context → Task/challenge → Action taken → Result achieved. Each bullet should tell a mini-story.",
      technical: "Emphasize technical depth. Include specific technologies, methodologies, architectures, and scale metrics. Show engineering sophistication.",
      humanize: "Remove AI-sounding generic language. Add personality, specific details, and authentic voice. Make it sound like a real human wrote it.",
    };

    let systemPrompt: string;
    let toolSchema: any;

    if (multiVariant) {
      systemPrompt = `You are an elite resume writing expert at the caliber of Google, Stripe, and Razorpay's internal career coaches.

For EACH bullet point, generate exactly 3 different rewrite variants:
1. **ATS-Optimized**: Maximum keyword density, clean parsing, standard structure (Action Verb + Quantified Result + Context)
2. **Recruiter-Friendly**: Compelling narrative that grabs attention in 6 seconds, emphasizes business impact and leadership
3. **Concise High-Impact**: Ultra-punchy, 1 line max, strongest possible verb, ruthlessly cut filler

${context ? `Context about the candidate: ${context}` : ""}

Rules:
- Each variant must be meaningfully different in structure and word choice
- All variants must be measurably better than the original
- Include specific metrics where possible (estimate realistic ones if missing)
- Be specific — no vague corporate speak
- For ATS variant: use industry-standard keywords
- For Recruiter variant: tell a mini-story with impact
- For Concise variant: maximum 15 words, powerful verb`;

      toolSchema = {
        type: "function",
        function: {
          name: "return_rewrites",
          description: "Return multi-variant rewrites for each bullet",
          parameters: {
            type: "object",
            properties: {
              rewrites: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    original: { type: "string" },
                    ats_optimized: { type: "string" },
                    recruiter_friendly: { type: "string" },
                    concise_impact: { type: "string" },
                    diagnosis: { type: "string", description: "Why the original is weak (1 sentence)" },
                  },
                  required: ["original", "ats_optimized", "recruiter_friendly", "concise_impact", "diagnosis"],
                },
              },
            },
            required: ["rewrites"],
            additionalProperties: false,
          },
        },
      };
    } else {
      systemPrompt = `You are an elite resume writing expert with 20+ years of experience in career coaching and executive recruiting.

Your task is to rewrite resume bullets in the "${style}" style.

Style guide: ${styleGuides[style] || styleGuides.concise}

${context ? `Context about the candidate: ${context}` : ""}

Rules:
- Each rewritten bullet must be measurably better than the original
- Preserve the core meaning but elevate the language and impact
- Be specific — don't use vague corporate speak
- Include metrics where possible`;

      toolSchema = {
        type: "function",
        function: {
          name: "return_rewrites",
          description: "Return rewritten bullets",
          parameters: {
            type: "object",
            properties: {
              rewrites: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    original: { type: "string" },
                    rewritten: { type: "string" },
                  },
                  required: ["original", "rewritten"],
                },
              },
            },
            required: ["rewrites"],
            additionalProperties: false,
          },
        },
      };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Rewrite these resume bullets:\n\n${bullets.map((b: string, i: number) => `${i + 1}. ${b}`).join("\n")}` },
        ],
        tools: [toolSchema],
        tool_choice: { type: "function", function: { name: "return_rewrites" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI rewrite failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) throw new Error("No structured response from AI");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("rewrite-bullets error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
