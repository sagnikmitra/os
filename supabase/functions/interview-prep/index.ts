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
    const { resumeData, jobDescription, category, difficulty, count } = await req.json();

    if (!resumeData) {
      return new Response(JSON.stringify({ error: "Resume data is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contact = resumeData.contact || {};
    const experience = (resumeData.experience || [])
      .map((e: any) => {
        const bullets = (e.bullets || []).filter((b: string) => b.trim()).join("\n  - ");
        return `**${e.title}** at **${e.company}** (${e.startDate} – ${e.current ? "Present" : e.endDate})\n  Location: ${e.location}\n  - ${bullets}`;
      })
      .join("\n\n");
    const education = (resumeData.education || [])
      .map((e: any) => `${e.degree} in ${e.field} from ${e.institution} (${e.startDate}–${e.endDate})${e.gpa ? `, GPA: ${e.gpa}` : ""}${e.honors ? `, Honors: ${e.honors}` : ""}`)
      .join("\n");
    const skills = (resumeData.skills || [])
      .map((s: any) => `${s.category}: ${s.items}`)
      .join("\n");
    const projects = (resumeData.projects || [])
      .map((p: any) => {
        const bullets = (p.bullets || []).filter((b: string) => b.trim()).join("\n  - ");
        return `**${p.name}**: ${p.description}${p.technologies ? ` [${p.technologies}]` : ""}\n  - ${bullets}`;
      })
      .join("\n\n");
    const summary = resumeData.summary || "";
    const certifications = (resumeData.certifications || [])
      .map((c: any) => `${c.name} — ${c.issuer} (${c.date})`)
      .join("\n");

    const questionCount = Math.min(count || 8, 15);
    const difficultyLevel = difficulty || "mixed";
    const selectedCategory = category || "all";

    const categoryInstructions: Record<string, string> = {
      all: "Generate a balanced mix across all categories below.",
      behavioral: "Focus ONLY on behavioral/situational questions (STAR method scenarios).",
      technical: "Focus ONLY on technical questions related to the candidate's skills and tech stack.",
      experience: "Focus ONLY on questions that drill into specific experience entries, projects, and achievements.",
      leadership: "Focus ONLY on leadership, management, team dynamics, and strategic decision-making questions.",
      culture: "Focus ONLY on culture fit, motivation, work style, and career trajectory questions.",
      problem_solving: "Focus ONLY on problem-solving, analytical thinking, and case-study style questions.",
    };

    const difficultyInstructions: Record<string, string> = {
      easy: "All questions should be entry-level / straightforward — things any candidate should be able to answer.",
      medium: "All questions should be mid-level — requiring thoughtful reflection and specific examples.",
      hard: "All questions should be senior/expert-level — probing deeply into decision-making, trade-offs, failures, and strategic thinking.",
      mixed: "Include a mix of easy (2), medium (3-4), and hard (2-3) questions.",
    };

    const prompt = `You are an elite interview coach preparing a candidate for a job interview. Analyze the candidate's resume in extreme detail and generate ${questionCount} highly specific, personalized interview questions.

CANDIDATE PROFILE:
Name: ${contact.name || "Candidate"}
Title: ${contact.title || "Professional"}
Summary: ${summary}

EXPERIENCE:
${experience || "No experience listed"}

EDUCATION:
${education || "No education listed"}

SKILLS:
${skills || "No skills listed"}

PROJECTS:
${projects || "No projects listed"}

CERTIFICATIONS:
${certifications || "No certifications listed"}

${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription}\n` : ""}

CATEGORY FOCUS: ${categoryInstructions[selectedCategory] || categoryInstructions.all}

DIFFICULTY: ${difficultyInstructions[difficultyLevel] || difficultyInstructions.mixed}

CRITICAL INSTRUCTIONS:
1. Every question MUST reference specific details from the resume — company names, project names, technologies, metrics, timelines
2. Never ask generic questions like "Tell me about yourself" — be laser-specific
3. For behavioral questions, reference a specific scenario from their experience
4. For technical questions, reference their actual tech stack and projects
5. Include follow-up probes that an interviewer might ask
6. Provide a detailed sample answer framework showing how to structure a strong response using their actual experience
7. Tag each question with: category, difficulty, estimated answer time, and which resume section it relates to
8. If a job description is provided, connect questions to specific JD requirements

You MUST respond with a valid JSON object using this exact tool call format.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert interview coach who creates deeply personalized interview preparation materials. You always reference specific details from the candidate's resume. You respond ONLY via the provided tool call.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        tools: [
          {
            type: "function",
            function: {
              name: "generate_interview_questions",
              description: "Generate personalized interview questions based on resume analysis",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", description: "Unique question ID like q1, q2, etc." },
                        question: { type: "string", description: "The interview question — must reference specific resume details" },
                        category: {
                          type: "string",
                          enum: ["behavioral", "technical", "experience", "leadership", "culture", "problem_solving"],
                        },
                        difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                        estimatedMinutes: { type: "number", description: "Estimated answer time in minutes (1-5)" },
                        resumeSection: { type: "string", description: "Which resume section this question targets (e.g., 'Experience at Google', 'React skills', 'AWS project')" },
                        whyAsked: { type: "string", description: "Why an interviewer would ask this — what they're evaluating" },
                        followUps: {
                          type: "array",
                          items: { type: "string" },
                          description: "2-3 follow-up probes the interviewer might ask after the initial answer",
                        },
                        sampleAnswer: {
                          type: "object",
                          properties: {
                            framework: { type: "string", description: "Recommended answer framework (e.g., STAR, Problem-Action-Result)" },
                            keyPoints: {
                              type: "array",
                              items: { type: "string" },
                              description: "3-5 key points to hit in the answer, referencing specific resume achievements",
                            },
                            openingLine: { type: "string", description: "A strong opening sentence for the answer" },
                            pitfalls: {
                              type: "array",
                              items: { type: "string" },
                              description: "1-3 common mistakes to avoid when answering this question",
                            },
                          },
                          required: ["framework", "keyPoints", "openingLine", "pitfalls"],
                        },
                        tips: { type: "string", description: "Specific coaching tip for this question" },
                      },
                      required: ["id", "question", "category", "difficulty", "estimatedMinutes", "resumeSection", "whyAsked", "followUps", "sampleAnswer", "tips"],
                      additionalProperties: false,
                    },
                  },
                  overallAdvice: {
                    type: "object",
                    properties: {
                      strengths: {
                        type: "array",
                        items: { type: "string" },
                        description: "3-5 resume strengths the candidate should emphasize in interviews",
                      },
                      gaps: {
                        type: "array",
                        items: { type: "string" },
                        description: "2-3 potential weaknesses or gaps to prepare for",
                      },
                      storyBank: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string", description: "Short story title" },
                            situation: { type: "string", description: "Brief description of the situation from their resume" },
                            versatility: { type: "string", description: "Which types of questions this story can answer" },
                          },
                          required: ["title", "situation", "versatility"],
                          additionalProperties: false,
                        },
                        description: "4-6 reusable stories from their resume that can answer multiple question types",
                      },
                    },
                    required: ["strengths", "gaps", "storyBank"],
                    additionalProperties: false,
                  },
                },
                required: ["questions", "overallAdvice"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_interview_questions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errText}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "generate_interview_questions") {
      throw new Error("AI did not return structured interview questions");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Interview prep error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
