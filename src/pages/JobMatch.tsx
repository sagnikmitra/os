import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { ScoreCard, SeverityBadge } from "@/components/ScoreCard";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import { Briefcase, ArrowRight, CheckCircle2, XCircle, AlertTriangle, Loader2, MessageSquare, HelpCircle, Copy, PenTool, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/AnalysisContext";
import { AnalysisRequiredState } from "@/components/AnalysisRequiredState";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ScoreRing, SectionNav, AnalysisSection, InlineTip, CheckSummaryBar } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

interface MatchResult {
  match_score: number;
  role_fit: { level: string; explanation: string };
  seniority_alignment: { level: string; explanation: string };
  domain_alignment: { level: string; explanation: string };
  matched_keywords: string[];
  missing_keywords: string[];
  weak_keywords: string[];
  requirements_match: { requirement: string; status: string; evidence: string }[];
  tailoring_recommendations: { priority: string; text: string }[];
  cover_letter_points: string[];
  interview_prep: string[];
  competitive_assessment: string;
}

export default function JobMatch() {
  const { analysis } = useAnalysis();
  const [jd, setJd] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!analysis) return (
    <AppLayout title="Job Match">
      <AnalysisRequiredState
        pageTitle="Job Match Analysis"
        description="Upload and analyze your resume first, then paste a job description to see how well you match and get tailoring tips."
        icon={<Briefcase className="h-7 w-7 text-primary" />}
      />
    </AppLayout>
  );

  const handleAnalyze = async () => {
    if (!jd.trim()) return;
    setAnalyzing(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("job-match", {
        body: { resumeAnalysis: analysis, jobDescription: jd },
      });
      if (fnError) throw new Error(fnError.message || "Match analysis failed");
      if (data?.error) throw new Error(data.error);
      if (!data?.match) throw new Error("No match results returned");
      setMatch(data.match);
    } catch (err: any) {
      console.error("Job match error:", err);
      setError(err.message);
      toast.error(err.message || "Failed to analyze match");
    } finally {
      setAnalyzing(false);
    }
  };

  const fitLevel = (level: string) => {
    if (level.toLowerCase().includes("strong") || level.toLowerCase().includes("aligned")) return "excellent" as const;
    if (level.toLowerCase().includes("moderate") || level.toLowerCase().includes("partial")) return "warning" as const;
    return "risk" as const;
  };

  const reqMet = match?.requirements_match?.filter(r => r.status === "met").length || 0;
  const reqPartial = match?.requirements_match?.filter(r => r.status === "partial").length || 0;
  const reqMissing = match?.requirements_match?.filter(r => r.status === "missing").length || 0;

  const sections = match ? [
    { id: "jm-fit", label: "Fit Overview" },
    ...(match.requirements_match?.length ? [{ id: "jm-reqs", label: "Requirements", count: match.requirements_match.length }] : []),
    { id: "jm-keywords", label: "Keywords" },
    ...(match.tailoring_recommendations?.length ? [{ id: "jm-tailor", label: "Tailoring Tips", count: match.tailoring_recommendations.length }] : []),
    ...(match.cover_letter_points?.length || match.interview_prep?.length ? [{ id: "jm-next", label: "Next Steps" }] : []),
  ] : [];

  return (
    <AppLayout title="Job Match">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <AnimatePresence mode="wait">
          {!match ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <motion.div {...fade(0)}>
                <h2 className="text-xl font-bold tracking-tight">Job Description Match</h2>
                <p className="text-sm text-muted-foreground mt-1">Paste a job description to see how your resume compares, with actionable gap analysis.</p>
              </motion.div>

              <div className="rounded-xl border bg-card p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Paste Job Description</h3>
                  <span className="text-[10px] text-muted-foreground ml-auto">{jd.trim().split(/\s+/).filter(Boolean).length} words</span>
                </div>
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the full job description here — include requirements, responsibilities, and qualifications for the best analysis..."
                  className="w-full h-48 p-4 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={analyzing}
                />
                {error && (
                  <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-4">
                  <InlineTip className="max-w-md">Include the full JD with requirements, qualifications, and responsibilities for the most accurate analysis.</InlineTip>
                  <Button variant="premium" className="gap-2 shrink-0 ml-4" onClick={handleAnalyze} disabled={!jd.trim() || analyzing}>
                    {analyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</> : <>Analyze Match <ArrowRight className="h-4 w-4" /></>}
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2 pb-3 bg-background/80 backdrop-blur-lg border-b border-border/50 mb-4">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <ScoreRing score={match.match_score} size={52} strokeWidth={5} />
                    <div>
                      <h2 className="text-base sm:text-lg font-bold tracking-tight">Job Match: {match.match_score}%</h2>
                      <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block line-clamp-1">{match.competitive_assessment}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to="/jd-tailor"><Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"><PenTool className="h-3 w-3" /> Tailor</Button></Link>
                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => { setMatch(null); setError(null); }}>New JD</Button>
                  </div>
                </div>
                <SectionNav sections={sections} />
              </div>

              {/* Fit Overview */}
              <div id="jm-fit" className="scroll-mt-36">
                <motion.div {...fade(1)} className="grid sm:grid-cols-3 gap-4">
                  {[
                    { label: "Role Fit", data: match.role_fit, icon: Briefcase },
                    { label: "Seniority Alignment", data: match.seniority_alignment, icon: ArrowRight },
                    { label: "Domain Alignment", data: match.domain_alignment, icon: CheckCircle2 },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border bg-card p-4 sm:p-5">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">{item.label}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <SeverityBadge level={fitLevel(item.data.level)} label={item.data.level} />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.data.explanation}</p>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Requirements Match */}
              {match.requirements_match?.length > 0 && (
                <div id="jm-reqs" className="scroll-mt-36">
                  <CheckSummaryBar passed={reqMet} warned={reqPartial} failed={reqMissing} className="mb-3" />
                  <AnalysisSection
                    id="jm-reqs-list"
                    title={`Requirements Match (${match.requirements_match.length})`}
                    subtitle={`${reqMet} met · ${reqPartial} partial · ${reqMissing} missing`}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    <div className="divide-y">
                      {match.requirements_match.map((r, i) => (
                        <div key={i} className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 hover:bg-secondary/30 transition-colors">
                          {r.status === "met" ? <CheckCircle2 className="h-4 w-4 text-score-excellent mt-0.5 shrink-0" /> :
                           r.status === "missing" ? <XCircle className="h-4 w-4 text-score-critical mt-0.5 shrink-0" /> :
                           <AlertTriangle className="h-4 w-4 text-score-warning mt-0.5 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{r.requirement}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{r.evidence}</p>
                          </div>
                          <SeverityBadge level={r.status === "met" ? "excellent" : r.status === "missing" ? "critical" : "warning"} label={r.status} />
                        </div>
                      ))}
                    </div>
                  </AnalysisSection>
                </div>
              )}

              {/* Keywords */}
              <div id="jm-keywords" className="scroll-mt-36 grid sm:grid-cols-3 gap-4">
                {match.matched_keywords?.length > 0 && (
                  <motion.div {...fade(5)} className="rounded-xl border bg-card p-5">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-score-excellent" /> Matched ({match.matched_keywords.length})
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {match.matched_keywords.map((kw) => (
                        <span key={kw} className="px-2 py-0.5 rounded-md text-xs font-medium score-bg-excellent score-excellent">{kw}</span>
                      ))}
                    </div>
                  </motion.div>
                )}
                {match.missing_keywords?.length > 0 && (
                  <motion.div {...fade(6)} className="rounded-xl border bg-card p-5">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-score-critical" /> Missing ({match.missing_keywords.length})
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {match.missing_keywords.map((kw) => (
                        <span key={kw} className="px-2 py-0.5 rounded-md text-xs font-medium score-bg-critical score-critical">{kw}</span>
                      ))}
                    </div>
                    <InlineTip className="mt-3">Add these keywords naturally into your experience bullets before applying.</InlineTip>
                  </motion.div>
                )}
                {match.weak_keywords?.length > 0 && (
                  <motion.div {...fade(7)} className="rounded-xl border bg-card p-5">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-score-warning" /> Weak ({match.weak_keywords.length})
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {match.weak_keywords.map((kw) => (
                        <span key={kw} className="px-2 py-0.5 rounded-md text-xs font-medium score-bg-warning score-warning">{kw}</span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Tailoring Recommendations */}
              {match.tailoring_recommendations?.length > 0 && (
                <AnalysisSection
                  id="jm-tailor"
                  title="Tailoring Recommendations"
                  subtitle={`${match.tailoring_recommendations.length} suggestions to improve your match`}
                  icon={<Sparkles className="h-4 w-4" />}
                >
                  <div className="p-4 sm:p-5 space-y-3">
                    {match.tailoring_recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          rec.priority === "critical" ? "bg-score-critical/10 text-score-critical" : rec.priority === "high" ? "bg-score-risk/10 text-score-risk" : rec.priority === "medium" ? "bg-score-warning/10 text-score-warning" : "bg-score-strong/10 text-score-strong"
                        }`}>{i + 1}</span>
                        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{rec.text}</p>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium shrink-0">{rec.priority}</span>
                      </div>
                    ))}
                  </div>
                </AnalysisSection>
              )}

              {/* Next Steps: Cover Letter + Interview */}
              {(match.cover_letter_points?.length > 0 || match.interview_prep?.length > 0) && (
                <div id="jm-next" className="scroll-mt-36 grid sm:grid-cols-2 gap-4">
                  {match.cover_letter_points?.length > 0 && (
                    <AnalysisSection id="jm-cover" title="Cover Letter Points" icon={<MessageSquare className="h-4 w-4" />}>
                      <div className="p-4 sm:p-5 space-y-2">
                        {match.cover_letter_points.map((p, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <span className="text-muted-foreground leading-relaxed">{p}</span>
                          </div>
                        ))}
                        <Link to="/cover-letter" className="block mt-3">
                          <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                            <MessageSquare className="h-3 w-3" /> Generate Cover Letter
                          </Button>
                        </Link>
                      </div>
                    </AnalysisSection>
                  )}
                  {match.interview_prep?.length > 0 && (
                    <AnalysisSection id="jm-interview" title="Interview Prep" icon={<HelpCircle className="h-4 w-4" />}>
                      <div className="p-4 sm:p-5 space-y-2">
                        {match.interview_prep.map((q, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-xs text-muted-foreground font-mono mt-0.5 shrink-0">{i + 1}.</span>
                            <span className="text-muted-foreground leading-relaxed">{q}</span>
                          </div>
                        ))}
                        <Link to="/interview-prep" className="block mt-3">
                          <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                            <HelpCircle className="h-3 w-3" /> Start Interview Prep
                          </Button>
                        </Link>
                      </div>
                    </AnalysisSection>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
