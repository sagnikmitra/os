import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert resume analyst combining recruiting, ATS engineering, and career coaching expertise. Perform a thorough multi-dimensional analysis applying STAR/XYZ auditing, ATS simulation, cognitive load assessment, competency mapping, and bias scanning.

Return ONLY valid JSON (no markdown, no extra text) with this structure:

{
  "full_raw_text": "<the entire original resume content extracted via OCR or direct text, preserved exactly with all bullet points and details>",
  "extracted_info": {
    "name": "<full name>",
    "email": "<email>",
    "phone": "<phone>",
    "linkedin": "<linkedin url>",
    "portfolio": "<portfolio url>",
    "location": "<location>",
    "current_title": "<most recent title>",
    "current_company": "<most recent company>",
    "total_experience_years": "<estimated years>",
    "education_summary": "<highest degree + institution>",
    "skills_count": <number of distinct skills listed>,
    "certifications": ["<cert1>", "<cert2>"]
  },
  "scores": {
    "ats": { "score": <0-100>, "summary": "<2-3 sentences with specifics>" },
    "parsing": { "score": <0-100>, "summary": "<2-3 sentences>" },
    "recruiter_readability": { "score": <0-100>, "summary": "<2-3 sentences>" },
    "content_quality": { "score": <0-100>, "summary": "<2-3 sentences>" },
    "human_authenticity": { "score": <0-100>, "summary": "<2-3 sentences>" },
    "impact_strength": { "score": <0-100>, "summary": "<2-3 sentences>" },
    "structure": { "score": <0-100>, "summary": "<2-3 sentences>" },
    "clarity": { "score": <0-100>, "summary": "<2-3 sentences>" },
    "strategic_positioning": { "score": <0-100>, "summary": "<2-3 sentences>" }
  },
  "ats_analysis": {
    "pass_likelihood": "<High|Moderate|Low>",
    "estimated_rank_percentile": <1-100>,
    "checks": [
      { "label": "<check name>", "status": "<pass|warning|fail>", "detail": "<specific explanation>", "category": "<formatting|keywords|structure|contact|compatibility>" }
    ],
    "matched_keywords": ["<actual keywords found>"],
    "missing_keywords": ["<important missing keywords for their target role>"],
    "keyword_density": {
      "total_keywords": <number>,
      "unique_keywords": <number>,
      "top_repeated": [{"keyword": "<word>", "count": <n>}],
      "industry_coverage": "<percentage or qualitative>"
    },
    "ats_simulation": {
      "greenhouse": { "parse_success": <0-100>, "issues": ["<issue>"] },
      "lever": { "parse_success": <0-100>, "issues": ["<issue>"] },
      "workday": { "parse_success": <0-100>, "issues": ["<issue>"] },
      "taleo": { "parse_success": <0-100>, "issues": ["<issue>"] }
    },
    "recommendations": [
      { "priority": "<critical|risk|warning|strong>", "text": "<specific actionable recommendation>", "impact": "<high|medium|low>" }
    ],
    "formatting_issues": ["<specific formatting issue that may confuse ATS>"]
  },
  "parsing_analysis": {
    "overall_extractability": "<Excellent|Good|Fair|Poor>",
    "fields": [
      { "field": "<field name>", "extracted": "<actual extracted value>", "status": "<clean|partial|ambiguous|failed>", "note": "<explanation>", "confidence": <0-100> }
    ],
    "date_consistency": { "format_used": "<format>", "consistent": <true|false>, "issues": ["<issue>"] },
    "section_detection": [
      { "section": "<section name>", "detected": <true|false>, "header_text": "<actual header used>", "standard_header": "<recommended standard header>" }
    ]
  },
  "recruiter_analysis": {
    "first_impression": "<detailed 3-4 sentence first impression>",
    "six_second_scan": {
      "eye_path": ["<what the eye hits first>", "<second>", "<third>"],
      "immediate_verdict": "<hire/maybe/pass and why>",
      "clarity_of_role": "<clear|vague|confusing>",
      "seniority_read": "<what level they appear to be>",
      "f_pattern_score": <0-100>,
      "cognitive_load": "<low|moderate|high|overwhelming>"
    },
    "perceived_role": "<what role this person targets>",
    "perceived_level": "<Junior|Mid-Level|Senior|Lead|Principal|Executive>",
    "perceived_strength": "<main perceived strength>",
    "perceived_industry": "<what industry they seem to be in>",
    "noticed": ["<things noticed in 6 seconds>"],
    "missed": ["<things missed in quick scan>"],
    "emotional_response": "<what feeling the resume evokes>",
    "comparison_to_ideal": "<how they compare to an ideal candidate for their apparent target>",
    "issues": [
      { "issue": "<specific readability problem>", "severity": "<warning|risk>", "fix": "<how to fix it>" }
    ],
    "hiring_manager_notes": ["<what a hiring manager would think>"]
  },
  "content_analysis": {
    "strong_bullets": <count>,
    "weak_bullets": <count>,
    "total_bullets": <total>,
    "metrics_used": <count with measurable metrics>,
    "action_verbs_used": ["<list of action verbs found>"],
    "repeated_verbs": ["<verbs used more than once>"],
    "star_compliance": { "complete": <count>, "partial": <count>, "missing": <count> },
    "xyz_compliance": { "complete": <count>, "partial": <count>, "missing": <count> },
    "bullets": [
      { "text": "<exact bullet from resume>", "strength": "<strong|weak>", "issue": "<specific problem>", "fix": "<specific rewrite using XYZ format>", "section": "<which job/section>", "has_metric": <true|false>, "verb": "<leading verb>", "star_score": <0-4>, "xyz_score": <0-3> }
    ],
    "issues": ["<content issue>"],
    "quantification_depth": {
      "score": <0-100>,
      "bullets_with_numbers": <count>,
      "bullets_with_percentages": <count>,
      "bullets_with_dollar_amounts": <count>,
      "bullets_with_time_frames": <count>,
      "recommendations": ["<how to add more quantification>"]
    },
    "redundancy_report": ["<phrases or concepts that are repeated across bullets>"],
    "power_language_score": <0-100>
  },
  "humanizer_analysis": {
    "verdict": "<Sounds Human|Mostly Human|Mixed|Sounds AI-Generated|Heavily AI-Generated>",
    "ai_probability": <0-100>,
    "flags": ["<specific AI pattern detected>"],
    "tone_analysis": {
      "overall_tone": "<professional|corporate|casual|academic|robotic>",
      "consistency": "<consistent|inconsistent>",
      "personality_score": <0-100>,
      "voice_uniqueness": "<unique|generic|templated>"
    },
    "vocabulary_analysis": {
      "diversity_score": <0-100>,
      "overused_buzzwords": ["<buzzword>"],
      "cliche_phrases": ["<cliche found in resume>"],
      "jargon_level": "<appropriate|excessive|insufficient>"
    },
    "detections": [
      { "original": "<exact text that sounds AI/generic>", "severity": "<critical|risk|warning>", "issue": "<why it sounds fake>", "humanized": "<specific authentic rewrite>", "category": "<buzzword|template|ai_pattern|cliche|over_polished>" }
    ]
  },
  "structure_analysis": {
    "sections": [
      { "name": "<section name>", "status": "<excellent|strong|warning|critical>", "notes": "<specific assessment>", "score": <0-100>, "word_count": <approximate>, "position": <order number>, "recommended_position": <ideal order number> }
    ],
    "seniority_signal": "<Junior|Mid-Level|Senior|Lead|Principal|Executive>",
    "layout_assessment": {
      "page_count": <number>,
      "ideal_page_count": <number>,
      "white_space": "<too much|balanced|too dense>",
      "visual_hierarchy": "<clear|moderate|poor>",
      "section_balance": "<balanced|top-heavy|bottom-heavy>"
    },
    "mece_assessment": {
      "mutually_exclusive": <true|false>,
      "collectively_exhaustive": <true|false>,
      "overlapping_sections": ["<sections that overlap>"],
      "missing_coverage": ["<important areas not covered>"]
    },
    "missing_sections": ["<important sections not found>"],
    "unnecessary_sections": ["<sections that should be removed>"],
    "section_order_issues": ["<specific ordering problems>"]
  },
  "skills_analysis": {
    "technical_skills": ["<tech skill found>"],
    "soft_skills": ["<soft skill found>"],
    "tools_platforms": ["<tool/platform found>"],
    "missing_for_role": ["<skills expected for their target role but not listed>"],
    "skill_evidence": [
      { "skill": "<skill claimed>", "evidenced": <true|false>, "where": "<where in resume it's demonstrated or 'not found'>" }
    ],
    "skills_vs_experience_alignment": "<aligned|misaligned|partially aligned>",
    "onet_mapping": {
      "matched_occupation": "<closest O*NET occupation title>",
      "occupation_code": "<O*NET code>",
      "match_percentage": <0-100>,
      "missing_core_competencies": ["<competency expected but missing>"]
    }
  },
  "career_narrative": {
    "progression": "<ascending|lateral|descending|mixed>",
    "trajectory_strength": <0-100>,
    "gaps": [
      { "period": "<date range>", "duration": "<length>", "concern_level": "<none|minor|moderate|significant>" }
    ],
    "job_tenure_pattern": "<stable|average|job-hopper>",
    "average_tenure_months": <number>,
    "transitions": [
      { "from": "<role/company>", "to": "<role/company>", "type": "<promotion|lateral|pivot|downgrade>", "narrative_strength": "<strong|weak>" }
    ],
    "story_coherence": "<clear narrative|scattered|unclear direction>",
    "career_highlights": ["<standout achievement or milestone>"]
  },
  "competency_mapping": {
    "leadership": { "score": <0-100>, "evidence": ["<quote from resume>"], "gaps": ["<missing signal>"] },
    "technical_depth": { "score": <0-100>, "evidence": ["<quote>"], "gaps": ["<gap>"] },
    "communication": { "score": <0-100>, "evidence": ["<quote>"], "gaps": ["<gap>"] },
    "problem_solving": { "score": <0-100>, "evidence": ["<quote>"], "gaps": ["<gap>"] },
    "collaboration": { "score": <0-100>, "evidence": ["<quote>"], "gaps": ["<gap>"] },
    "innovation": { "score": <0-100>, "evidence": ["<quote>"], "gaps": ["<gap>"] },
    "business_impact": { "score": <0-100>, "evidence": ["<quote>"], "gaps": ["<gap>"] },
    "interview_extractable_competencies": ["<competency an interviewer can probe>"],
    "unsubstantiated_claims": ["<claim made without evidence>"]
  },
  "executive_presence": {
    "applicable": <true|false>,
    "strategic_thinking_signals": <0-100>,
    "p_and_l_ownership": <true|false>,
    "board_readiness_signals": <0-100>,
    "cross_functional_leadership": <0-100>,
    "transformation_narratives": ["<example of leading change>"],
    "executive_language_score": <0-100>,
    "gravitas_assessment": "<strong|moderate|weak|not applicable>"
  },
  "industry_benchmarking": {
    "target_role": "<inferred target role>",
    "target_level": "<inferred seniority>",
    "percentile_estimate": <1-100>,
    "strengths_vs_peers": ["<where this resume beats peers>"],
    "weaknesses_vs_peers": ["<where it falls behind>"],
    "market_positioning": "<overqualified|well-positioned|underqualified|misaligned>",
    "salary_signal": "<below market|at market|above market|unclear>"
  },
  "bias_scan": {
    "age_indicators": ["<phrases that may signal age>"],
    "gender_coded_language": [{ "phrase": "<phrase>", "coding": "<masculine|feminine|neutral>", "suggestion": "<neutral alternative>" }],
    "cultural_bias_flags": ["<potential cultural bias triggers>"],
    "overall_risk": "<low|moderate|high>",
    "recommendations": ["<how to make the resume more bias-neutral>"]
  },
  "interview_vulnerability": {
    "overall_risk_score": <0-100>,
    "cross_question_zones": [
      {
        "section": "<which section/role this belongs to>",
        "claim": "<exact text from resume that will be probed>",
        "risk_level": "<high|medium|low>",
        "why_risky": "<why an interviewer will dig into this>",
        "likely_questions": ["<specific question an interviewer would ask>", "<follow-up question>"],
        "preparation_advice": "<how to prepare for this line of questioning>",
        "ideal_answer_framework": "<STAR/situational framework for answering>"
      }
    ],
    "vague_claims": [
      {
        "text": "<exact vague claim from resume>",
        "problem": "<why this is vague>",
        "interviewer_reaction": "<what the interviewer will think>",
        "better_version": "<specific rewrite with metrics>",
        "follow_up_questions": ["<questions this vagueness invites>"]
      }
    ],
    "inflated_claims": [
      {
        "text": "<exact claim that sounds inflated>",
        "suspicion": "<why it seems inflated>",
        "verification_questions": ["<how an interviewer would verify this>"],
        "how_to_substantiate": "<how to make it credible>"
      }
    ],
    "technical_depth_probes": [
      {
        "skill_or_technology": "<skill listed on resume>",
        "depth_signal": "<superficial|working|proficient|expert>",
        "evidence_on_resume": "<what the resume shows about this skill>",
        "likely_technical_questions": ["<specific technical question>", "<deeper follow-up>"],
        "preparation_topics": ["<topic to study>"]
      }
    ],
    "gap_explanations_needed": [
      {
        "gap": "<career gap or transition>",
        "duration": "<how long>",
        "expected_question": "<what they'll ask>",
        "recommended_narrative": "<how to frame this positively>"
      }
    ],
    "behavioral_question_predictions": [
      {
        "competency": "<leadership|conflict|failure|innovation|teamwork|pressure|growth>",
        "question": "<specific behavioral question based on resume content>",
        "resume_evidence": "<what on the resume triggers this question>",
        "story_elements_available": "<what STAR elements exist vs missing>",
        "preparation_tip": "<how to prepare>"
      }
    ],
    "weakest_sections_for_interview": [
      {
        "section": "<section name>",
        "vulnerability": "<why this section is weak in interview context>",
        "improvement": "<how to strengthen it>"
      }
    ]
  },
  "consistency_audit": {
    "overall_consistency_score": <0-100>,
    "contradictions": [
      {
        "claim_a": "<first claim>",
        "location_a": "<where in resume>",
        "claim_b": "<contradicting claim>",
        "location_b": "<where in resume>",
        "conflict": "<explanation of contradiction>",
        "resolution": "<how to fix>"
      }
    ],
    "timeline_issues": [
      {
        "issue": "<overlapping dates, impossible timeline, etc>",
        "details": "<specific dates/roles involved>",
        "fix": "<how to correct>"
      }
    ],
    "skill_claim_mismatches": [
      {
        "claimed_skill": "<skill listed in skills section>",
        "experience_evidence": "<whether experience section supports it>",
        "mismatch_type": "<listed_but_unused|used_but_unlisted|overstated|understated>",
        "recommendation": "<how to align>"
      }
    ],
    "title_progression_issues": [
      {
        "issue": "<title doesn't match responsibilities, demotion disguised, etc>",
        "details": "<specifics>",
        "interviewer_concern": "<what the interviewer will wonder>"
      }
    ],
    "tone_shifts": [
      {
        "section_a": "<section with tone A>",
        "section_b": "<section with different tone>",
        "description": "<how the tones differ>",
        "concern": "<why this matters>"
      }
    ]
  },
  "improvement_roadmap": {
    "immediate_fixes": [
      {
        "action": "<specific action>",
        "current": "<what it says now (quote)>",
        "improved": "<exact rewrite>",
        "impact": "<high|medium|low>",
        "time_estimate": "<5 min|15 min|30 min|1 hour>"
      }
    ],
    "short_term_improvements": [
      {
        "action": "<what to do>",
        "rationale": "<why>",
        "impact": "<high|medium|low>",
        "time_estimate": "<1-2 hours|half day|1 day>"
      }
    ],
    "long_term_development": [
      {
        "area": "<skill gap or experience gap>",
        "recommendation": "<how to address>",
        "timeline": "<1 month|3 months|6 months>"
      }
    ],
    "section_by_section_rewrites": [
      {
        "section": "<section name>",
        "current_grade": "<A|B|C|D|F>",
        "issues": ["<issue>"],
        "rewrite_suggestions": ["<specific suggestion>"]
      }
    ]
  },
  "red_flags": ["<specific red flag with explanation>"],
  "priorities": [
    { "label": "<specific thing to fix>", "severity": "<critical|risk|warning>", "estimated_impact": "<high|medium|low>", "effort": "<quick fix|moderate|significant>", "framework": "<which framework identified this>" }
  ],
  "strengths": ["<specific strength found>"],
  "overall_verdict": {
    "grade": "<A+|A|A-|B+|B|B-|C+|C|C-|D|F>",
    "one_liner": "<one sentence verdict>",
    "ready_to_apply": <true|false>,
    "biggest_risk": "<single biggest issue>",
    "biggest_asset": "<single biggest strength>",
    "estimated_response_rate": "<percentage estimate for applications>",
    "top_3_actions": ["<most impactful action 1>", "<action 2>", "<action 3>"]
  }
}`;

const DETAIL_REQUIREMENTS = `DEPTH REQUIREMENTS (MANDATORY):
- Use evidence-based language with exact examples from the resume in every major section.
- Keep every score summary concrete (at least 2-4 evidence-backed sentences, no generic filler).
- Produce substantial recommendations:
  - ats_analysis.checks: at least 10 checks when possible
  - parsing_analysis.fields: at least 10 fields when possible
  - content_analysis.bullets: analyze all bullets up to 24 bullets (or all available if fewer)
  - recruiter_analysis.issues: at least 4 issues when weaknesses exist
  - improvement_roadmap.immediate_fixes: at least 6 actionable rewrites
  - priorities: at least 8 prioritized items
  - section_by_section_rewrites: at least 5 section entries when sections exist
  - interview_vulnerability.cross_question_zones: at least 6
