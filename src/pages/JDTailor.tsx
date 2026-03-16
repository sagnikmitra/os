import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import {
  Target, ArrowRight, CheckCircle2, XCircle, AlertTriangle,
  Sparkles, Loader2, Copy, Briefcase, Zap, PenTool
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAnalysis } from "@/context/AnalysisContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { SeverityBadge } from "@/components/ScoreCard";
import { ScoreRing, SectionNav, AnalysisSection, InlineTip } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

interface TailoringResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  weakKeywords: string[];
  sectionSuggestions: { section: string; issue: string; suggestion: string; priority: "high" | "medium" | "low" }[];
  rewriteSuggestions: { original: string; rewritten: string; reason: string }[];
  overallAssessment?: string;
  topActions?: string[];
}

export default function JDTailor() {
  const [jd, setJd] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<TailoringResult | null>(null);
  const { analysis } = useAnalysis();

  const handleAnalyze = async () => {
    if (!jd.trim()) return;
    const resumeText = analysis
      ? `File: ${analysis.extracted_info?.name || "Resume"}\nTitle: ${analysis.extracted_info?.current_title || ""}\nSkills: ${analysis.ats_analysis?.matched_keywords?.join(", ") || ""}\nSummary from analysis scores and content.`
      : "No resume uploaded yet. Analyze based on JD keywords only.";
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("jd-gap-analysis", { body: { resumeText, jobDescription: jd } });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.result) setResult(data.result);
    } catch (err: any) { toast.error(err.message || "Analysis failed"); }
    finally { setAnalyzing(false); }
  };

  const sections = result ? [
    ...(result.topActions?.length ? [{ id: "jdt-actions", label: "Top Actions" }] : []),
    { id: "jdt-keywords", label: "Keywords" },
    ...(result.sectionSuggestions.length ? [{ id: "jdt-sections", label: "Sections", count: result.sectionSuggestions.length }] : []),
    ...(result.rewriteSuggestions.length ? [{ id: "jdt-rewrites", label: "Rewrites", count: result.rewriteSuggestions.length }] : []),
  ] : [];

  return (
    <AppLayout title="JD Tailoring">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <motion.div {...fade(0)}>
                <h2 className="text-xl font-bold tracking-tight">Job Description Tailoring</h2>
                <p className="text-sm text-muted-foreground mt-1">Paste a job description to get AI-powered gap analysis and rewrite suggestions.</p>
              </motion.div>

              <div className="rounded-xl border bg-card p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Paste Job Description</h3>
                  <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">{jd.trim().split(/\s+/).filter(Boolean).length} words</span>
                </div>
                <Textarea
                  value={jd}
                  onChange={e => setJd(e.target.value)}
                  placeholder="Paste the full job description here. Include requirements, responsibilities, and qualifications for the best analysis..."
                  className="min-h-[200px] text-sm"
                  disabled={analyzing}
                />
                <div className="flex items-center justify-between mt-4 gap-4">
                  {!analysis && (
                    <InlineTip className="flex-1">Upload a resume first for personalized gap analysis, or analyze JD keywords only.</InlineTip>
                  )}
                  {analysis && <InlineTip className="flex-1">Your analyzed resume will be compared against this JD for personalized recommendations.</InlineTip>}
                  <Button onClick={handleAnalyze} disabled={!jd.trim() || analyzing} className="gap-2 shrink-0">
                    {analyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</> : <>Analyze & Tailor <ArrowRight className="h-4 w-4" /></>}
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
                    <ScoreRing score={result.matchScore} size={52} strokeWidth={5} />
                    <div>
                      <h2 className="text-base sm:text-lg font-bold tracking-tight">JD Match: {result.matchScore}%</h2>
                      <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block line-clamp-1">{result.overallAssessment || "Based on keyword coverage, skill alignment, and role fit"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to="/builder"><Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"><PenTool className="h-3 w-3" /> Edit Resume</Button></Link>
                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setResult(null)}>New JD</Button>
                  </div>
                </div>
                <SectionNav sections={sections} />
              </div>

              {/* Top Actions */}
              {result.topActions && result.topActions.length > 0 && (
                <motion.div id="jdt-actions" {...fade(0)} className="scroll-mt-36 rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary"><Zap className="h-4 w-4" /> Do These First</h4>
                  <div className="space-y-2">
                    {result.topActions.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <span className="leading-relaxed">{a}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Keywords */}
              <div id="jdt-keywords" className="scroll-mt-36 grid sm:grid-cols-3 gap-4">
                <motion.div {...fade(1)} className="rounded-xl border bg-card p-5">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3"><CheckCircle2 className="h-4 w-4 text-score-excellent" /> Matched ({result.matchedKeywords.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedKeywords.map(kw => (
                      <span key={kw} className="px-2 py-0.5 rounded-md text-xs score-bg-excellent score-excellent font-medium">{kw}</span>
                    ))}
                  </div>
                </motion.div>
                <motion.div {...fade(2)} className="rounded-xl border bg-card p-5">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3"><XCircle className="h-4 w-4 text-score-critical" /> Missing ({result.missingKeywords.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingKeywords.map(kw => (
                      <span key={kw} className="px-2 py-0.5 rounded-md text-xs score-bg-critical score-critical font-medium">{kw}</span>
                    ))}
                  </div>
                  <InlineTip className="mt-3">Weave these keywords into your resume naturally — don't just list them in a skills section.</InlineTip>
                </motion.div>
                <motion.div {...fade(3)} className="rounded-xl border bg-card p-5">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3"><AlertTriangle className="h-4 w-4 text-score-warning" /> Weak ({result.weakKeywords.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.weakKeywords.map(kw => (
                      <span key={kw} className="px-2 py-0.5 rounded-md text-xs score-bg-warning score-warning font-medium">{kw}</span>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Section Suggestions */}
              {result.sectionSuggestions.length > 0 && (
                <AnalysisSection
                  id="jdt-sections"
                  title="Section-by-Section Tailoring"
                  subtitle={`${result.sectionSuggestions.length} sections need attention`}
                  icon={<Briefcase className="h-4 w-4" />}
                >
                  <div className="divide-y">
                    {result.sectionSuggestions.map((s, i) => (
                      <div key={i} className="p-4 flex items-start gap-3 hover:bg-secondary/20 transition-colors">
                        <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${s.priority === "high" ? "bg-score-critical" : s.priority === "medium" ? "bg-score-warning" : "bg-score-strong"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold">{s.section}</span>
                            <SeverityBadge level={s.priority === "high" ? "critical" : s.priority === "medium" ? "warning" : "strong"} label={s.priority} />
                          </div>
                          <p className="text-xs text-muted-foreground mb-1.5">{s.issue}</p>
                          <p className="text-xs leading-relaxed">{s.suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </AnalysisSection>
              )}

              {/* Rewrite Suggestions */}
              {result.rewriteSuggestions.length > 0 && (
                <div id="jdt-rewrites" className="scroll-mt-36 space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Rewrite Suggestions ({result.rewriteSuggestions.length})</h3>
                  {result.rewriteSuggestions.map((rw, i) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card overflow-hidden">
                      <div className="p-4 sm:p-5 space-y-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Original</p>
                          <p className="text-sm p-3 rounded-lg bg-destructive/5 border border-destructive/10 leading-relaxed">{rw.original}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1 flex items-center gap-1"><Zap className="h-3 w-3 text-score-excellent" /> Tailored</p>
                          <p className="text-sm p-3 rounded-lg score-bg-excellent border score-border-excellent leading-relaxed">{rw.rewritten}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground italic flex-1">{rw.reason}</p>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={() => { navigator.clipboard.writeText(rw.rewritten); toast.success("Copied!"); }}>
                            <Copy className="h-3 w-3" /> Copy
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
