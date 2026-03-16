import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type FocusArea = "all" | "ats" | "parsing" | "content" | "recruiter" | "structure" | "ai-detection";

const VALID_FOCUS_AREAS: FocusArea[] = ["all", "ats", "parsing", "content", "recruiter", "structure", "ai-detection"];
const MAX_CONTEXT_CHARS = 18000;

const MODEL_CHAIN = [
  { model: "gemini-2.5-flash", maxTokens: 12000, timeoutMs: 70_000 },
  { model: "gemini-1.5-pro", maxTokens: 12000, timeoutMs: 75_000 },
  { model: "gemini-1.5-flash-latest", maxTokens: 10000, timeoutMs: 65_000 },
];

function toRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" ? (value as Record<string, any>) : {};
}

function toArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toText(value: unknown, maxLength = 180): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function toNumericString(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? `${Math.round(n)}` : "";
}

function toListText(value: unknown, itemLimit = 6, itemMaxLength = 72): string {
  const items = toArray(value)
    .map((item) => toText(item, itemMaxLength))
    .filter(Boolean)
    .slice(0, itemLimit);
  return items.join("; ");
}

function appendSection(target: string[], title: string, lines: string[]) {
  const cleanLines = lines.map((line) => toText(line, 420)).filter(Boolean);
  if (!cleanLines.length) return;
  target.push(`## ${title}`);
  for (const line of cleanLines) target.push(`- ${line}`);
  target.push("");
}

function parseApiErrorMessage(raw: string): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.error === "string" && parsed.error.trim()) return parsed.error.trim();
    if (typeof parsed?.message === "string" && parsed.message.trim()) return parsed.message.trim();
    if (typeof parsed?.error?.message === "string" && parsed.error.message.trim()) return parsed.error.message.trim();
  } catch {
    // no-op; use raw fallback
  }
  return raw.replace(/\s+/g, " ").trim().slice(0, 220);
}

function extractJsonObject(content: string): unknown {
  const cleaned = (content || "").replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  if (!cleaned) throw new Error("AI returned an empty response.");

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Failed to parse AI response as JSON.");
    return JSON.parse(match[0]);
  }
}

function sanitizeResumeForPrompt(value: unknown, depth = 0): unknown {
  if (depth > 10) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^data:/i.test(trimmed)) return "";
    return trimmed.length > 1800 ? `${trimmed.slice(0, 1800)}…` : trimmed;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 60).map((item) => sanitizeResumeForPrompt(item, depth + 1));
  }

  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(input)) {
      if (key === "photoUrl" || key === "photo_url" || key === "avatar") {
        output[key] = "";
        continue;
      }
      output[key] = sanitizeResumeForPrompt(entry, depth + 1);
    }
    return output;
  }

  return value;
}

