import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOTAL_QUESTIONS = 12;

interface ConversationMessage {
  role?: string;
  content?: string;
}

function toInt(v: unknown, fallback = 1): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.floor(n));
}

function clampScore(v: unknown, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function parseModelJson(raw: string): Record<string, unknown> | null {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  if (!cleaned) return null;

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function fallbackStartQuestion(role: string, company: string | null): Record<string, unknown> {
  return {
    question: `Hi, I'm Alex${company ? ` from ${company}` : ""}. Thanks for joining today. Can you walk me through one recent project most relevant to a ${role} role, including your specific impact and outcomes?`,
  };
}

function fallbackAnswer(questionNumber: number): Record<string, unknown> {
  const isFinished = questionNumber >= TOTAL_QUESTIONS;
  return {
    feedback: {
      feedback: "Thanks for that response. I’m looking for clearer structure, stronger specifics, and measurable outcomes in each answer.",
      score: 5,
      strengths: ["Maintained response flow"],
      weaknesses: ["Need more specifics and quantifiable impact"],
    },
    ...(isFinished
      ? { finished: true }
      : {
          question: `Let’s continue. Question ${questionNumber + 1} of ${TOTAL_QUESTIONS}: describe a high-stakes challenge you handled and the trade-offs you made.`,
          finished: false,
        }),
  };
}

function fallbackFinalAnalysis(): Record<string, unknown> {
  return {
    overallScore: 52,
    verdict: "Needs Work",
    summary: "You completed the interview, but many responses need stronger structure, clearer impact, and tighter role alignment.",
    dimensions: [
      { name: "Communication Clarity", score: 55, feedback: "Improve concision and answer structure." },
      { name: "Technical Depth", score: 50, feedback: "Add concrete implementation detail and trade-off reasoning." },
      { name: "Relevance & Structure", score: 52, feedback: "Use STAR consistently and connect directly to the role." },
      { name: "Confidence & Delivery", score: 54, feedback: "Delivery is steady; improve precision and pacing under pressure." },
      { name: "Handling Pushback", score: 49, feedback: "Strengthen follow-up handling with evidence and clear rationale." },
    ],
    strengths: ["Consistent participation", "Maintained composure in most answers", "Showed willingness to elaborate"],
    improvements: ["Use STAR format", "Quantify outcomes", "Reference specific decisions and constraints"],
    voiceAnalysis: {
      pace: "Generally steady pace.",
      fillerWords: "Reduce filler words for stronger impact.",
      responseTime: "Response time was acceptable.",
      overallDelivery: "Good baseline delivery with room to sharpen clarity.",
    },
    questionBreakdown: [{ questionNumber: 1, score: 5, highlight: "Provide more concrete examples and impact metrics." }],
    nextSteps: [
      "Practice 5 STAR stories with metrics.",
      "Prepare role-specific technical deep dives.",
      "Run another mock interview focused on concise, evidence-backed responses.",
    ],
  };
}

// Helper: create a WAV header for raw PCM16 audio data
function createWavHeader(dataLength: number, sampleRate = 24000, channels = 1, bitsPerSample = 16): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);

  view.setUint32(0, 0x52494646, false);
  view.setUint32(4, 36 + dataLength, true);
  view.setUint32(8, 0x57415645, false);
  view.setUint32(12, 0x666d7420, false);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, dataLength, true);

  return new Uint8Array(header);
}

