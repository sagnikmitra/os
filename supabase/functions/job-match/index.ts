import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert career match analyst. Given a resume analysis and a job description, perform an exhaustive comparison.

Return ONLY valid JSON (no markdown) with this structure:

{
  "match_score": <0-100>,
  "role_fit": { "level": "<Strong|Moderate|Weak>", "explanation": "<why>" },
  "seniority_alignment": { "level": "<Aligned|Over-qualified|Under-qualified>", "explanation": "<why>" },
  "domain_alignment": { "level": "<Strong|Moderate|Weak>", "explanation": "<why>" },
  "matched_keywords": ["<keywords from JD found in resume>"],
  "missing_keywords": ["<keywords from JD NOT in resume>"],
  "weak_keywords": ["<keywords present but weakly demonstrated>"],
  "requirements_match": [
    { "requirement": "<JD requirement>", "status": "<met|partial|missing>", "evidence": "<where in resume or 'not found'>" }
  ],
  "tailoring_recommendations": [
    { "priority": "<critical|high|medium|low>", "text": "<specific recommendation>" }
  ],
  "cover_letter_points": ["<key points to emphasize in a cover letter>"],
  "interview_prep": ["<likely interview questions based on gaps>"],
  "competitive_assessment": "<how this candidate compares to typical applicants for this role>"
}

Be specific. Reference actual content from both the resume and job description.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeAnalysis, jobDescription } = await req.json();

    if (!jobDescription?.trim()) {
      return new Response(
        JSON.stringify({ error: "No job description provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build a summary of the resume for context
    const resumeSummary = JSON.stringify({
      extracted_info: resumeAnalysis.extracted_info,
      scores: resumeAnalysis.scores,
      skills_analysis: resumeAnalysis.skills_analysis,
      strengths: resumeAnalysis.strengths,
      red_flags: resumeAnalysis.red_flags,
      career_narrative: resumeAnalysis.career_narrative,
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `RESUME ANALYSIS:\n${resumeSummary}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nPerform an exhaustive match analysis.`
          },
        ],
        temperature: 0.2,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait and try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: `Analysis failed (${response.status}).` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "AI returned empty response." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let result;
    try {
      let cleaned = content;
      if (cleaned.includes("```")) cleaned = cleaned.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      cleaned = cleaned.trim();
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      result = JSON.parse(cleaned);
    } catch {
      return new Response(JSON.stringify({ error: "Failed to parse match analysis." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ match: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("job-match error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