- Each rewrite must be specific and realistic for the candidate's level; avoid inflated claims.
- Never output placeholders in final values.`;

const DEEP_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

You are operating in DEEP SCAN mode as a Principal Executive Recruiter and Head of ATS Strategy.

ADDITIONAL DEEP-SCAN DIRECTIVES:
- Audit against STAR, XYZ, MECE, recruiter 6-second scan, parser resilience, and interview defensibility.
- Analyze every meaningful bullet point and call out weak vs strong evidence explicitly.
- Tag priority findings with concrete framework rationale in the "framework" field.
- Be brutally honest but actionable: every critical weakness must have a specific fix.
- Provide richer benchmark context in industry_benchmarking and competency_mapping.
`;

function extractJsonFromResponse(response: string): unknown {
  let cleaned = response
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No JSON object found in response");
  }

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(cleaned);
  } catch (_e) {
    cleaned = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, (ch) => ch === '\n' || ch === '\t' ? ch : "")
      .replace(/\n/g, "\\n")
      .replace(/\t/g, "\\t");

    try {
      return JSON.parse(cleaned);
    } catch (_e2) {
      let bracketCount = 0;
      let squareCount = 0;
      for (const ch of cleaned) {
        if (ch === '{') bracketCount++;
        if (ch === '}') bracketCount--;
        if (ch === '[') squareCount++;
        if (ch === ']') squareCount--;
      }
      
      let recovered = cleaned.replace(/,\s*"[^"]*"?\s*:?\s*[^}\]]*$/, "");
      
      while (squareCount > 0) { recovered += "]"; squareCount--; }
      while (bracketCount > 0) { recovered += "}"; bracketCount--; }

      try {
        return JSON.parse(recovered);
      } catch (finalErr) {
        console.error("All JSON parse attempts failed");
        throw finalErr;
      }
    }
  }
}