// Generate human-like TTS using Gemini's native audio output
async function generateGeminiTTS(text: string, apiKey: string): Promise<string | null> {
  try {
    const cleanText = text.replace(/\*\*/g, "").replace(/---/g, "").replace(/#+\s/g, "").replace(/\n+/g, ". ").trim();
    if (!cleanText || cleanText.length < 5) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `You are a professional hiring manager named Alex conducting a real job interview. Speak the following text naturally, as if you're sitting across a table from the candidate. Use a calm, warm, authoritative tone with natural rhythm — vary your pacing, add slight emphasis on key words, and include natural micro-pauses between phrases. Do NOT sound like you're reading from a script. Sound like a real human having a thoughtful conversation. Just speak the text, nothing extra:\n\n${cleanText}` }],
            },
          ],
          generationConfig: {
            response_modalities: ["AUDIO"],
            speech_config: {
              voice_config: {
                prebuilt_voice_config: {
                  voice_name: "Orus",
                },
              },
            },
          },
        }),
      },
    ).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      console.error("Gemini TTS failed:", response.status);
      return null;
    }

    const result = await response.json();
    const audioPart = result.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData?.mimeType?.startsWith("audio/")
    );

    if (!audioPart?.inlineData?.data) {
      console.error("No audio data in Gemini TTS response");
      return null;
    }

    const rawBase64 = audioPart.inlineData.data;
    const binaryStr = atob(rawBase64);
    const pcmBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      pcmBytes[i] = binaryStr.charCodeAt(i);
    }

    const wavHeader = createWavHeader(pcmBytes.length, 24000, 1, 16);
    const wavBuffer = new Uint8Array(wavHeader.length + pcmBytes.length);
    wavBuffer.set(wavHeader, 0);
    wavBuffer.set(pcmBytes, wavHeader.length);

    let wavBase64 = "";
    const CHUNK_SIZE = 8192;
    for (let i = 0; i < wavBuffer.length; i += CHUNK_SIZE) {
      wavBase64 += String.fromCharCode(...wavBuffer.slice(i, i + CHUNK_SIZE));
    }
    wavBase64 = btoa(wavBase64);

    return `data:audio/wav;base64,${wavBase64}`;
  } catch (error) {
    console.error("Gemini TTS error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const action = typeof body?.action === "string" ? body.action : "";
    const role = typeof body?.role === "string" && body.role.trim() ? body.role.trim() : "Candidate";
    const company = typeof body?.company === "string" ? body.company.trim() : "";
    const interviewType = typeof body?.interviewType === "string" && body.interviewType.trim()
      ? body.interviewType.trim()
      : "behavioral";
    const resumeData = body?.resumeData;
    const voiceMetrics = body?.voiceMetrics ?? null;
    const jobDescription = typeof body?.jobDescription === "string" ? body.jobDescription : "";
    const questionNumber = toInt(body?.questionNumber, 1);
    const conversation: ConversationMessage[] = Array.isArray(body?.conversation)
      ? body.conversation
          .filter((m: ConversationMessage) => typeof m?.content === "string" && m.content.trim().length > 0)
          .slice(-80)
      : [];

    if (!["start", "answer", "final-analysis"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action. Use start, answer, or final-analysis." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    // ─── Extract structured resume context ───
    const resumeText = resumeData ? JSON.stringify(resumeData).substring(0, 5000) : "No structured resume provided.";
    const vulnerabilities = resumeData?.vulnerabilityScript || "None identified";
    const jdContext = jobDescription ? `\n\nJob Description (JD) provided by the candidate:\n"""${jobDescription.substring(0, 4000)}"""\n` : "";

    // ─── Check for empty/weak candidate answers ───
    const lastCandidateAnswer = (conversation || []).filter((m: any) => m.role === "candidate").pop()?.content || "";
    const answerTooShort = lastCandidateAnswer.trim().length < 15;
    const answerIsEmpty = lastCandidateAnswer.trim().length < 3;

    let systemPrompt: string;

    if (action === "start") {
      systemPrompt = `You are Alex, a seasoned Senior Hiring Manager and industry veteran conducting a comprehensive ${interviewType} interview for a ${role} position${company ? ` at ${company}` : ""}. You have 15+ years of experience hiring for this exact role. This interview will have ${TOTAL_QUESTIONS} questions covering the candidate's entire professional background.

CRITICAL RULES — READ CAREFULLY:
1. You MUST craft questions ENTIRELY based on the candidate's specific resume — their projects, companies, technologies, metrics, and accomplishments.
2. NEVER ask generic questions. No "Tell me about yourself", no "What are your strengths."
3. EVERY question must reference something concrete from their resume or the JD.
4. Speak naturally — reference their actual company names, project names, technologies.

INTERVIEW STRUCTURE (${TOTAL_QUESTIONS} questions total):
- Questions 1-2: Deep-dive into their most recent/significant role and projects
- Questions 3-4: Technical depth probes on specific technologies/architectures from their resume
- Questions 5-6: Behavioral questions tied to specific experiences they listed
- Questions 7-8: JD-alignment questions (if JD provided) or domain expertise probes
- Questions 9-10: Situational/problem-solving tied to their industry experience
- Questions 11-12: Pushback/stress questions challenging claims on their resume

Resume Context:
${resumeText}

Resume Vulnerabilities/Gaps: ${JSON.stringify(vulnerabilities)}${jdContext}

Instructions for Question 1:
1. Introduce yourself: "Hi, I'm Alex, [title] here at ${company || "the company"}. Thanks for coming in today."
2. Ask ONE specific question about their most prominent/recent project or role from their resume.
   Example: "I'm looking at your work on [specific project] at [company] — you mention [specific metric or achievement]. Walk me through the technical decisions that led to that result."
3. Do NOT ask them to "walk through their resume" generically.

Return ONLY valid JSON:
{"question": "your specific, resume-tailored interview question here"}`;

    } else if (action === "final-analysis") {
      // ─── Analyze the ACTUAL transcript ───
      const candidateAnswers = (conversation || []).filter((m: any) => m.role === "candidate");
      const totalWords = candidateAnswers.reduce((sum: number, m: any) => sum + (m.content?.split(/\s+/).length || 0), 0);
      const emptyAnswers = candidateAnswers.filter((m: any) => (m.content?.trim().length || 0) < 15).length;

      systemPrompt = `You are an expert interview performance analyst. Provide a BRUTALLY HONEST assessment of a completed ${TOTAL_QUESTIONS}-question mock interview for: ${role}${company ? ` at ${company}` : ""}.

SCORING RULES — NON-NEGOTIABLE:
- Analyze ONLY the ACTUAL content of each answer in the transcript.
- Empty/silence/gibberish (<15 chars) = 0-1 out of 10. NO EXCEPTIONS.
- If all answers were empty: overall score MUST be 5-15/100, verdict "Significant Gaps".
- Total words spoken: ${totalWords}. Empty answers: ${emptyAnswers}/${candidateAnswers.length}.
- If total words < 100, the candidate barely participated — score accordingly.
- Reference specific phrases from the candidate's actual answers in your feedback.
- Evaluate how well answers align with the ${role} role requirements.

${jdContext ? `Evaluate alignment with Job Description:\n${jdContext}` : ""}

${voiceMetrics ? `Voice delivery metrics:
- Average WPM: ${voiceMetrics.avgWPM}
- Filler words: ${voiceMetrics.fillerCount}
- Avg response time: ${voiceMetrics.avgResponseTime}s
- Longest pause: ${voiceMetrics.longestPause}s` : ""}

Return ONLY valid JSON:
{
  "overallScore": <1-100>,
  "verdict": "<Exceptional|Strong|Promising|Needs Work|Significant Gaps>",
  "summary": "<2-3 sentences citing specific answers>",
  "dimensions": [
    {"name": "Communication Clarity", "score": <1-100>, "feedback": "<cite specific phrases>"},
    {"name": "Technical Depth", "score": <1-100>, "feedback": "<evaluate technical substance>"},
    {"name": "Relevance & Structure", "score": <1-100>, "feedback": "<STAR method usage?>"},
    {"name": "Confidence & Delivery", "score": <1-100>, "feedback": "<voice metrics + quality>"},
    {"name": "Handling Pushback", "score": <1-100>, "feedback": "<how they handled tough probes>"}
  ],
  "strengths": ["<strength with specific example>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement with example>", "<improvement 2>", "<improvement 3>"],
  "voiceAnalysis": {
    "pace": "<feedback>",
    "fillerWords": "<feedback>",
    "responseTime": "<feedback>",
    "overallDelivery": "<feedback>"
  },
  "questionBreakdown": [
    {"questionNumber": 1, "score": <1-10>, "highlight": "<what they said or 'No answer'>"}
  ],
  "nextSteps": ["<actionable step 1>", "<step 2>", "<step 3>"]
}`;

    } else {
      // ─── Answer evaluation + next question ───
      const emptyNotice = answerIsEmpty
        ? "\n\n⚠️ THE CANDIDATE'S ANSWER WAS EMPTY. Score 0-1/10."
        : answerTooShort
        ? "\n\n⚠️ THE CANDIDATE'S ANSWER WAS EXTREMELY SHORT. Score 1-3/10 max."
        : "";

      // Determine question phase for guidance
      let phaseGuidance = "";
      const nextQ = questionNumber + 1;
      if (nextQ <= 2) {
        phaseGuidance = `PHASE: Deep-dive into their roles/projects. Ask about a SPECIFIC project, system, or achievement from their resume that you haven't covered yet. Reference exact names, technologies, or metrics from their resume.`;
      } else if (nextQ <= 4) {
        phaseGuidance = `PHASE: Technical depth. Probe their technical expertise on a SPECIFIC technology, architecture, or system they mentioned. Ask them to explain a technical decision, trade-off, or debugging scenario from one of their projects.`;
      } else if (nextQ <= 6) {
        phaseGuidance = `PHASE: Behavioral deep-dive. Frame a behavioral question around a SPECIFIC situation from their resume. "You mentioned [X] at [company] — tell me about a time during that project where you had to [challenge]." Use STAR probing.`;
      } else if (nextQ <= 8) {
        phaseGuidance = jobDescription
          ? `PHASE: JD alignment. Ask about a SPECIFIC requirement from the Job Description that overlaps with their experience. "The JD mentions [requirement] — based on your work at [company], how would you approach [scenario]?"`
          : `PHASE: Domain expertise. Probe their domain knowledge related to ${role}. Ask about industry trends, best practices, or how they'd handle a real scenario your team faces.`;
      } else if (nextQ <= 10) {
        phaseGuidance = `PHASE: Problem-solving & situational. Present a REALISTIC scenario that ${company || "a company"} might face. "We're currently dealing with [challenge related to their domain]. Given your experience with [reference resume item], how would you approach this?"`;
      } else {
        phaseGuidance = `PHASE: Stress/pushback questions. Challenge a specific claim from their resume or a weak point in their previous answers. Push back on something they said — "You mentioned [X], but what about [counter-scenario]?" Test their composure and depth.`;
      }

      // Build follow-up guidance based on the last answer quality
      let followUpGuidance = "";
      if (!answerIsEmpty && !answerTooShort) {
        followUpGuidance = `
FOLLOW-UP STRATEGY based on their last answer:
- If their answer was vague or surface-level: Dig DEEPER. Ask "Can you be more specific about [aspect]?" or probe the exact technical details.
- If their answer was strong: Acknowledge it briefly, then move to a harder variation or adjacent topic from their resume.
- If they mentioned something interesting you haven't explored: Follow up on that specific thread.
- Always connect back to their resume or the JD — never ask a standalone generic question.`;
      }

      systemPrompt = `You are Alex, a seasoned Senior Hiring Manager. This is question #${questionNumber} of ${TOTAL_QUESTIONS} for a ${role} position${company ? ` at ${company}` : ""} (${interviewType}).

Resume: ${resumeText.substring(0, 3000)}
Vulnerabilities: ${JSON.stringify(vulnerabilities)}${jdContext}${emptyNotice}

SCORING RULES:
- Empty/silence = 0-1/10. Short/vague = 1-3/10. Never score above 3 for <15 chars.
- Score based ONLY on what was actually said.

Evaluate the candidate's last answer. Be constructive but STRICT.

${questionNumber >= TOTAL_QUESTIONS
  ? `This is the LAST question (#${TOTAL_QUESTIONS}). Give detailed feedback. Return finished:true. Do NOT ask another question.`
  : `Give feedback, then ask the NEXT question (#${nextQ} of ${TOTAL_QUESTIONS}).

${phaseGuidance}
${followUpGuidance}

CRITICAL: The next question MUST:
1. Reference something SPECIFIC from their resume (project name, company, technology, metric)
2. NOT repeat any topic already covered in previous questions
3. Feel like a natural conversation flow — not a random jump`}

Return ONLY valid JSON:
${questionNumber >= TOTAL_QUESTIONS
  ? '{"feedback":{"feedback":"<detailed feedback>","score":<0-10>,"strengths":["<strength>"],"weaknesses":["<weakness>"]},"finished":true}'
  : '{"feedback":{"feedback":"<detailed feedback>","score":<0-10>,"strengths":["<strength>"],"weaknesses":["<weakness>"]},"question":"<your tailored question>","finished":false}'}`;
    }

    const messages: Array<{ role: "user" | "model"; content: string }> = [];

    if (action === "start") {
      messages.push({
        role: "user",
        content: `Start the interview. Candidate resume:\n${resumeText}\n\n${jobDescription ? `Job Description:\n${jobDescription}` : "No JD provided."}`,
      });
    } else {
      for (const m of conversation) {
        messages.push({
          role: m.role === "interviewer" ? "model" : "user",
          content: String(m.content || ""),
        });
      }
      if (action === "final-analysis") {
        messages.push({ role: "user", content: "Provide the comprehensive final analysis based on the ACTUAL transcript above." });
      }
    }

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: messages.map((m) => ({
          role: m.role,
          parts: [{ text: m.content }],
        })),
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          responseMimeType: "application/json",
          temperature: action === "final-analysis" ? 0.4 : 0.7,
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text().catch(() => "");
      throw new Error(`AI error: ${response.status}${errText ? ` - ${errText.slice(0, 300)}` : ""}`);
    }

    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let parsed = parseModelJson(content);

    if (!parsed) {
      console.error("Failed to parse model JSON response, using fallback");
      parsed = action === "start"
        ? fallbackStartQuestion(role, company || null)
        : action === "final-analysis"
          ? fallbackFinalAnalysis()
          : fallbackAnswer(questionNumber);
    }

    if (action === "start") {
      if (typeof parsed.question !== "string" || !parsed.question.trim()) {
        parsed = fallbackStartQuestion(role, company || null);
      }
    }

    if (action === "answer") {
      const hasFeedback = parsed.feedback && typeof parsed.feedback === "object";
      if (!hasFeedback) {
        parsed = fallbackAnswer(questionNumber);
      } else {
        const feedback = parsed.feedback as Record<string, unknown>;
        feedback.score = clampScore(feedback.score, 0, 10, 5);
        if (typeof parsed.finished !== "boolean") {
          parsed.finished = questionNumber >= TOTAL_QUESTIONS;
        }
        if (!parsed.finished && (typeof parsed.question !== "string" || !String(parsed.question).trim())) {
          parsed.question = `Question ${questionNumber + 1} of ${TOTAL_QUESTIONS}: tell me about a high-impact challenge you solved and the measurable result.`;
        }
      }
    }

    if (action === "final-analysis") {
      const dims = Array.isArray(parsed.dimensions) ? parsed.dimensions : [];
      if (dims.length === 0 || typeof parsed.overallScore !== "number") {
        parsed = fallbackFinalAnalysis();
      } else {
        parsed.overallScore = clampScore(parsed.overallScore, 1, 100, 50);
      }
    }

    // Generate TTS audio for the question
    if (parsed.question && action !== "final-analysis") {
      try {
        const audioDataUri = await generateGeminiTTS(parsed.question, GEMINI_API_KEY);
        if (audioDataUri) {
          parsed.audio_data = audioDataUri;
        }
      } catch (ttsErr) {
        console.error("TTS generation failed:", ttsErr);
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mock-interview error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
