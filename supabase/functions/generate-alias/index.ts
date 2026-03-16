import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeData } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    if (!resumeData) {
      throw new Error("Resume data is required");
    }

    // Extract minimal resume info to save tokens
    const name = resumeData.contact?.name || "Unknown Candidate";
    const title = resumeData.contact?.title || "";
    const exp = resumeData.experience?.map((e: any) => `${e.title} at ${e.company} (${e.duration})`).slice(0, 3).join("; ") || "No experience listed";

    // Calculate total experience years roughly
    let totalYears = 0;
    if (resumeData.experience) {
      totalYears = resumeData.experience.reduce((acc: number, e: any) => {
        // rough calculation just to get seniority token
        return acc + (e.duration?.toLowerCase().includes("year") ? parseInt(e.duration) || 1 : 0);
      }, 0);
    }
    const seniority = totalYears > 7 ? "Senior" : totalYears > 3 ? "Mid-Level" : "Junior";

    const candidateProfile = `Name: ${name}\nTitle: ${title}\nExperience level: ${seniority}\nRecent Roles: ${exp}`;

    const promptText = `Based on the following resume metadata, generate a short, professional, and clear alias (maximum 3-6 words) for this resume.
    
The alias should help the user quickly identify this specific version of their resume based on the role and seniority or industry. 
Good examples: "Senior Product Manager (FinTech)", "Data Engineer - Enterprise", "Junior Frontend Developer", "Marketing Lead - 2026", "Customer Success (SaaS)".

Candidate Info:
${candidateProfile}

Return raw JSON only with this structure:
{
  "alias": "The Generated Alias"
}`;

    const aiResp = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: "You are a helpful AI that generates short, descriptive titles for resumes." },
          { role: "user", content: promptText },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI Error:", aiResp.status, errText);
      throw new Error("Failed to generate alias with AI");
    }

    const result = await aiResp.json();
    let content = result.choices?.[0]?.message?.content || "";

    // Clean JSON response (Gemini sometimes wraps in markdown block)
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(content);

    return new Response(JSON.stringify({ alias: parsed.alias }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in generate-alias:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