async function callFixModel(apiKey: string, messages: Array<{ role: string; content: string }>): Promise<string> {
  let lastError = "Fix generation failed.";

  for (let i = 0; i < MODEL_CHAIN.length; i += 1) {
    const cfg = MODEL_CHAIN[i];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs);
    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: cfg.model,
          messages,
          max_tokens: cfg.maxTokens,
          temperature: 0.2,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status === 429) {
          throw Object.assign(new Error("Rate limit exceeded. Please retry in a moment."), { status: 429, noRetry: true });
        }
        if (response.status === 402) {
          throw Object.assign(new Error("AI credits exhausted. Please add credits in workspace settings."), { status: 402, noRetry: true });
        }

        const rawError = await response.text();
        const parsedMessage = parseApiErrorMessage(rawError);
        lastError = parsedMessage || `AI gateway error (${response.status}).`;
        const retryable = response.status >= 500 || response.status === 408 || response.status === 409;
        if (!retryable || i === MODEL_CHAIN.length - 1) {
          throw Object.assign(new Error(lastError), { status: response.status });
        }
        continue;
      }

      const aiResult = await response.json();
      const content = aiResult?.choices?.[0]?.message?.content;
      if (!content || typeof content !== "string") {
        lastError = "AI response was empty.";
        if (i === MODEL_CHAIN.length - 1) throw new Error(lastError);
        continue;
      }

      // Validate parseability before returning to caller.
      extractJsonObject(content);
      return content;
    } catch (e: any) {
      clearTimeout(timeout);

      if (e?.noRetry) throw e;

      const timedOut = e?.name === "AbortError";
      lastError = timedOut ? "Fix generation timed out. Please retry." : (e?.message || lastError);
      if (i === MODEL_CHAIN.length - 1) {
        throw Object.assign(new Error(lastError), { status: e?.status || 500 });
      }
    }
  }

  throw new Error(lastError);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = await req.json();
    const {
      resumeData,
      focusArea: focusAreaInput = "all",
      scores,
      improvementRoadmap,
      atsAnalysis,
      parsingAnalysis,
      recruiterAnalysis,
      contentAnalysis,
      structureAnalysis,
      humanizerAnalysis,
    } = payload || {};

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    if (!resumeData) throw new Error("Resume data is required");

    const focusArea = VALID_FOCUS_AREAS.includes(focusAreaInput as FocusArea)
      ? (focusAreaInput as FocusArea)
      : "all";

    // Build context from available analysis
    const contextSections: string[] = [];
    const include = (area: string) => !focusArea || focusArea === "all" || focusArea === area;
    const focusLabelMap: Record<string, string> = {
      ats: "ATS",
      parsing: "Parsing",
      content: "Content Quality",
      recruiter: "Recruiter View",
      structure: "Structure",
      "ai-detection": "AI Detection",
      all: "All Dimensions",
    };
    const roadmap = toRecord(improvementRoadmap);
    const ats = toRecord(atsAnalysis);
    const parsing = toRecord(parsingAnalysis);
    const recruiter = toRecord(recruiterAnalysis);
    const content = toRecord(contentAnalysis);
    const structure = toRecord(structureAnalysis);
    const humanizer = toRecord(humanizerAnalysis);
    const scoreMap = toRecord(scores);

    const immediateLines = toArray(roadmap.immediate_fixes).slice(0, 10).map((fix: any) => {
      const obj = toRecord(fix);
      const action = toText(obj.action, 80);
      const current = toText(obj.current, 120);
      const improved = toText(obj.improved, 120);
      const impact = toText(obj.impact, 40);
      return [action && `Action: ${action}`, current && `Current: ${current}`, improved && `Improved: ${improved}`, impact && `Impact: ${impact}`]
        .filter(Boolean)
        .join(" | ");
    });
    appendSection(contextSections, "IMMEDIATE FIXES TO APPLY", immediateLines);

    const shortTermLines = toArray(roadmap.short_term_improvements).slice(0, 8).map((imp: any) => {
      const obj = toRecord(imp);
      const action = toText(obj.action, 80);
      const rationale = toText(obj.rationale, 140);
      const impact = toText(obj.impact, 40);
      return [action, rationale && `Why: ${rationale}`, impact && `Impact: ${impact}`].filter(Boolean).join(" | ");
    });
    appendSection(contextSections, "SHORT-TERM IMPROVEMENTS", shortTermLines);

    const sectionRewriteLines = toArray(roadmap.section_by_section_rewrites).slice(0, 8).map((sec: any) => {
      const obj = toRecord(sec);
      const section = toText(obj.section, 50);
      const grade = toText(obj.current_grade, 12);
      const issues = toListText(obj.issues, 4, 70);
      const rewrites = toListText(obj.rewrite_suggestions, 4, 70);
      return [
        section && `Section: ${section}`,
        grade && `Grade: ${grade}`,
        issues && `Issues: ${issues}`,
        rewrites && `Suggestions: ${rewrites}`,
      ].filter(Boolean).join(" | ");
    });
    appendSection(contextSections, "SECTION REWRITES NEEDED", sectionRewriteLines);

    if (include("ats")) {
      const weakChecks = toArray(ats.checks)
        .filter((check: any) => toText(toRecord(check).status, 20) !== "pass")
        .slice(0, 8)
        .map((check: any) => {
          const obj = toRecord(check);
          const label = toText(obj.label, 50);
          const detail = toText(obj.detail, 140);
          return [label, detail].filter(Boolean).join(": ");
        });
      const lines = [
        toText(ats.pass_likelihood, 30) && `Pass likelihood: ${toText(ats.pass_likelihood, 30)}`,
        toListText(ats.missing_keywords, 12, 28) && `Missing keywords: ${toListText(ats.missing_keywords, 12, 28)}`,
        toListText(ats.formatting_issues, 6, 68) && `Formatting issues: ${toListText(ats.formatting_issues, 6, 68)}`,
        ...weakChecks,
      ].filter(Boolean) as string[];
      appendSection(contextSections, "ATS PRIORITIES", lines);
    }

    if (include("parsing")) {
      const weakFields = toArray(parsing.fields)
        .filter((field: any) => toText(toRecord(field).status, 20) !== "clean")
        .slice(0, 8)
        .map((field: any) => {
          const obj = toRecord(field);
          const name = toText(obj.field, 45);
          const status = toText(obj.status, 24);
          const note = toText(obj.note, 110);
          return [name && `${name}: ${status || "needs cleanup"}`, note].filter(Boolean).join(" | ");
        });
      const dateConsistency = toRecord(parsing.date_consistency);
      const lines = [
        toText(parsing.overall_extractability, 30) && `Overall extractability: ${toText(parsing.overall_extractability, 30)}`,
        !dateConsistency.consistent && toListText(dateConsistency.issues, 4, 70) && `Date consistency issues: ${toListText(dateConsistency.issues, 4, 70)}`,
        ...weakFields,
      ].filter(Boolean) as string[];
      appendSection(contextSections, "PARSING PRIORITIES", lines);
    }

    if (include("recruiter")) {
      const issueLines = toArray(recruiter.issues).slice(0, 8).map((issue: any) => {
        const obj = toRecord(issue);
        const problem = toText(obj.issue, 120);
        const fix = toText(obj.fix, 120);
        return [problem, fix && `Fix: ${fix}`].filter(Boolean).join(" | ");
      });
      const lines = [
        toText(recruiter.first_impression, 180) && `First impression: ${toText(recruiter.first_impression, 180)}`,
        toText(toRecord(recruiter.six_second_scan).immediate_verdict, 140) && `6-second verdict: ${toText(toRecord(recruiter.six_second_scan).immediate_verdict, 140)}`,
        toListText(recruiter.missed, 6, 60) && `What recruiters miss: ${toListText(recruiter.missed, 6, 60)}`,
        ...issueLines,
      ].filter(Boolean) as string[];
      appendSection(contextSections, "RECRUITER VIEW PRIORITIES", lines);
    }

    if (include("content")) {
      const weakBullets = toArray(content.bullets)
        .filter((bullet: any) => toText(toRecord(bullet).strength, 16) === "weak")
        .slice(0, 10)
        .map((bullet: any) => {
          const obj = toRecord(bullet);
          const original = toText(obj.text, 120);
          const issue = toText(obj.issue, 90);
          const fix = toText(obj.fix, 110);
          return [original && `Original: "${original}"`, issue && `Issue: ${issue}`, fix && `Fix: ${fix}`].filter(Boolean).join(" | ");
        });
      appendSection(contextSections, "WEAK BULLETS TO FIX", weakBullets);
    }

    if (include("structure")) {
      const missingSections = toListText(structure.missing_sections, 6, 34);
      const orderIssues = toListText(structure.section_order_issues, 8, 70);
      const lines = [
        missingSections && `Missing sections: ${missingSections}`,
        orderIssues && `Section order issues: ${orderIssues}`,
      ].filter(Boolean) as string[];
      appendSection(contextSections, "STRUCTURE PRIORITIES", lines);
    }

    if (include("ai-detection")) {
      const detectionLines = toArray(humanizer.detections).slice(0, 6).map((detection: any) => {
        const obj = toRecord(detection);
        const original = toText(obj.original, 110);
        const issue = toText(obj.issue, 80);
        const better = toText(obj.humanized, 110);
        return [original && `Problem text: "${original}"`, issue && `Issue: ${issue}`, better && `Better: "${better}"`]
          .filter(Boolean)
          .join(" | ");
      });
      const probability = toNumericString(humanizer.ai_probability);
      const lines = [
        toText(humanizer.verdict, 36) && `Verdict: ${toText(humanizer.verdict, 36)}`,
        probability && `AI probability: ${probability}%`,
        toListText(humanizer.flags, 6, 70) && `Red flags: ${toListText(humanizer.flags, 6, 70)}`,
        ...detectionLines,
      ].filter(Boolean) as string[];
      appendSection(contextSections, "AI DETECTION / HUMAN AUTHENTICITY PRIORITIES", lines);
    }

    const scoreSnapshotLines = [
      include("ats") && scoreMap.ats?.score !== undefined ? `ATS: ${scoreMap.ats.score}` : "",
      include("parsing") && scoreMap.parsing?.score !== undefined ? `Parsing: ${scoreMap.parsing.score}` : "",
      include("recruiter") && scoreMap.recruiter_readability?.score !== undefined ? `Recruiter readability: ${scoreMap.recruiter_readability.score}` : "",
      include("content") && scoreMap.content_quality?.score !== undefined ? `Content quality: ${scoreMap.content_quality.score}` : "",
      include("structure") && scoreMap.structure?.score !== undefined ? `Structure: ${scoreMap.structure.score}` : "",
      include("ai-detection") && scoreMap.human_authenticity?.score !== undefined ? `Human authenticity: ${scoreMap.human_authenticity.score}` : "",
    ].filter(Boolean) as string[];
    appendSection(contextSections, "SCORE SNAPSHOT", scoreSnapshotLines);

    let analysisContext = contextSections.join("\n").trim();
    if (analysisContext.length > MAX_CONTEXT_CHARS) {
      analysisContext = analysisContext.slice(0, MAX_CONTEXT_CHARS) + "\n\n[Context truncated for request-size safety]";
    }

    const focusLabel = focusLabelMap[focusArea] || "All Dimensions";
    const resumeForPrompt = sanitizeResumeForPrompt(resumeData);

    const systemPrompt = `You are an expert resume editor. You will receive a resume in JSON format and analysis feedback with specific improvements to apply.

Your job is to return the IMPROVED resume JSON with all fixes applied. Follow these rules:
1. Primary focus area: ${focusLabel}. Prioritize this area most.
2. Apply every immediate fix from the analysis context.
3. Rewrite weak bullets to be stronger (metrics, action verbs, quantified impact).
4. Improve summary and critical lines based on feedback.
5. Keep the exact same JSON structure — only change content values.
6. Do NOT add or remove fields, only update existing values.
7. Make bullets concise (1-2 lines), starting with strong action verbs.
8. Remove vague language and replace with specific, credible achievements.
9. Preserve factual consistency; do not invent unrealistic claims.
10. Keep edits concise and role-relevant. Do not over-write every line.

Return ONLY the valid JSON object, no markdown, no explanation.`;

    const content = await callFixModel(GEMINI_API_KEY, [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Here is the current resume data:\n\`\`\`json\n${JSON.stringify(resumeForPrompt)}\n\`\`\`\n\nHere is the analysis feedback to apply:\n${analysisContext}\n\nApply all relevant fixes for "${focusLabel}" and return the improved resume JSON only.`,
      },
    ]);

    const improvedResume = extractJsonObject(content);

    return new Response(JSON.stringify({ improvedResume }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("apply-analysis-fixes error:", e);
    const status = typeof e?.status === "number" ? e.status : 500;
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
