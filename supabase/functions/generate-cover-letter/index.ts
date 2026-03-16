const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeData, jobDescription, companyName, jobTitle, tone } = await req.json();

    if (!resumeData) {
      return new Response(JSON.stringify({ error: "Resume data is required" }), {
        status: 400,
        headers: { ...corsHeaders, Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      });
    }

    const contact = resumeData.contact || {};
    const experience = (resumeData.experience || [])
      .map((e: any) => `${e.title} at ${e.company}: ${(e.bullets || []).join("; ")}`)
      .join("\n");
    const skills = (resumeData.skills || [])
      .map((s: any) => `${s.category}: ${s.items}`)
      .join(", ");
    const summary = resumeData.summary || "";

    const toneInstruction = tone === "formal" 
      ? "Use a formal, professional tone suitable for corporate environments."
      : tone === "enthusiastic"
      ? "Use an enthusiastic, energetic tone while remaining professional."
      : "Use a confident, balanced professional tone.";

    const prompt = `Write a compelling cover letter for ${contact.name || "the candidate"} applying for ${jobTitle || "the position"}${companyName ? ` at ${companyName}` : ""}.

${toneInstruction}

Candidate background:
- Title: ${contact.title || "Professional"}
- Summary: ${summary}
- Experience: ${experience}
- Skills: ${skills}

${jobDescription ? `Job Description:\n${jobDescription}` : ""}

Requirements:
1. Opening paragraph: Hook the reader, mention the specific role and company
2. Body (2 paragraphs): Connect candidate's experience and skills to the role requirements. Use specific achievements and metrics from the resume
3. Closing paragraph: Express enthusiasm, call to action
4. Keep it under 400 words
5. Do NOT use generic phrases like "I am writing to express my interest"
6. Make it specific, impactful, and tailored
7. Return ONLY the cover letter text, no headers or signatures`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [
          { role: "system", content: "You are an expert career coach and cover letter writer. You craft compelling, specific cover letters that highlight relevant achievements and create strong connections between a candidate's experience and the target role." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errText}`);
    }

    const result = await response.json();
    const coverLetter = result.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ coverLetter }),
      { headers: { ...corsHeaders, Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    });
  }
});
