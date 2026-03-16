const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, userAnswer, resumeData, jobDescription, mode } = await req.json();

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    if (mode === "build_stories") {
      // STAR Story Builder mode - extract stories from resume
      const experience = (resumeData?.experience || [])
        .map((e: any) => {
          const bullets = (e.bullets || []).filter((b: string) => b.trim()).join("\n  - ");
          return `**${e.title}** at **${e.company}** (${e.startDate} – ${e.current ? "Present" : e.endDate})\n  - ${bullets}`;
        }).join("\n\n");
      const projects = (resumeData?.projects || [])
        .map((p: any) => `**${p.name}**: ${p.description}\n  - ${(p.bullets || []).join("\n  - ")}`)
        .join("\n\n");

      const storyPrompt = `Analyze this resume and extract 6-8 powerful STAR stories that the candidate can use in interviews.

RESUME EXPERIENCE:
${experience}

PROJECTS:
${projects}

For each story, provide a complete STAR breakdown using ACTUAL details from the resume. Each story should be versatile enough to answer multiple question types. Include specific metrics, technologies, and outcomes mentioned in the resume.`;

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash",
          messages: [
            { role: "system", content: "You are an expert interview coach who builds STAR stories from resume data. Respond ONLY via the provided tool." },
            { role: "user", content: storyPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "return_star_stories",
              description: "Return STAR stories extracted from resume",
              parameters: {
                type: "object",
                properties: {
                  stories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        title: { type: "string", description: "Short compelling story title" },
                        source: { type: "string", description: "Which resume entry this comes from" },
                        situation: { type: "string", description: "2-3 sentences setting the context with specific details" },
                        task: { type: "string", description: "What was the candidate's specific responsibility or challenge" },
                        action: { type: "string", description: "3-4 specific actions taken, with technologies and methods used" },
                        result: { type: "string", description: "Quantified outcomes and impact with specific metrics" },
                        tags: { type: "array", items: { type: "string" }, description: "Question types this story answers: leadership, conflict, failure, achievement, teamwork, innovation, pressure, problem-solving" },
                        power_phrases: { type: "array", items: { type: "string" }, description: "3-4 strong phrases to use when telling this story" },
                        estimated_duration: { type: "string", description: "How long this story takes to tell: 1-2 min, 2-3 min, 3-5 min" },
                        difficulty_to_tell: { type: "string", enum: ["easy", "medium", "hard"], description: "How hard is it to tell this story compellingly" },
                      },
                      required: ["id", "title", "source", "situation", "task", "action", "result", "tags", "power_phrases", "estimated_duration", "difficulty_to_tell"],
                      additionalProperties: false,
                    },
                  },
                  coverage_analysis: {
                    type: "object",
                    properties: {
                      covered_themes: { type: "array", items: { type: "string" }, description: "Interview themes well-covered by these stories" },
                      gap_themes: { type: "array", items: { type: "string" }, description: "Interview themes NOT covered - candidate needs more stories" },
                      recommendations: { type: "array", items: { type: "string" }, description: "Advice on strengthening the story bank" },
                    },
                    required: ["covered_themes", "gap_themes", "recommendations"],
                    additionalProperties: false,
                  },
                },
                required: ["stories", "coverage_analysis"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "return_star_stories" } },
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (resp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI error");
      }

      const result = await resp.json();
      const tc = result.choices?.[0]?.message?.tool_calls?.[0];
      if (!tc) throw new Error("No structured response");
      return new Response(tc.function.arguments, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Default mode: Evaluate user's answer to an interview question
    if (!question || !userAnswer) {
      return new Response(JSON.stringify({ error: "Question and answer are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contact = resumeData?.contact || {};
    const evalPrompt = `You are a senior interview coach evaluating a candidate's practice answer.

CANDIDATE: ${contact.name || "Candidate"}, ${contact.title || "Professional"}

INTERVIEW QUESTION:
"${question}"

${jobDescription ? `TARGET ROLE:\n${jobDescription}\n` : ""}

CANDIDATE'S ANSWER:
"${userAnswer}"

Evaluate this answer thoroughly across multiple dimensions. Be specific, actionable, and reference what they said.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [
          { role: "system", content: "You evaluate interview answers with expert precision. Respond ONLY via the provided tool." },
          { role: "user", content: evalPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "evaluate_answer",
            description: "Evaluate an interview answer",
            parameters: {
              type: "object",
              properties: {
                overall_score: { type: "number", description: "Score 1-100" },
                grade: { type: "string", enum: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "D", "F"] },
                dimensions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Dimension name: Relevance, Structure, Specificity, Impact, Confidence, Conciseness" },
                      score: { type: "number", description: "Score 1-10" },
                      feedback: { type: "string", description: "Specific feedback for this dimension" },
                    },
                    required: ["name", "score", "feedback"],
                    additionalProperties: false,
                  },
                },
                strengths: { type: "array", items: { type: "string" }, description: "What they did well" },
                improvements: { type: "array", items: { type: "string" }, description: "Specific improvements with examples" },
                rewritten_answer: { type: "string", description: "A polished version of their answer showing what great looks like" },
                missing_elements: { type: "array", items: { type: "string" }, description: "Key elements they should have included" },
                body_language_tips: { type: "array", items: { type: "string" }, description: "Delivery tips for this type of answer" },
                time_estimate: { type: "string", description: "How long this answer would take to deliver" },
              },
              required: ["overall_score", "grade", "dimensions", "strengths", "improvements", "rewritten_answer", "missing_elements", "body_language_tips", "time_estimate"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "evaluate_answer" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI error");
    }

    const result = await resp.json();
    const tc = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc) throw new Error("No structured response");
    return new Response(tc.function.arguments, { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("evaluate-answer error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
