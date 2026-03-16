import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return new Response(JSON.stringify({ error: "Both resume text and job description are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert career strategist and ATS optimization specialist. Compare a resume against a job description and provide a detailed gap analysis.

Return ONLY valid JSON with this structure:
{
  "matchScore": <0-100 overall match percentage>,
  "matchedKeywords": ["<keyword1>", "<keyword2>"],
  "missingKeywords": ["<keyword1>", "<keyword2>"],
  "weakKeywords": ["<keywords present but not emphasized enough>"],
  "sectionSuggestions": [
    {
      "section": "<Summary|Experience|Skills|Education|Projects>",
      "issue": "<specific problem>",
      "suggestion": "<actionable fix>",
      "priority": "<high|medium|low>"
    }
  ],
  "rewriteSuggestions": [
    {
      "original": "<exact bullet from resume>",
      "rewritten": "<improved version tailored to JD>",
      "reason": "<why this change helps>"
    }
  ],
  "overallAssessment": "<2-3 sentence summary of fit>",
  "topActions": ["<most impactful action 1>", "<action 2>", "<action 3>"]
}

Rules:
- Be SPECIFIC — reference actual content from both resume and JD
- Prioritize high-impact missing keywords that appear multiple times in JD
- Rewrite suggestions should incorporate JD language naturally
- Score honestly — don't inflate
- Return ONLY valid JSON`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-1.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `RESUME:\n${resumeText}\n\n---\n\nJOB DESCRIPTION:\n${jobDescription}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    let result;
    try {
      let cleaned = content.trim();
      if (cleaned.includes("```")) cleaned = cleaned.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      result = JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("jd-gap-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
