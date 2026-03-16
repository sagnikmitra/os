import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeData } = await req.json();

    if (!resumeData) {
      return new Response(JSON.stringify({ error: "No resume data provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const contact = resumeData.contact || {};
    const systemPrompt = `You are an expert resume writer. Convert the following structured resume data into professional LaTeX code using a clean, ATS-friendly template.

Requirements:
- Use the \\documentclass{article} with standard packages (geometry, enumitem, titlesec, hyperref)
- Clean, professional formatting
- Proper escaping of special LaTeX characters (%, &, #, $, _, etc.)
- Include all sections that have data
- Use \\textbf for company/school names, \\textit for dates
- Bullet points with \\begin{itemize}
- Return ONLY the complete LaTeX code, no markdown wrapping`;

    const resumeText = `
Name: ${contact.name || ""}
Title: ${contact.title || ""}
Email: ${contact.email || ""}
Phone: ${contact.phone || ""}
Location: ${contact.location || ""}
LinkedIn: ${contact.linkedin || ""}
Portfolio: ${contact.portfolio || ""}

Summary: ${resumeData.summary || ""}

Experience:
${(resumeData.experience || []).map((e: any) => `- ${e.title} at ${e.company} (${e.startDate} - ${e.endDate})\n  ${(e.bullets || []).join("\n  ")}`).join("\n")}

Education:
${(resumeData.education || []).map((e: any) => `- ${e.degree} in ${e.field} from ${e.institution} (${e.startDate} - ${e.endDate})`).join("\n")}

Skills:
${(resumeData.skills || []).map((s: any) => `- ${s.category}: ${s.items}`).join("\n")}

Projects:
${(resumeData.projects || []).map((p: any) => `- ${p.name}: ${p.description}\n  ${(p.bullets || []).join("\n  ")}`).join("\n")}

Certifications:
${(resumeData.certifications || []).map((c: any) => `- ${c.name} by ${c.issuer} (${c.date})`).join("\n")}
`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate LaTeX for this resume:\n\n${resumeText}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to generate LaTeX");
    }

    const data = await response.json();
    let latex = data.choices?.[0]?.message?.content || "";

    // Clean markdown wrapping if present
    if (latex.includes("```")) {
      latex = latex.replace(/```latex\s*/g, "").replace(/```tex\s*/g, "").replace(/```\s*/g, "");
    }
    latex = latex.trim();

    return new Response(JSON.stringify({ latex }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-latex error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
