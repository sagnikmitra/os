const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, style } = await req.json();
    if (!text) return new Response(JSON.stringify({ error: "text is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const styleInstructions: Record<string, string> = {
      "More Human": "Rewrite this to sound like a real, confident human professional wrote it — not a bot. Remove all AI-pattern phrases ('passionate about', 'results-driven', 'proven track record', 'dynamic', 'synergy'). Use natural sentence rhythms. Make it feel lived-in and specific.",
      "Sharper": "Make this extremely precise and direct. Cut every redundant word. No filler phrases. Get to the point in the fewest words possible while keeping full impact. Use active verbs.",
      "More Executive": "Rewrite this with executive gravitas. Use strategic language. Reference business impact, organizational scope, and leadership influence. Sound like a C-suite leader — confident, measured, high-context.",
      "More Technical": "Rewrite with technical precision and credibility. Use domain-specific terminology. Show depth of knowledge. Avoid vague phrases and replace them with specific technical details that a senior engineer would write.",
      "More Concise": "Cut this to 50-60% of its current length without losing any meaning. Remove every adjective that isn't essential. Cut preamble. Be ruthlessly efficient.",
      "Startup-Oriented": "Rewrite with a builder mindset and ownership tone. Sound like someone who ships things fast, owns outcomes, wears many hats. Use concrete language: built, shipped, grew, launched. No corporate speak.",
      "Enterprise-Ready": "Rewrite for an enterprise context. Reference process maturity, cross-functional collaboration, compliance, scalability, and stakeholder management. Sound like someone who operates effectively in complex organizations.",
    };

    const instruction = styleInstructions[style] || styleInstructions["More Human"];

    const systemPrompt = `You are an expert resume and professional writing editor. You specialize in making professional writing sound authentic, human, and credible.

Your task: ${instruction}

Rules:
- Output ONLY the rewritten text, nothing else
- Do NOT add quotes around the output
- Preserve the original meaning and any specific metrics/numbers
- Do not add new information that wasn't in the original
- Keep the same length unless the style specifically asks for shorter
- Do not add explanations or commentary`;

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
          { role: "user", content: `Rewrite this text:\n\n${text}` },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to your workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const humanized = result.choices?.[0]?.message?.content?.trim();

    if (!humanized) throw new Error("No response from AI");

    return new Response(JSON.stringify({ humanized }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("humanize-text error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