function wordCount(value: unknown): number {
  if (typeof value !== "string") return 0;
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function nestedArrayLength(root: any, path: string[]): number {
  let cursor = root;
  for (const key of path) {
    if (!cursor || typeof cursor !== "object") return 0;
    cursor = cursor[key];
  }
  return Array.isArray(cursor) ? cursor.length : 0;
}

function scoreSummaryDepthCount(scores: any): number {
  if (!scores || typeof scores !== "object") return 0;
  return Object.values(scores).filter((score: any) => wordCount(score?.summary) >= 20).length;
}

function getAnalysisDepthIssues(analysis: any): string[] {
  const issues: string[] = [];

  if (scoreSummaryDepthCount(analysis?.scores) < 7) {
    issues.push("At least 7 score summaries should include 20+ words of concrete evidence.");
  }
  if (nestedArrayLength(analysis, ["ats_analysis", "checks"]) < 8) {
    issues.push("ATS checks are too shallow (need 8+ checks).");
  }
  if (nestedArrayLength(analysis, ["parsing_analysis", "fields"]) < 8) {
    issues.push("Parsing fields are too shallow (need 8+ fields).");
  }
  if (nestedArrayLength(analysis, ["content_analysis", "bullets"]) < 6) {
    issues.push("Content bullet-level analysis is too shallow (need 6+ bullet audits).");
  }
  if (nestedArrayLength(analysis, ["recruiter_analysis", "issues"]) < 3) {
    issues.push("Recruiter readability issues need deeper coverage (need 3+).");
  }
  if (nestedArrayLength(analysis, ["improvement_roadmap", "immediate_fixes"]) < 5) {
    issues.push("Immediate fixes are too few (need 5+ high-impact rewrites).");
  }
  if (nestedArrayLength(analysis, ["improvement_roadmap", "section_by_section_rewrites"]) < 4) {
    issues.push("Section-by-section rewrite guidance is too shallow (need 4+ entries).");
  }
  if (nestedArrayLength(analysis, ["priorities"]) < 6) {
    issues.push("Priority backlog is too short (need 6+ priorities).");
  }
  if (nestedArrayLength(analysis, ["interview_vulnerability", "cross_question_zones"]) < 4) {
    issues.push("Interview vulnerability map is too shallow (need 4+ cross-question zones).");
  }

  return issues;
}

// Models to try in order — prioritize detail quality first, then reliability fallbacks
const MODEL_CHAIN = [
  { model: "gemini-2.5-flash", timeout: 75_000, maxTokens: 24000 },
  { model: "gemini-1.5-pro", timeout: 80_000, maxTokens: 22000 },
  { model: "gemini-1.5-flash-latest", timeout: 65_000, maxTokens: 20000 },
];

async function callAIWithRetry(
  apiKey: string,
  messages: any[],
  attempt = 0
): Promise<{ content: string; model: string }> {
  const config = MODEL_CHAIN[Math.min(attempt, MODEL_CHAIN.length - 1)];
  console.log(`AI attempt ${attempt + 1}/${MODEL_CHAIN.length} with model: ${config.model}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.15,
        max_tokens: config.maxTokens,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 429) {
      const errText = await response.text();
      console.error(`Rate limited on ${config.model}:`, errText);
      // Rate limit on one model — try next model instead of failing
      if (attempt < MODEL_CHAIN.length - 1) {
        console.log("Switching to next model due to rate limit...");
        return callAIWithRetry(apiKey, messages, attempt + 1);
      }
      throw Object.assign(new Error("Rate limit exceeded on all models. Please wait a moment and try again."), { status: 429, noRetry: true });
    }

    if (response.status === 402) {
      await response.text();
      throw Object.assign(new Error("AI usage limit reached. Please add credits to continue."), { status: 402, noRetry: true });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error(`AI error (${config.model}):`, response.status, errText);
      throw new Error(`AI returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    // Validate that the response is parseable JSON before returning
    try {
      extractJsonFromResponse(content);
    } catch (parseErr) {
      console.error(`Model ${config.model} returned unparseable response, retrying...`);
      if (attempt < MODEL_CHAIN.length - 1) {
        return callAIWithRetry(apiKey, messages, attempt + 1);
      }
      throw parseErr;
    }

    console.log(`Success with ${config.model} on attempt ${attempt + 1}`);
    return { content, model: config.model };
  } catch (err: any) {
    clearTimeout(timeout);

    if (err.noRetry) throw err;

    if (attempt < MODEL_CHAIN.length - 1) {
      const reason = err.name === "AbortError" ? "timeout" : err.message;
      console.log(`Attempt ${attempt + 1} failed (${reason}), trying next model...`);
      // Small delay before retry to avoid hammering
      await new Promise(r => setTimeout(r, 1000));
      return callAIWithRetry(apiKey, messages, attempt + 1);
    }

    throw new Error(
      err.name === "AbortError"
        ? "Analysis timed out on all models. Please try with a smaller resume or different format."
        : `AI analysis failed after ${attempt + 1} attempts across ${MODEL_CHAIN.length} models. Please try again.`
    );
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Capture auth header IMMEDIATELY before any async work, since req may close later
    const authHeader = req.headers.get("authorization");
    const { fileBase64, fileName, mimeType, resumeText, isDeep } = await req.json();

    if (!fileBase64 && !resumeText) {
      return new Response(
        JSON.stringify({ error: "No file data or resume text provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing resume: ${fileName}, Mode: ${isDeep ? "DEEP" : "NORMAL"}, source: ${resumeText ? "direct text" : "file upload"}`);

    const userContent: any[] = [
      {
        type: "text",
        text: `Analyze this resume thoroughly. File: "${fileName}". ${isDeep ? "CRITICAL: This is a DEEP SCAN. Spend maximum tokens on detail." : ""} Return the complete JSON analysis.`
      }
    ];

    if (resumeText) {
      userContent[0].text += `\n\nRESUME CONTENT (Extracted/Provided):\n\n${resumeText}`;
    } else if (mimeType === "application/pdf") {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:application/pdf;base64,${fileBase64}` }
      });
    } else if (mimeType === "text/plain" || mimeType === "text/html") {
      let textContent: string;
      try {
        const bytes = new Uint8Array(Array.from(atob(fileBase64), c => c.charCodeAt(0)));
        textContent = new TextDecoder().decode(bytes);
      } catch {
        textContent = atob(fileBase64);
      }
      userContent[0] = {
        type: "text",
        text: `Analyze this resume thoroughly. File: "${fileName}".\n\nRESUME CONTENT:\n\n${textContent}`
      };
    } else {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${mimeType};base64,${fileBase64}` }
      });
    }

    const modePrompt = isDeep ? DEEP_SYSTEM_PROMPT : SYSTEM_PROMPT;
    const finalSystemPrompt = `${modePrompt}\n\n${DETAIL_REQUIREMENTS}\n\n${
      isDeep
        ? "YOU ARE IN DEEP SCAN MODE. MANDATORY: Analyze against 50+ resume frameworks with ultra-granular evidence and rewrite quality."
        : "Return a complete, evidence-rich analysis (not a light summary)."
    }`;

    const messages = [
      { role: "system", content: finalSystemPrompt },
      { role: "user", content: userContent },
    ];

    // Call AI with automatic retry & fallback
    // For DEEP mode, we use a longer timeout and force Pro models if possible
    if (isDeep) {
      console.log("Deep mode requested, prioritizing high-capacity models...");
    }
    const initialResult = await callAIWithRetry(GEMINI_API_KEY, messages);
    let content = initialResult.content;
    let usedModel = initialResult.model;

    console.log(`Analysis complete via ${usedModel}. Response length: ${content.length}`);

    let analysis;
    try {
      analysis = extractJsonFromResponse(content);
    } catch (parseErr) {
      console.error("JSON parse failed. Content preview:", content.substring(0, 2000));
      console.error("Content tail:", content.substring(content.length - 500));
      return new Response(
        JSON.stringify({ error: "Failed to parse analysis. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const depthIssues = getAnalysisDepthIssues(analysis as any);
    if (depthIssues.length > 0) {
      console.log("Analysis depth below threshold. Running enrichment pass:", depthIssues.join(" | "));
      try {
        const depthMessages = [
          {
            role: "system",
            content:
              `${finalSystemPrompt}\n\nDEPTH ENFORCEMENT MODE:\n` +
              "- Regenerate the full JSON with richer detail and stronger evidence.\n" +
              "- Preserve factual realism; do not invent unrealistic claims.\n" +
              "- Expand weak sections while keeping exact schema compatibility.",
          },
          { role: "user", content: userContent },
          {
            role: "user",
            content:
              "Your previous draft was too shallow. Fix these depth gaps:\n" +
              depthIssues.map((issue) => `- ${issue}`).join("\n") +
              "\n\nReturn only valid JSON.",
          },
        ];

        const enrichedResult = await callAIWithRetry(GEMINI_API_KEY, depthMessages);
        const enrichedAnalysis = extractJsonFromResponse(enrichedResult.content);
        const remainingIssues = getAnalysisDepthIssues(enrichedAnalysis as any);

        if (remainingIssues.length <= depthIssues.length) {
          analysis = enrichedAnalysis;
          content = enrichedResult.content;
          usedModel = `${usedModel} -> ${enrichedResult.model} (depth)`;
          console.log(
            `Depth pass accepted. Issues ${depthIssues.length} -> ${remainingIssues.length}.`
          );
        } else {
          console.log(
            `Depth pass rejected (did not improve). Issues ${depthIssues.length} -> ${remainingIssues.length}.`
          );
        }
      } catch (depthErr) {
        console.error("Depth enrichment pass failed, continuing with initial analysis:", depthErr);
      }
    }

    // Save to database (use pre-captured auth header to avoid "request closed" error)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      let userId: string | null = null;
      // authHeader was captured at the start of the request, before the long AI call
      if (authHeader) {
        try {
          const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
          const userClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: authHeader } },
          });
          const { data: { user } } = await userClient.auth.getUser();
          if (user) userId = user.id;
        } catch (e) {
          console.error("Failed to extract user:", e);
        }
      }

      const insertPayload: Record<string, unknown> = {
        file_name: fileName,
        file_size: fileBase64 ? Math.round(fileBase64.length * 0.75) : (resumeText ? resumeText.length : 0),
        resume_text: (analysis as any).full_raw_text || resumeText || content,
        scores: (analysis as any).scores || {},
        ats_analysis: (analysis as any).ats_analysis || {},
        parsing_analysis: (analysis as any).parsing_analysis || {},
        recruiter_analysis: (analysis as any).recruiter_analysis || {},
        content_analysis: (analysis as any).content_analysis || {},
        humanizer_analysis: (analysis as any).humanizer_analysis || {},
        structure_analysis: (analysis as any).structure_analysis || {},
        red_flags: (analysis as any).red_flags || [],
        priorities: (analysis as any).priorities || [],
        strengths: (analysis as any).strengths || [],
      };
      if (userId) insertPayload.user_id = userId;

      const { data: insertData, error: insertError } = await supabase
        .from("resume_analyses")
        .insert(insertPayload)
        .select("id")
        .single();

      if (insertError) {
        console.error("DB insert error:", insertError);
      } else {
        console.log("Analysis saved with ID:", insertData.id);
        (analysis as any)._id = insertData.id;
      }
    } catch (dbErr) {
      console.error("DB save failed:", dbErr);
    }

    console.log("Analysis complete. Scores:", JSON.stringify((analysis as any).scores));

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("analyze-resume error:", e);
    const status = e.status || 500;
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error occurred" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
