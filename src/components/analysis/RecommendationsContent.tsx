import { motion } from "@/lib/motion-stub";
import { useAnalysis } from "@/context/AnalysisContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ScoreCard";
import { Progress } from "@/components/ui/progress";
import {
  Zap, AlertTriangle, CheckCircle2, ArrowRight, Target, PenTool, Hammer,
  Route, Shield, Layers, Bot, Eye, Lightbulb, TrendingUp, Clock, Sparkles,
  BarChart3, FileText, Binary, MessageSquare, Gauge, ChevronRight,
  XCircle, Info, Award, Brain, Hash, Replace, ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

const severityOrder = { critical: 0, risk: 1, warning: 2, info: 3 };
const severityColor = (s: string) => {
  if (s === "critical") return "border-score-critical/30 bg-score-critical/5";
  if (s === "risk") return "border-score-risk/30 bg-score-risk/5";
  return "border-score-warning/30 bg-score-warning/5";
};
const severityIcon = (s: string) => {
  if (s === "critical") return <AlertTriangle className="h-4 w-4 text-score-critical" />;
  if (s === "risk") return <AlertTriangle className="h-4 w-4 text-score-risk" />;
  return <Lightbulb className="h-4 w-4 text-score-warning" />;
};

const scoreBarColor = (s: number) =>
  s >= 80 ? "bg-score-excellent" : s >= 60 ? "bg-score-warning" : "bg-score-critical";

const scoreLabel = (s: number) =>
  s >= 85 ? "Excellent" : s >= 70 ? "Strong" : s >= 55 ? "Fair" : s >= 40 ? "Weak" : "Critical";

const scoreLabelColor = (s: number) =>
  s >= 80 ? "text-score-excellent" : s >= 60 ? "text-score-warning" : "text-score-critical";

interface ActionStep {
  label: string;
  description: string;
  link: string;
  icon: React.ReactNode;
  category: string;
}

/* ─── Score Breakdown Card ─────────────────────────────── */
function ScoreBreakdownCard({ label, score, summary, icon, reasons, deductions }: {
  label: string; score: number; summary: string; icon: React.ReactNode; reasons: string[]; deductions?: string[];
}) {
  const lost = 100 - score;
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">{icon}</div>
          <p className="text-sm font-semibold">{label}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-base font-bold", scoreLabelColor(score))}>{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <div className="mb-2">
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", scoreBarColor(score))} style={{ width: `${score}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className={cn("text-xs font-medium", scoreLabelColor(score))}>{scoreLabel(score)}</span>
          {lost > 0 && (
            <span className="text-xs font-medium text-score-critical">−{lost} pts lost</span>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{summary}</p>

      {/* Why points were lost */}
      {lost > 0 && deductions && deductions.length > 0 && (
        <div className="rounded-lg bg-score-critical/5 border border-score-critical/15 p-2.5 mb-2">
          <p className="text-xs font-semibold text-score-critical mb-1.5">Why {lost} points were deducted</p>
          <div className="space-y-1">
            {deductions.map((d, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs">
                <span className="text-score-critical mt-px shrink-0">−</span>
                <span className="text-muted-foreground">{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {reasons.length > 0 && (
        <div className="space-y-1 border-t pt-2 mt-1">
          {reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs">
              <ChevronRight className="h-3 w-3 text-muted-foreground/60 mt-px shrink-0" />
              <span className="text-muted-foreground">{r}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RecommendationsContent() {
  const { analysis } = useAnalysis();
  if (!analysis) return null;

  const scores = analysis.scores;
  const verdict = analysis.overall_verdict;
  const roadmap = analysis.improvement_roadmap;
  const priorities = analysis.priorities || [];
  const redFlags = analysis.red_flags || [];
  const strengths = analysis.strengths || [];
  const ats = analysis.ats_analysis;
  const content = analysis.content_analysis;
  const structure = analysis.structure_analysis;
  const humanizer = analysis.humanizer_analysis;
  const recruiter = analysis.recruiter_analysis;
  const parsing = analysis.parsing_analysis;
  const skills = analysis.skills_analysis;
  const career = analysis.career_narrative;
  const consistency = analysis.consistency_audit;

  // ─── Build score justification reasons ───────────────
  const atsReasons: string[] = [];
  if (ats?.pass_likelihood) atsReasons.push(`Pass likelihood: ${ats.pass_likelihood}`);
  if (ats?.matched_keywords?.length) atsReasons.push(`${ats.matched_keywords.length} keywords matched`);
  if (ats?.missing_keywords?.length) atsReasons.push(`${ats.missing_keywords.length} keywords missing`);
  if (ats?.formatting_issues?.length) atsReasons.push(`${ats.formatting_issues.length} formatting issues`);
  if (ats?.estimated_rank_percentile) atsReasons.push(`Estimated top ${ats.estimated_rank_percentile}% of applicants`);
  ats?.checks?.filter(c => c.status === "fail").slice(0, 2).forEach(c => atsReasons.push(`Failed: ${c.label}`));

  const parsingReasons: string[] = [];
  if (parsing?.overall_extractability) parsingReasons.push(`Extractability: ${parsing.overall_extractability}`);
  const failedFields = parsing?.fields?.filter(f => f.status !== "clean") || [];
  if (failedFields.length) parsingReasons.push(`${failedFields.length} fields with issues`);
  failedFields.slice(0, 2).forEach(f => parsingReasons.push(`${f.field}: ${f.status}${f.note ? ` — ${f.note}` : ""}`));

  const contentReasons: string[] = [];
  if (content) {
    contentReasons.push(`${content.strong_bullets} strong / ${content.weak_bullets} weak of ${content.total_bullets} bullets`);
    if (content.metrics_used !== undefined) contentReasons.push(`${content.metrics_used} bullets contain metrics`);
    if (content.quantification_depth) contentReasons.push(`Quantification score: ${content.quantification_depth.score}/100`);
    if (content.repeated_verbs?.length) contentReasons.push(`${content.repeated_verbs.length} repeated action verbs`);
    if (content.redundancy_report?.length) contentReasons.push(`${content.redundancy_report.length} redundant phrases detected`);
    if (content.power_language_score) contentReasons.push(`Power language: ${content.power_language_score}/100`);
  }

  const impactReasons: string[] = [];
  if (content?.quantification_depth) {
    const qd = content.quantification_depth;
    impactReasons.push(`${qd.bullets_with_numbers} numerical, ${qd.bullets_with_percentages} percentage, ${qd.bullets_with_dollar_amounts} dollar metrics`);
    if (qd.bullets_with_time_frames) impactReasons.push(`${qd.bullets_with_time_frames} time-framed achievements`);
  }
  if (content?.star_compliance) impactReasons.push(`STAR: ${content.star_compliance.complete} complete, ${content.star_compliance.partial} partial`);
  if (content?.xyz_compliance) impactReasons.push(`XYZ: ${content.xyz_compliance.complete} complete, ${content.xyz_compliance.partial} partial`);

  const recruiterReasons: string[] = [];
  if (recruiter) {
    if (recruiter.six_second_scan?.immediate_verdict) recruiterReasons.push(`6-sec verdict: ${recruiter.six_second_scan.immediate_verdict}`);
    if (recruiter.six_second_scan?.cognitive_load) recruiterReasons.push(`Cognitive load: ${recruiter.six_second_scan.cognitive_load}`);
    if (recruiter.six_second_scan?.f_pattern_score) recruiterReasons.push(`F-pattern score: ${recruiter.six_second_scan.f_pattern_score}/100`);
    if (recruiter.perceived_role) recruiterReasons.push(`Perceived as: ${recruiter.perceived_role} (${recruiter.perceived_level})`);
    recruiter.issues?.slice(0, 2).forEach(i => recruiterReasons.push(`${i.severity === "risk" ? "⚠" : "△"} ${i.issue}`));
  }

  const structureReasons: string[] = [];
  if (structure) {
    if (structure.layout_assessment) {
      const la = structure.layout_assessment;
      structureReasons.push(`${la.page_count} page(s), ideal: ${la.ideal_page_count}`);
      if (la.white_space) structureReasons.push(`Whitespace: ${la.white_space}`);
      if (la.visual_hierarchy) structureReasons.push(`Hierarchy: ${la.visual_hierarchy}`);
    }
    if (structure.missing_sections?.length) structureReasons.push(`Missing: ${structure.missing_sections.join(", ")}`);
    if (structure.unnecessary_sections?.length) structureReasons.push(`Unnecessary: ${structure.unnecessary_sections.join(", ")}`);
    if (structure.mece_assessment?.overlapping_sections?.length) structureReasons.push(`Overlapping: ${structure.mece_assessment.overlapping_sections.join(", ")}`);
  }

  const authenticityReasons: string[] = [];
  if (humanizer) {
    if (humanizer.ai_probability !== undefined) authenticityReasons.push(`AI probability: ${humanizer.ai_probability}%`);
    if (humanizer.tone_analysis) {
      authenticityReasons.push(`Tone: ${humanizer.tone_analysis.overall_tone}, ${humanizer.tone_analysis.consistency}`);
      if (humanizer.tone_analysis.voice_uniqueness) authenticityReasons.push(`Voice uniqueness: ${humanizer.tone_analysis.voice_uniqueness}`);
    }
    if (humanizer.detections?.length) authenticityReasons.push(`${humanizer.detections.length} AI-flagged phrases`);
    if (humanizer.vocabulary_analysis?.overused_buzzwords?.length) authenticityReasons.push(`${humanizer.vocabulary_analysis.overused_buzzwords.length} overused buzzwords`);
  }

  const clarityReasons: string[] = [];
  if (content?.issues?.length) content.issues.slice(0, 3).forEach(i => clarityReasons.push(i));
  if (consistency) {
    if (consistency.contradictions?.length) clarityReasons.push(`${consistency.contradictions.length} contradictions found`);
    if (consistency.tone_shifts?.length) clarityReasons.push(`${consistency.tone_shifts.length} tone shifts detected`);
    if (consistency.timeline_issues?.length) clarityReasons.push(`${consistency.timeline_issues.length} timeline issues`);
  }

  const positioningReasons: string[] = [];
  if (career) {
    positioningReasons.push(`Trajectory strength: ${career.trajectory_strength}/100`);
    if (career.story_coherence) positioningReasons.push(`Story coherence: ${career.story_coherence}`);
    if (career.gaps?.length) positioningReasons.push(`${career.gaps.length} career gap(s) detected`);
    if (career.job_tenure_pattern) positioningReasons.push(`Tenure pattern: ${career.job_tenure_pattern}`);
  }
  if (skills?.missing_for_role?.length) positioningReasons.push(`${skills.missing_for_role.length} skills missing for target role`);
  if (verdict?.estimated_response_rate) positioningReasons.push(`Estimated response rate: ${verdict.estimated_response_rate}`);

  // ─── Build deduction explanations ───────────────────
  const atsDeductions: string[] = [];
  if (ats?.missing_keywords?.length) atsDeductions.push(`Missing ${ats.missing_keywords.length} important keywords (−${Math.min(ats.missing_keywords.length * 2, 20)} pts est.)`);
  if (ats?.formatting_issues?.length) atsDeductions.push(`${ats.formatting_issues.length} formatting issue(s) hurting parser compatibility`);
  ats?.checks?.filter(c => c.status === "fail").slice(0, 3).forEach(c => atsDeductions.push(`Failed check: ${c.label} — ${c.detail}`));
  ats?.checks?.filter(c => c.status === "warning").slice(0, 2).forEach(c => atsDeductions.push(`Warning: ${c.label}`));
  if (!atsDeductions.length && scores.ats.score < 100) atsDeductions.push(`Minor optimization gaps in keyword coverage and formatting`);

  const parsingDeductions: string[] = [];
  failedFields.forEach(f => parsingDeductions.push(`"${f.field}" parsed as ${f.status}${f.note ? `: ${f.note}` : ""}`));
  if (parsing?.date_consistency && !parsing.date_consistency.consistent) parsingDeductions.push(`Inconsistent date formats: ${parsing.date_consistency.issues?.[0] || "mixed formats"}`);
  if (!parsingDeductions.length && scores.parsing.score < 100) parsingDeductions.push(`Minor extraction ambiguities in some fields`);

  const contentDeductions: string[] = [];
  if (content?.weak_bullets) contentDeductions.push(`${content.weak_bullets} weak bullets lacking metrics or impact (of ${content.total_bullets} total)`);
  if (content?.repeated_verbs?.length) contentDeductions.push(`Repeated verbs: ${content.repeated_verbs.slice(0, 4).join(", ")} — reduces variety`);
  if (content?.redundancy_report?.length) contentDeductions.push(`${content.redundancy_report.length} redundant/overlapping phrases`);
  if (content?.quantification_depth && content.quantification_depth.score < 70) contentDeductions.push(`Low quantification depth (${content.quantification_depth.score}/100)`);
  if (!contentDeductions.length && scores.content_quality.score < 100) contentDeductions.push(`Some bullets lack measurable outcomes`);

  const impactDeductions: string[] = [];
  if (content) {
    const noMetrics = content.total_bullets - (content.metrics_used || 0);
    if (noMetrics > 0) impactDeductions.push(`${noMetrics} bullets have no numerical metrics`);
    if (content.star_compliance?.missing) impactDeductions.push(`${content.star_compliance.missing} bullets missing STAR framework`);
    if (content.xyz_compliance?.missing) impactDeductions.push(`${content.xyz_compliance.missing} bullets missing XYZ framework`);
    if (content.power_language_score && content.power_language_score < 70) impactDeductions.push(`Power language score only ${content.power_language_score}/100`);
  }
  if (!impactDeductions.length && scores.impact_strength.score < 100) impactDeductions.push(`Achievements could be more specific with numbers and outcomes`);

  const recruiterDeductions: string[] = [];
  if (recruiter?.six_second_scan?.cognitive_load === "High") recruiterDeductions.push(`High cognitive load — too much info competing for attention`);
  if (recruiter?.six_second_scan?.f_pattern_score && recruiter.six_second_scan.f_pattern_score < 70) recruiterDeductions.push(`F-pattern score ${recruiter.six_second_scan.f_pattern_score}/100 — key info not in scan path`);
  recruiter?.issues?.slice(0, 3).forEach(i => recruiterDeductions.push(`${i.issue}${i.fix ? ` → ${i.fix}` : ""}`));
  if (recruiter?.missed?.length) recruiterDeductions.push(`Recruiter missed: ${recruiter.missed.slice(0, 2).join(", ")}`);
  if (!recruiterDeductions.length && scores.recruiter_readability.score < 100) recruiterDeductions.push(`Minor readability friction in layout or hierarchy`);

  const structureDeductions: string[] = [];
  if (structure?.missing_sections?.length) structureDeductions.push(`Missing sections: ${structure.missing_sections.join(", ")}`);
  if (structure?.unnecessary_sections?.length) structureDeductions.push(`Unnecessary sections: ${structure.unnecessary_sections.join(", ")}`);
  if (structure?.mece_assessment?.overlapping_sections?.length) structureDeductions.push(`Content overlap in: ${structure.mece_assessment.overlapping_sections.join(", ")}`);
  if (structure?.section_order_issues?.length) structureDeductions.push(`Section ordering: ${structure.section_order_issues[0]}`);
  if (structure?.layout_assessment?.white_space?.toLowerCase().includes("tight")) structureDeductions.push(`Tight whitespace reduces readability`);
  structure?.sections?.filter(s => s.status === "critical" || s.status === "warning").slice(0, 2).forEach(s => structureDeductions.push(`"${s.name}" scored ${s.score}/100: ${s.notes}`));
  if (!structureDeductions.length && scores.structure.score < 100) structureDeductions.push(`Minor section balance or ordering improvements possible`);

  const authenticityDeductions: string[] = [];
  if (humanizer?.ai_probability && humanizer.ai_probability > 20) authenticityDeductions.push(`AI detection probability: ${humanizer.ai_probability}%`);
  if (humanizer?.detections?.length) authenticityDeductions.push(`${humanizer.detections.length} phrases flagged as AI-generated or generic`);
  if (humanizer?.vocabulary_analysis?.overused_buzzwords?.length) authenticityDeductions.push(`Overused buzzwords: ${humanizer.vocabulary_analysis.overused_buzzwords.slice(0, 4).join(", ")}`);
  if (humanizer?.vocabulary_analysis?.cliche_phrases?.length) authenticityDeductions.push(`${humanizer.vocabulary_analysis.cliche_phrases.length} cliché phrases detected`);
  if (humanizer?.tone_analysis?.voice_uniqueness?.toLowerCase().includes("low")) authenticityDeductions.push(`Low voice uniqueness — sounds generic`);
  if (!authenticityDeductions.length && scores.human_authenticity.score < 100) authenticityDeductions.push(`Some phrasing sounds templated or over-polished`);

  const clarityDeductions: string[] = [];
  if (consistency?.contradictions?.length) clarityDeductions.push(`${consistency.contradictions.length} contradictions between sections`);
  if (consistency?.tone_shifts?.length) clarityDeductions.push(`${consistency.tone_shifts.length} tone shifts create inconsistency`);
  if (consistency?.timeline_issues?.length) clarityDeductions.push(`${consistency.timeline_issues.length} timeline inconsistencies`);
  content?.issues?.slice(0, 2).forEach(i => clarityDeductions.push(i));
  if (!clarityDeductions.length && scores.clarity.score < 100) clarityDeductions.push(`Minor clarity improvements possible in phrasing`);

  const positioningDeductions: string[] = [];
  if (career && career.trajectory_strength < 70) positioningDeductions.push(`Weak career trajectory (${career.trajectory_strength}/100)`);
  if (career?.gaps?.length) career.gaps.forEach(g => positioningDeductions.push(`Career gap: ${g.period} (${g.duration}) — ${g.concern_level} concern`));
  if (skills?.missing_for_role?.length) positioningDeductions.push(`Missing skills for target role: ${skills.missing_for_role.slice(0, 4).join(", ")}`);
  if (career?.story_coherence?.toLowerCase().includes("weak")) positioningDeductions.push(`Weak story coherence — career narrative unclear`);
  if (!positioningDeductions.length && scores.strategic_positioning.score < 100) positioningDeductions.push(`Positioning could be sharpened for target role`);

  // ─── Build action steps ─────────────────────────────
  const actionSteps: ActionStep[] = [];

  if (scores.ats.score < 80) {
    actionSteps.push({
      label: "Improve ATS Compatibility",
      description: `Score is ${scores.ats.score}/100. ${ats?.missing_keywords?.length ? `Add ${ats.missing_keywords.length} missing keywords.` : "Fix formatting issues for better parsing."}`,
      link: "/ats", icon: <Shield className="h-4 w-4" />, category: "ATS",
    });
  }
  if (scores.content_quality.score < 80) {
    actionSteps.push({
      label: "Strengthen Weak Bullets",
      description: `${content?.weak_bullets || 0} weak bullets detected. Add metrics, results, and STAR-format details.`,
      link: "/rewrites", icon: <PenTool className="h-4 w-4" />, category: "Content",
    });
  }
  if (scores.structure.score < 80) {
    actionSteps.push({
      label: "Fix Resume Structure",
      description: structure?.missing_sections?.length ? `Missing: ${structure.missing_sections.join(", ")}` : "Improve section ordering and balance.",
      link: "/structure", icon: <Layers className="h-4 w-4" />, category: "Structure",
    });
  }
  if (scores.human_authenticity.score < 70) {
    actionSteps.push({
      label: "Reduce AI-Sounding Language",
      description: `Authenticity: ${scores.human_authenticity.score}/100. ${humanizer?.detections?.length ? `${humanizer.detections.length} phrases flagged.` : "Rewrite corporate clichés."}`,
      link: "/humanizer", icon: <Bot className="h-4 w-4" />, category: "Authenticity",
    });
  }
  if (scores.recruiter_readability.score < 75) {
    actionSteps.push({
      label: "Improve Recruiter Readability",
      description: recruiter?.six_second_scan?.cognitive_load === "High" ? "High cognitive load — simplify layout." : "Resume doesn't pass the 6-second scan well.",
      link: "/recruiter", icon: <Eye className="h-4 w-4" />, category: "Readability",
    });
  }
  if (scores.impact_strength.score < 75) {
    actionSteps.push({
      label: "Add Quantified Achievements",
      description: `Only ${content?.metrics_used || 0} bullets have metrics. Add numbers, percentages, and dollar amounts.`,
      link: "/rewrites", icon: <TrendingUp className="h-4 w-4" />, category: "Impact",
    });
  }
  if (ats?.missing_keywords?.length && ats.missing_keywords.length > 3) {
    actionSteps.push({
      label: "Tailor to Job Description",
      description: `${ats.missing_keywords.length} missing keywords. Use JD tailoring to match specific roles.`,
      link: "/jd-tailor", icon: <Target className="h-4 w-4" />, category: "Keywords",
    });
  }
  if (scores.clarity.score < 75) {
    actionSteps.push({
      label: "Improve Clarity & Consistency",
      description: consistency?.contradictions?.length ? `${consistency.contradictions.length} contradictions need resolving.` : "Simplify language and remove jargon.",
      link: "/content", icon: <MessageSquare className="h-4 w-4" />, category: "Clarity",
    });
  }

  const sortedPriorities = [...priorities].sort((a, b) =>
    (severityOrder[a.severity as keyof typeof severityOrder] ?? 3) - (severityOrder[b.severity as keyof typeof severityOrder] ?? 3)
  );

  const immediateFixes = roadmap?.immediate_fixes?.slice(0, 6) || [];
  const shortTerm = roadmap?.short_term_improvements?.slice(0, 5) || [];
  const longTerm = roadmap?.long_term_development?.slice(0, 4) || [];
  const sectionRewrites = roadmap?.section_by_section_rewrites?.slice(0, 4) || [];

  // Weak bullets for showing examples
  const weakBullets = content?.bullets?.filter(b => b.strength === "weak").slice(0, 4) || [];

  let fadeIdx = 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <motion.div {...fade(fadeIdx++)} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">Recommendations & Next Steps</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Comprehensive analysis breakdown — every score justified with actionable fixes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/improvement-roadmap">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
              <Route className="h-3 w-3" /> Full Roadmap
            </Button>
          </Link>
          <Link to="/builder">
            <Button size="sm" className="gap-1.5 text-xs h-7">
              <Hammer className="h-3 w-3" /> Edit Resume
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Verdict Summary */}
      {verdict && (
        <motion.div {...fade(fadeIdx++)} className="rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              verdict.ready_to_apply ? "bg-score-excellent/10" : "bg-score-risk/10"
            )}>
              {verdict.ready_to_apply
                ? <CheckCircle2 className="h-5 w-5 text-score-excellent" />
                : <AlertTriangle className="h-5 w-5 text-score-risk" />
              }
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{verdict.ready_to_apply ? "Ready to Apply" : "Needs Improvement"}</span>
                <SeverityBadge level={verdict.ready_to_apply ? "excellent" : "risk"} label={verdict.grade} />
                {verdict.estimated_response_rate && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                    Est. response: {verdict.estimated_response_rate}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{verdict.one_liner}</p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {verdict.biggest_asset && (
                  <div className="flex items-start gap-1.5">
                    <Award className="h-3 w-3 text-score-excellent mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Biggest Asset</p>
                      <p className="text-[11px] text-foreground">{verdict.biggest_asset}</p>
                    </div>
                  </div>
                )}
                {verdict.biggest_risk && (
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="h-3 w-3 text-score-risk mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Biggest Risk</p>
                      <p className="text-[11px] text-foreground">{verdict.biggest_risk}</p>
                    </div>
                  </div>
                )}
              </div>
              {verdict.top_3_actions?.length ? (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">If you only do 3 things</p>
                  {verdict.top_3_actions.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold">{i + 1}</span>
                      <span className="text-muted-foreground">{a}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── SCORE JUSTIFICATION BREAKDOWN ─────────────── */}
      <motion.div {...fade(fadeIdx++)}>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-primary" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Score Breakdown — Why Each Score</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <ScoreBreakdownCard label="ATS Compatibility" score={scores.ats.score} summary={scores.ats.summary} icon={<Shield className="h-3.5 w-3.5" />} reasons={atsReasons} deductions={atsDeductions} />
          <ScoreBreakdownCard label="Parsing Health" score={scores.parsing.score} summary={scores.parsing.summary} icon={<Binary className="h-3.5 w-3.5" />} reasons={parsingReasons} deductions={parsingDeductions} />
          <ScoreBreakdownCard label="Content Quality" score={scores.content_quality.score} summary={scores.content_quality.summary} icon={<PenTool className="h-3.5 w-3.5" />} reasons={contentReasons} deductions={contentDeductions} />
          <ScoreBreakdownCard label="Impact Strength" score={scores.impact_strength.score} summary={scores.impact_strength.summary} icon={<TrendingUp className="h-3.5 w-3.5" />} reasons={impactReasons} deductions={impactDeductions} />
          <ScoreBreakdownCard label="Recruiter Readability" score={scores.recruiter_readability.score} summary={scores.recruiter_readability.summary} icon={<Eye className="h-3.5 w-3.5" />} reasons={recruiterReasons} deductions={recruiterDeductions} />
          <ScoreBreakdownCard label="Structure" score={scores.structure.score} summary={scores.structure.summary} icon={<Layers className="h-3.5 w-3.5" />} reasons={structureReasons} deductions={structureDeductions} />
          <ScoreBreakdownCard label="Authenticity" score={scores.human_authenticity.score} summary={scores.human_authenticity.summary} icon={<Bot className="h-3.5 w-3.5" />} reasons={authenticityReasons} deductions={authenticityDeductions} />
          <ScoreBreakdownCard label="Clarity" score={scores.clarity.score} summary={scores.clarity.summary} icon={<MessageSquare className="h-3.5 w-3.5" />} reasons={clarityReasons} deductions={clarityDeductions} />
          <ScoreBreakdownCard label="Strategic Positioning" score={scores.strategic_positioning.score} summary={scores.strategic_positioning.summary} icon={<Target className="h-3.5 w-3.5" />} reasons={positioningReasons} deductions={positioningDeductions} />
        </div>
      </motion.div>

      {/* ─── ACTION STEPS ──────────────────────────────── */}
      {actionSteps.length > 0 && (
        <motion.div {...fade(fadeIdx++)}>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Suggested Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {actionSteps.map((step, i) => (
              <Link key={i} to={step.link} className="group">
                <div className="flex items-start gap-3 p-3.5 rounded-xl border hover:border-primary/25 hover:bg-primary/[0.02] transition-all h-full">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors text-primary">
                    {step.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold">{step.label}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-medium">{step.category}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors mt-1 shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── WEAK BULLETS — Before/After ───────────────── */}
      {weakBullets.length > 0 && (
        <motion.div {...fade(fadeIdx++)}>
          <div className="flex items-center gap-2 mb-3">
            <Replace className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Weak Bullets — Fix These</p>
          </div>
          <div className="space-y-2.5">
            {weakBullets.map((b, i) => (
              <div key={i} className="rounded-xl border bg-card p-3.5">
                {b.section && <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-medium mb-2 inline-block">{b.section}</span>}
                <div className="flex items-start gap-2 mb-1.5">
                  <XCircle className="h-3 w-3 text-score-critical mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{b.text}</p>
                </div>
                <div className="flex items-start gap-2 mb-1.5 ml-5">
                  <span className="text-xs text-score-critical font-semibold shrink-0">Issue:</span>
                  <p className="text-xs text-muted-foreground">{b.issue}</p>
                </div>
                <div className="flex items-start gap-2 ml-5">
                  <CheckCircle2 className="h-3 w-3 text-score-excellent mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground leading-relaxed">{b.fix}</p>
                </div>
              </div>
            ))}
            <Link to="/rewrites" className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline">
              Rewrite all weak bullets <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* ─── PRIORITY ISSUES ───────────────────────────── */}
      {sortedPriorities.length > 0 && (
        <motion.div {...fade(fadeIdx++)}>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Priority Issues</p>
          <div className="space-y-2">
            {sortedPriorities.slice(0, 10).map((p, i) => (
              <div key={i} className={cn("flex items-start gap-3 p-3 rounded-xl border", severityColor(p.severity))}>
                {severityIcon(p.severity)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{p.label}</p>
                  {p.framework && <p className="text-xs text-muted-foreground mt-0.5">{p.framework}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <SeverityBadge level={p.severity === "critical" ? "critical" : p.severity === "risk" ? "risk" : "warning"} label={p.severity} />
                    {p.estimated_impact && <span className="text-xs text-muted-foreground">Impact: {p.estimated_impact}</span>}
                    {p.effort && <span className="text-xs text-muted-foreground">Effort: {p.effort}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── AI-FLAGGED PHRASES ────────────────────────── */}
      {humanizer?.detections && humanizer.detections.length > 0 && (
        <motion.div {...fade(fadeIdx++)}>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">AI-Flagged Phrases — Humanize These</p>
          </div>
          <div className="space-y-2">
            {humanizer.detections.slice(0, 5).map((d, i) => (
              <div key={i} className="rounded-xl border bg-card p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <SeverityBadge level={d.severity === "critical" ? "critical" : d.severity === "risk" ? "risk" : "warning"} label={d.severity} />
                  {d.category && <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{d.category}</span>}
                </div>
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-score-critical text-xs font-bold mt-px shrink-0">NOW</span>
                  <p className="text-xs text-muted-foreground line-through leading-relaxed">"{d.original}"</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-score-excellent text-xs font-bold mt-px shrink-0">FIX</span>
                  <p className="text-xs text-foreground leading-relaxed">"{d.humanized}"</p>
                </div>
              </div>
            ))}
            <Link to="/humanizer" className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline">
              Humanize all flagged phrases <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* ─── QUICK FIXES ───────────────────────────────── */}
      {immediateFixes.length > 0 && (
        <motion.div {...fade(fadeIdx++)}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Quick Fixes (Do Now)</p>
          </div>
          <div className="space-y-2.5">
            {immediateFixes.map((fix, i) => (
              <div key={i} className="rounded-xl border bg-card p-3.5 sm:p-4">
                <p className="text-sm font-semibold mb-2">{fix.action}</p>
                {fix.current && (
                  <div className="flex items-start gap-2 mb-1.5">
                    <span className="text-score-critical text-xs font-bold mt-px shrink-0">BEFORE</span>
                    <p className="text-xs text-muted-foreground line-clamp-2">"{fix.current}"</p>
                  </div>
                )}
                {fix.improved && (
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-score-excellent text-xs font-bold mt-px shrink-0">AFTER</span>
                    <p className="text-xs text-muted-foreground line-clamp-2">"{fix.improved}"</p>
                  </div>
                )}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  {fix.impact && <span className="flex items-center gap-1"><TrendingUp className="h-2.5 w-2.5" /> {fix.impact}</span>}
                  {fix.time_estimate && <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {fix.time_estimate}</span>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── SHORT-TERM & LONG-TERM ────────────────────── */}
      {shortTerm.length > 0 && (
        <motion.div {...fade(fadeIdx++)}>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Short-Term Improvements</p>
          <div className="space-y-2">
            {shortTerm.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border bg-card">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{s.action}</p>
                  {s.rationale && <p className="text-xs text-muted-foreground mt-0.5">{s.rationale}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>Impact: {s.impact}</span>
                    <span>Time: {s.time_estimate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {longTerm.length > 0 && (
        <motion.div {...fade(fadeIdx++)}>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Long-Term Development</p>
          <div className="space-y-2">
            {longTerm.map((l, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border bg-card">
                <Gauge className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{l.area}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{l.recommendation}</p>
                  <span className="text-xs text-muted-foreground mt-1 inline-block">Timeline: {l.timeline}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── SECTION-BY-SECTION REWRITES ───────────────── */}
      {sectionRewrites.length > 0 && (
        <motion.div {...fade(fadeIdx++)}>
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Section-by-Section Rewrites</p>
          </div>
          <div className="space-y-3">
            {sectionRewrites.map((sr, i) => (
              <div key={i} className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-semibold">{sr.section}</p>
                  <SeverityBadge
                    level={sr.current_grade === "A" || sr.current_grade === "B" ? "excellent" : sr.current_grade === "C" ? "warning" : "critical"}
                    label={`Grade: ${sr.current_grade}`}
                  />
                </div>
                {sr.issues.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {sr.issues.map((issue, j) => (
                      <div key={j} className="flex items-start gap-1.5 text-xs">
                        <XCircle className="h-3 w-3 text-score-risk mt-px shrink-0" />
                        <span className="text-muted-foreground">{issue}</span>
                      </div>
                    ))}
                  </div>
                )}
                {sr.rewrite_suggestions.length > 0 && (
                  <div className="space-y-1 border-t pt-2">
                    {sr.rewrite_suggestions.map((sug, j) => (
                      <div key={j} className="flex items-start gap-1.5 text-xs">
                        <CheckCircle2 className="h-3 w-3 text-score-excellent mt-px shrink-0" />
                        <span className="text-muted-foreground">{sug}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── STRENGTHS & RED FLAGS ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {strengths.length > 0 && (
          <motion.div {...fade(fadeIdx++)} className="rounded-xl border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-score-excellent" />
              <p className="text-sm font-semibold">Strengths to Leverage</p>
            </div>
            <div className="space-y-1.5">
              {strengths.slice(0, 8).map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-3 w-3 text-score-excellent mt-1 shrink-0" />
                  <span className="text-muted-foreground">{s}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {redFlags.length > 0 && (
          <motion.div {...fade(fadeIdx++)} className="rounded-xl border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-score-warning" />
              <p className="text-sm font-semibold">Red Flags to Address</p>
            </div>
            <div className="space-y-1.5">
              {redFlags.slice(0, 8).map((flag, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-3 w-3 text-score-warning mt-1 shrink-0" />
                  <span className="text-muted-foreground">{typeof flag === "string" ? flag : (flag as any).label || String(flag)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ─── MISSING KEYWORDS ──────────────────────────── */}
      {ats?.missing_keywords?.length ? (
        <motion.div {...fade(fadeIdx++)} className="rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Missing Keywords to Add</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ats.missing_keywords.map((kw, i) => (
              <span key={i} className="px-2 py-0.5 rounded text-xs bg-score-risk/10 text-score-risk border border-score-risk/20">{kw}</span>
            ))}
          </div>
          {ats.matched_keywords?.length ? (
            <div className="mt-3 border-t pt-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Matched Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {ats.matched_keywords.slice(0, 12).map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs bg-score-excellent/10 text-score-excellent border border-score-excellent/20">{kw}</span>
                ))}
              </div>
            </div>
          ) : null}
          <Link to="/jd-tailor" className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-3 hover:underline">
            Tailor to a specific job <ArrowRight className="h-3 w-3" />
          </Link>
        </motion.div>
      ) : null}

      {/* ─── RECRUITER INSIGHTS ────────────────────────── */}
      {recruiter && (recruiter.hiring_manager_notes?.length || recruiter.missed?.length) ? (
        <motion.div {...fade(fadeIdx++)} className="rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Recruiter & Hiring Manager Insights</p>
          </div>
          {recruiter.hiring_manager_notes?.length ? (
            <div className="rounded-lg bg-secondary/50 border p-3 mb-3">
              {recruiter.hiring_manager_notes.map((note, i) => (
                <p key={i} className="text-[11px] text-muted-foreground leading-relaxed italic">"{note}"</p>
              ))}
            </div>
          ) : null}
          {recruiter.missed?.length ? (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">What Recruiters Missed</p>
              <div className="space-y-1">
                {recruiter.missed.map((m, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px]">
                    <XCircle className="h-3 w-3 text-score-risk mt-px shrink-0" />
                    <span className="text-muted-foreground">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </div>
  );
}
