import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { SeverityBadge, getScoreLevel } from "@/components/ScoreCard";
import { motion } from "@/lib/motion-stub";
import {
  FileText, Clock, Award, Download, Loader2, Shield, Eye, Type, Bot,
  Layers, Target, Zap, TrendingUp, Brain, GitFork, User, BarChart3,
  AlertTriangle, CheckCircle2,
} from "lucide-react";
import { useAnalysis } from "@/context/AnalysisContext";
import { Link } from "react-router-dom";
import { AnalysisRequiredState } from "@/components/AnalysisRequiredState";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateFullReport } from "@/lib/generateReport";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles as SparklesIcon, RefreshCw as RefreshIcon } from "lucide-react";

// Import actual analysis content components
import { ATSAnalysisContent } from "@/components/analysis/ATSContent";
import { ContentContent } from "@/components/analysis/ContentContent";
import { RecruiterContent } from "@/components/analysis/RecruiterContent";
import { StructureContent } from "@/components/analysis/StructureContent";
import { ParsingContent } from "@/components/analysis/ParsingContent";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export function ReportsContent({ embedded = false }: { embedded?: boolean }) {
  const { analysis, fileName, setAnalysis } = useAnalysis();
  const [generating, setGenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleDeepRescan = async () => {
    if (!analysis?.resume_id) {
       toast.error("Original resume file not found for this report.");
       return;
    }
    setAnalyzing(true);
    const loadingToast = toast.loading("Launching Deep Analysis (50+ Frameworks)... This may take 2-3 minutes.", {
      description: "We're auditing every bullet point against executive industry standards.",
    });
    
    try {
      // 1. Determine the best source of text for analysis
      let resumeText = analysis.resume_text;
      let resumeTitle = fileName;

      // If no persistent text, fetch from saved_resumes as fallback
      if (!resumeText) {
        const { data: resume, error: fetchError } = await supabase
          .from("saved_resumes")
          .select("resume_data, title")
          .eq("id", analysis.resume_id)
          .single();
        
        if (fetchError || !resume) throw new Error("Could not find source resume data");

        resumeText = typeof resume.resume_data === 'string' 
          ? resume.resume_data 
          : JSON.stringify(resume.resume_data, null, 2);
        resumeTitle = resume.title;
      }

      // 2. Call Edge Function with text and isDeep flag
      const { data: newData, error: fnError } = await supabase.functions.invoke("analyze-resume", {
        body: { 
          resumeText, 
          fileName: resumeTitle, 
          mimeType: "text/plain",
          isDeep: true
        }
      });

      if (fnError) throw new Error(fnError.message || "Analysis failed");
      if (!newData?.analysis) throw new Error("No analysis returned");

      // 4. Update the record in resume_analyses to persist the fix
      if (analysis._id) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id: _, ...cleanNewAnalysis } = newData.analysis;
        await supabase
          .from("resume_analyses")
          .update({ 
            ...cleanNewAnalysis,
            resume_text: newData.analysis.full_raw_text || resumeText,
            id: analysis._id, 
          } as any)
          .eq("id", analysis._id);
      }

      // 5. Update Local UI
      const prevCount = analysis.content_analysis?.bullets?.length || 0;
      const newCount = newData.analysis.content_analysis?.bullets?.length || 0;
      
      setAnalysis({ ...newData.analysis, resume_id: analysis.resume_id }, fileName);
      
      toast.dismiss(loadingToast);
      toast.success(`Analysis upgraded! Now showing ${newCount} bullets (was ${prevCount}).`, {
        duration: 5000,
        icon: <SparklesIcon className="h-4 w-4 text-primary" />
      });
    } catch (err: any) {
      toast.dismiss(loadingToast);
      console.error("Deep scan error:", err);
      toast.error(err.message || "Deep analysis failed. This is usually due to a heavy resume or a network timeout. Please try again in a few moments.", {
        duration: 8000
      });
    } finally {
      setAnalyzing(false);
    }
  };

  if (!analysis) return (
    <AnalysisRequiredState
      pageTitle="Full Analysis Report"
      description="Upload your resume to generate a comprehensive PDF report covering all analysis dimensions."
    />
  );

  // Check for "bad data" or blank reports
  const hasData = analysis && Object.keys(analysis.scores || {}).length > 0;

  if (!hasData) return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-xl mx-auto space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight">Analysis Data Missing</h2>
        <p className="text-sm text-muted-foreground">
          This report seems to be incomplete or missing its analysis data. 
          This can happen if the original analysis was interrupted.
        </p>
      </div>
      <Button 
        onClick={handleDeepRescan} 
        disabled={analyzing} 
        className="gap-2"
        size="lg"
      >
        {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshIcon className="h-4 w-4" />}
        Repair This Report
      </Button>
      <Link to="/upload" className="text-xs text-primary hover:underline">Or upload a new resume</Link>
    </div>
  );

  const verdict = analysis.overall_verdict;
  const scoreEntries = Object.entries(analysis.scores);
  const ha = analysis.humanizer_analysis;
  const sk = analysis.skills_analysis;
  const narrative = analysis.career_narrative;
  const cm = analysis.competency_mapping;
  const ir = analysis.improvement_roadmap;
  const iv = analysis.interview_vulnerability;
  const cau = analysis.consistency_audit;
  const bs = analysis.bias_scan;
  const ib = analysis.industry_benchmarking;

  const handleDownload = async () => {
    setGenerating(true);
    try {
      await generateFullReport(analysis, fileName);
      toast.success("Full PDF report downloaded!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };


  const Section = ({ title, icon, children, idx }: { title: string; icon: React.ReactNode; children: React.ReactNode; idx: number }) => (
    <motion.div {...fade(idx)} className="rounded-xl border bg-card p-5 sm:p-6">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">{icon} {title}</h3>
      {children}
    </motion.div>
  );

  let sectionIdx = 0;

  return (
    <div className={cn(
      "space-y-6 sm:space-y-8",
      !embedded && "p-4 sm:p-6 max-w-5xl mx-auto"
    )}>
        {/* Header */}
        <motion.div {...fade(0)} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Comprehensive Analysis Report</h2>
            <p className="text-sm text-muted-foreground mt-1">Every insight from your analysis in one place</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              onClick={handleDeepRescan} 
              disabled={analyzing} 
              variant="outline" 
              className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
            >
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshIcon className="h-4 w-4" />}
              Deep Re-scan
            </Button>
            <Button onClick={handleDownload} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download PDF
            </Button>
          </div>
        </motion.div>

        {/* Executive Summary Card */}
        <motion.div {...fade(1)} className="rounded-xl border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{fileName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Analyzed just now</p>
              </div>
            </div>
            {verdict && (
              <div className="text-center">
                <div className="text-3xl font-bold font-display">{verdict.grade}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Grade</div>
              </div>
            )}
          </div>

          {/* Scores */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-5">
            {scoreEntries.map(([key, val]) => (
              <div key={key} className="text-center p-3 rounded-lg bg-secondary/50">
                <div className={`text-lg font-bold tabular-nums score-${getScoreLevel(val.score)}`}>{val.score}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{key.replace(/_/g, " ").replace("readability", "read.")}</div>
              </div>
            ))}
          </div>

          {verdict && (
            <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
              <p className="text-sm leading-relaxed text-muted-foreground">{verdict.one_liner}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Award className="h-3 w-3" /> Response rate: {verdict.estimated_response_rate}</span>
                <SeverityBadge level={verdict.ready_to_apply ? "excellent" : "risk"} label={verdict.ready_to_apply ? "Ready" : "Not Ready"} />
                {verdict.biggest_asset && <span className="text-score-excellent">Best: {verdict.biggest_asset}</span>}
                {verdict.biggest_risk && <span className="text-score-risk">Risk: {verdict.biggest_risk}</span>}
              </div>
              {verdict.top_3_actions?.length ? (
                <div className="pt-2 border-t border-border/50 mt-2">
                  <p className="text-xs font-semibold mb-1">Top Actions</p>
                  {verdict.top_3_actions.map((a, i) => <p key={i} className="text-xs text-muted-foreground">→ {a}</p>)}
                </div>
              ) : null}
            </div>
          )}
        </motion.div>

        {/* Priorities */}
        {analysis.priorities?.length > 0 && (
          <Section title={`Priority Action Items (${analysis.priorities.length})`} icon={<AlertTriangle className="h-4 w-4 text-score-risk" />} idx={sectionIdx++}>
            <div className="space-y-2">
              {analysis.priorities.map((p, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${p.severity === "critical" ? "bg-score-critical" : p.severity === "risk" ? "bg-score-risk" : "bg-score-warning"}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm">{p.label}</span>
                    <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                      {p.effort && <span>Effort: {p.effort}</span>}
                      {p.estimated_impact && <span className="text-score-excellent">Impact: {p.estimated_impact}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Strengths & Red Flags */}
        <div className="grid md:grid-cols-2 gap-5">
          {analysis.strengths?.length > 0 && (
            <Section title={`Strengths (${analysis.strengths.length})`} icon={<CheckCircle2 className="h-4 w-4 text-score-excellent" />} idx={sectionIdx++}>
              <div className="space-y-1.5">{analysis.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="h-3.5 w-3.5 text-score-excellent mt-0.5 shrink-0" /><span className="text-muted-foreground">{s}</span></div>
              ))}</div>
            </Section>
          )}
          {analysis.red_flags?.length > 0 && (
            <Section title={`Red Flags (${analysis.red_flags.length})`} icon={<AlertTriangle className="h-4 w-4 text-score-critical" />} idx={sectionIdx++}>
              <div className="space-y-1.5">{analysis.red_flags.map((r, i) => {
                const label = typeof r === "string" ? r : (r as any).label || (r as any).issue || String(r);
                return <div key={i} className="flex items-start gap-2 text-sm"><AlertTriangle className="h-3.5 w-3.5 text-score-critical mt-0.5 shrink-0" /><span className="text-muted-foreground">{label}</span></div>;
              })}</div>
            </Section>
          )}
        </div>

        {/* ══ FULL ANALYSIS SECTIONS — using actual page components ══ */}

        {/* ATS Analysis */}
        {analysis.ats_analysis && (
          <motion.div {...fade(sectionIdx++)} className="space-y-6">
            <Separator />
            <ATSAnalysisContent />
          </motion.div>
        )}

        {/* Content Quality */}
        {analysis.content_analysis && (
          <motion.div {...fade(sectionIdx++)} className="space-y-6">
            <Separator />
            <ContentContent />
          </motion.div>
        )}

        {/* Recruiter View */}
        {analysis.recruiter_analysis && (
          <motion.div {...fade(sectionIdx++)} className="space-y-6">
            <Separator />
            <RecruiterContent />
          </motion.div>
        )}

        {/* Structure */}
        {analysis.structure_analysis && (
          <motion.div {...fade(sectionIdx++)} className="space-y-6">
            <Separator />
            <StructureContent />
          </motion.div>
        )}

        {/* Parsing */}
        {analysis.parsing_analysis && (
          <motion.div {...fade(sectionIdx++)} className="space-y-6">
            <Separator />
            <ParsingContent />
          </motion.div>
        )}

        {/* AI Detection */}
        {ha && (
          <>
            <Separator />
            <Section title="AI Detection Analysis" icon={<Bot className="h-4 w-4 text-primary" />} idx={sectionIdx++}>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-4 text-sm">
                  <span>Verdict: <strong>{ha.verdict}</strong></span>
                  {ha.ai_probability !== undefined && <span className={ha.ai_probability > 50 ? "text-score-critical" : "text-score-excellent"}>AI Probability: <strong>{ha.ai_probability}%</strong></span>}
                </div>
                {ha.tone_analysis && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/50 text-center">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Tone</div>
                      <div className="text-sm font-semibold">{ha.tone_analysis.overall_tone}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50 text-center">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Consistency</div>
                      <div className="text-sm font-semibold">{ha.tone_analysis.consistency}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50 text-center">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Personality</div>
                      <div className="text-sm font-bold tabular-nums">{ha.tone_analysis.personality_score}/100</div>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50 text-center">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Voice</div>
                      <div className="text-sm font-semibold">{ha.tone_analysis.voice_uniqueness}</div>
                    </div>
                  </div>
                )}
                {ha.vocabulary_analysis && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Diversity: <strong>{ha.vocabulary_analysis.diversity_score}/100</strong></span>
                      <span>Jargon: <strong>{ha.vocabulary_analysis.jargon_level}</strong></span>
                    </div>
                    {ha.vocabulary_analysis.overused_buzzwords?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {ha.vocabulary_analysis.overused_buzzwords.map((b, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-xs bg-score-warning/10 text-score-warning border border-score-warning/20">{b}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {ha.flags?.length > 0 && <div className="space-y-1">{ha.flags.map((f, i) => <p key={i} className="text-xs text-muted-foreground flex items-start gap-2"><AlertTriangle className="h-3 w-3 text-score-warning mt-0.5 shrink-0" />{f}</p>)}</div>}
                {ha.detections?.slice(0, 5).map((d, i) => (
                  <div key={i} className="p-3 rounded-lg bg-secondary/40 space-y-1.5">
                    <p className="text-xs text-score-critical italic">"{d.original}"</p>
                    <p className="text-xs text-muted-foreground">Issue: {d.issue}</p>
                    <p className="text-xs text-score-excellent">→ {d.humanized}</p>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* Skills */}
        {sk && (
          <>
            <Separator />
            <Section title="Skills Analysis" icon={<Zap className="h-4 w-4 text-primary" />} idx={sectionIdx++}>
              <div className="space-y-4">
                {sk.technical_skills?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2">Technical Skills</p>
                    <div className="flex flex-wrap gap-1.5">{sk.technical_skills.map((s, i) => <span key={i} className="px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary border border-primary/20">{s}</span>)}</div>
                  </div>
                )}
                {sk.soft_skills?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2">Soft Skills</p>
                    <div className="flex flex-wrap gap-1.5">{sk.soft_skills.map((s, i) => <span key={i} className="px-2 py-0.5 rounded-md text-xs bg-secondary text-foreground border border-border/50">{s}</span>)}</div>
                  </div>
                )}
                {sk.tools_platforms?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2">Tools & Platforms</p>
                    <div className="flex flex-wrap gap-1.5">{sk.tools_platforms.map((s, i) => <span key={i} className="px-2 py-0.5 rounded-md text-xs bg-secondary text-foreground border border-border/50">{s}</span>)}</div>
                  </div>
                )}
                {sk.missing_for_role?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2 text-score-critical">Missing for Target Role</p>
                    <div className="flex flex-wrap gap-1.5">{sk.missing_for_role.map((s, i) => <span key={i} className="px-2 py-0.5 rounded-md text-xs bg-score-critical/10 text-score-critical border border-score-critical/20">{s}</span>)}</div>
                  </div>
                )}
                {sk.onet_mapping && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs font-semibold mb-1">O*NET Match</p>
                    <p className="text-sm">{sk.onet_mapping.matched_occupation} <span className="text-muted-foreground">({sk.onet_mapping.match_percentage}%)</span></p>
                  </div>
                )}
              </div>
            </Section>
          </>
        )}

        {/* Career Narrative */}
        {narrative && (
          <>
            <Separator />
            <Section title="Career Narrative" icon={<TrendingUp className="h-4 w-4 text-primary" />} idx={sectionIdx++}>
              <div className="space-y-3">
                <p className="text-sm">{narrative.progression}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <div className="text-lg font-bold tabular-nums">{narrative.trajectory_strength}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Trajectory</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <div className="text-sm font-semibold">{narrative.story_coherence}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Coherence</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <div className="text-lg font-bold tabular-nums">{narrative.average_tenure_months}<span className="text-xs text-muted-foreground">mo</span></div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Tenure</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <div className="text-sm font-semibold">{narrative.job_tenure_pattern}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pattern</div>
                  </div>
                </div>
                {narrative.career_highlights?.length > 0 && (
                  <div className="space-y-1">{narrative.career_highlights.map((h, i) => <p key={i} className="text-xs flex items-start gap-2"><CheckCircle2 className="h-3 w-3 text-score-excellent mt-0.5 shrink-0" /><span className="text-muted-foreground">{h}</span></p>)}</div>
                )}
                {narrative.gaps?.length > 0 && (
                  <div className="space-y-1">{narrative.gaps.map((g, i) => <p key={i} className="text-xs flex items-start gap-2"><AlertTriangle className="h-3 w-3 text-score-warning mt-0.5 shrink-0" /><span className="text-muted-foreground">{g.period} ({g.duration})</span></p>)}</div>
                )}
              </div>
            </Section>
          </>
        )}

        {/* Competency Mapping */}
        {cm && (
          <>
            <Separator />
            <Section title="Competency Mapping" icon={<Brain className="h-4 w-4 text-primary" />} idx={sectionIdx++}>
              <div className="grid sm:grid-cols-2 gap-3">
                {(["leadership", "technical_depth", "communication", "problem_solving", "collaboration", "innovation", "business_impact"] as const).map(k => {
                  const c = cm[k];
                  if (!c) return null;
                  return (
                    <div key={k} className="p-3 rounded-lg bg-secondary/40">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-semibold capitalize">{k.replace(/_/g, " ")}</span>
                        <span className={`text-sm font-bold tabular-nums score-${getScoreLevel(c.score)}`}>{c.score}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${c.score >= 80 ? "bg-score-excellent" : c.score >= 60 ? "bg-score-warning" : "bg-score-critical"}`} style={{ width: `${c.score}%` }} />
                      </div>
                      {c.evidence?.length > 0 && <p className="text-[10px] text-muted-foreground mt-1.5 truncate">✓ {c.evidence[0]}</p>}
                    </div>
                  );
                })}
              </div>
            </Section>
          </>
        )}

        {/* Consistency Audit */}
        {cau && (
          <>
            <Separator />
            <Section title="Consistency Audit" icon={<GitFork className="h-4 w-4 text-primary" />} idx={sectionIdx++}>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xl font-bold tabular-nums score-${getScoreLevel(cau.overall_consistency_score)}`}>{cau.overall_consistency_score}</span>
                  <div className="flex-1">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className={`h-2 rounded-full ${cau.overall_consistency_score >= 80 ? "bg-score-excellent" : cau.overall_consistency_score >= 60 ? "bg-score-warning" : "bg-score-critical"}`} style={{ width: `${cau.overall_consistency_score}%` }} />
                    </div>
                  </div>
                </div>
                {cau.contradictions?.length > 0 && cau.contradictions.map((c, i) => (
                  <div key={i} className="p-3 rounded-lg bg-score-critical/5 border border-score-critical/20 space-y-1.5">
                    <p className="text-xs text-score-critical">"{c.claim_a}" vs "{c.claim_b}"</p>
                    <p className="text-xs text-muted-foreground">{c.conflict}</p>
                    <p className="text-xs text-primary">→ {c.resolution}</p>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* Interview Vulnerability */}
        {iv && (
          <>
            <Separator />
            <Section title="Interview Vulnerability" icon={<User className="h-4 w-4 text-primary" />} idx={sectionIdx++}>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Risk Score:</span>
                  <span className={`text-xl font-bold tabular-nums score-${getScoreLevel(100 - iv.overall_risk_score)}`}>{iv.overall_risk_score}/100</span>
                </div>
                {iv.vague_claims?.slice(0, 4).map((v, i) => (
                  <div key={i} className="p-3 rounded-lg bg-secondary/40 space-y-1.5">
                    <p className="text-xs text-score-critical italic">"{v.text}"</p>
                    <p className="text-xs text-score-excellent">→ {v.better_version}</p>
                  </div>
                ))}
                {iv.behavioral_question_predictions?.slice(0, 4).map((b, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-primary/5 border border-primary/20">
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold shrink-0">{b.competency}</span>
                    <span className="text-muted-foreground">{b.question}</span>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* Improvement Roadmap */}
        {ir && (
          <>
            <Separator />
            <Section title="Improvement Roadmap" icon={<BarChart3 className="h-4 w-4 text-primary" />} idx={sectionIdx++}>
              <div className="space-y-4">
                {ir.immediate_fixes?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2 text-score-critical">Immediate Fixes</p>
                    {ir.immediate_fixes.slice(0, 5).map((f, i) => (
                      <div key={i} className="p-3 rounded-lg bg-secondary/40 mb-2 space-y-1">
                        <p className="text-sm font-medium">{f.action}</p>
                        <p className="text-xs text-score-critical line-through">{f.current}</p>
                        <p className="text-xs text-score-excellent">{f.improved}</p>
                        <p className="text-[10px] text-muted-foreground">Impact: {f.impact} · {f.time_estimate}</p>
                      </div>
                    ))}
                  </div>
                )}
                {ir.short_term_improvements?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2">Short-Term Improvements</p>
                    {ir.short_term_improvements.slice(0, 4).map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs mb-1.5">
                        <span className="text-primary">→</span>
                        <span>{s.action} <span className="text-muted-foreground">({s.time_estimate})</span></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          </>
        )}

        {/* Bias Scan */}
        {bs && (
          <>
            <Separator />
            <Section title="Bias Scan" icon={<Shield className="h-4 w-4 text-primary" />} idx={sectionIdx++}>
              <div className="space-y-2">
                <SeverityBadge level={bs.overall_risk === "low" ? "excellent" : bs.overall_risk === "medium" ? "warning" : "critical"} label={`Risk: ${bs.overall_risk}`} />
                {bs.recommendations?.length > 0 && bs.recommendations.map((r, i) => <p key={i} className="text-xs text-muted-foreground flex items-start gap-2"><span className="text-primary">→</span>{r}</p>)}
              </div>
            </Section>
          </>
        )}

        {/* Industry Benchmarking */}
        {ib && (
          <>
            <Separator />
            <Section title="Industry Benchmarking" icon={<BarChart3 className="h-4 w-4 text-primary" />} idx={sectionIdx++}>
              <div className="space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                    <div className="text-sm font-semibold">{ib.target_role}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Target Role</div>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                    <div className="text-sm font-semibold">{ib.target_level}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Level</div>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                    <div className="text-lg font-bold text-primary tabular-nums">Top {ib.percentile_estimate}%</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Percentile</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{ib.market_positioning}</p>
              </div>
            </Section>
          </>
        )}

        {/* Download CTA */}
        <motion.div {...fade(sectionIdx)} className="flex items-center justify-center gap-3 pt-2 pb-4">
          <Link to="/upload"><Button variant="outline">Upload Another Resume</Button></Link>
          <Button onClick={handleDownload} variant="default" disabled={generating} className="gap-2">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download Full PDF Report
          </Button>
        </motion.div>
      </div>
  );
}

export default function Reports({ embedded = false }: { embedded?: boolean }) {
  const content = <ReportsContent embedded={embedded} />;
  return embedded ? content : <AppLayout title="Full Report" subtitle="Comprehensive analysis with PDF export">{content}</AppLayout>;
}
