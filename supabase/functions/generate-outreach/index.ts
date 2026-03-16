import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { recruiterName, recruiterTitle, companyName, companyNiche, location, resumeSummary, candidateTitle, skills, experience, achievements, targetRole } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an elite career strategist who writes hyper-personalized cold outreach messages. You tailor every message based on the candidate's SPECIFIC achievements, skills, and career trajectory — not generic templates.

Rules:
- Keep InMail under 150 words — recruiters are busy
- Reference the candidate's SPECIFIC achievements and metrics from their resume
- Connect the candidate's skills directly to the company's needs/industry
- Show genuine knowledge of the recruiter's company and how the candidate adds value
- Include a clear but soft call-to-action
- Avoid generic phrases like "I came across your profile" or "I'm a passionate professional"
- Make it feel human, conversational, and memorable
- Mention 1-2 specific skills or achievements that are relevant to the company
- Don't use emojis or excessive exclamation marks

Return a JSON object with:
{
  "subject": "Short compelling subject line for InMail referencing a specific skill/achievement",
  "message": "The full outreach message with specific resume references woven in naturally",
  "linkedin_note": "A shorter 300-char version for LinkedIn connection request that mentions a key achievement",
  "tips": ["3-4 tips for making this outreach more effective, based on the candidate's specific background"]
}`;

    const candidateSection = `CANDIDATE PROFILE:
- Current/Target Title: ${candidateTitle || targetRole || "Not specified"}
- Summary: ${resumeSummary || "Not provided"}
- Key Skills: ${skills?.length ? skills.join(", ") : "Not specified"}
- Career History: ${experience?.length ? experience.join(" → ") : "Not specified"}
- Notable Achievements:
${achievements?.length ? achievements.map((a: string) => `  • ${a}`).join("\n") : "  None provided"}
- Target Role: ${targetRole || "Open to opportunities"}`;

    const userPrompt = `Write a highly personalized cold outreach message.

RECRUITER:
- Name: ${recruiterName}
- Title: ${recruiterTitle}
- Company: ${companyName}
- Industry: ${companyNiche || "Not specified"}
- Location: ${location || "Not specified"}

${candidateSection}

IMPORTANT: Weave the candidate's specific achievements and metrics into the message naturally. Don't just list them — connect them to why the candidate would be valuable at ${companyName}. If the candidate has quantified results (percentages, revenue, users), reference at least one.`;

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
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    let content = aiResult.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-outreach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
