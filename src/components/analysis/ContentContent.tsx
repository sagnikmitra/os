import { useState } from "react";
import { ScoreCard, SeverityBadge } from "@/components/ScoreCard";
import { motion } from "@/lib/motion-stub";
import {
  Type, CheckCircle2, AlertTriangle, BarChart3, RefreshCw, Hash, Target,
  PenTool, Sparkles, Copy, TrendingUp, Zap, ArrowRight, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/AnalysisContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw as RefreshIcon, Loader2 } from "lucide-react";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

function MiniGauge({ value, size = 56, stroke = 5, color }: { value: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-secondary" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${(value / 100) * circ} ${circ}`} className={color} />
    </svg>
  );
}

export function ContentContent() {
  const { analysis, setAnalysis, fileName } = useAnalysis();
  const [analyzing, setAnalyzing] = useState(false);
  if (!analysis) return null;

  const c = analysis.content_analysis;
  const impactScore = analysis.scores.impact_strength;
  const score = analysis.scores.content_quality;
  const quant = c.quantification_depth;
  const star = c.star_compliance;
  const xyz = c.xyz_compliance;
  const ha = analysis.humanizer_analysis;

  const strongPct = c.total_bullets ? Math.round((c.strong_bullets / c.total_bullets) * 100) : 0;
  const metricPct = c.total_bullets ? Math.round(((c.metrics_used || 0) / c.total_bullets) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div {...fade(0)} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">Content & Impact Analysis</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Every bullet analyzed — strength, impact, metrics, and rewrites.</p>
        </div>
        <div className="flex items-center gap-2">
          <ScoreCard title="Content" score={score.score} icon={<Type className="h-4 w-4" />} compact />
          <ScoreCard title="Impact" score={impactScore.score} icon={<TrendingUp className="h-4 w-4" />} compact />
        </div>
      </motion.div>

      <motion.div {...fade(0.5)} className="flex flex-wrap gap-2">
        <Link to="/rewrites"><Button variant="outline" size="sm" className="gap-1.5 text-xs"><Sparkles className="h-3 w-3" /> Rewrite Weak Bullets</Button></Link>
        <Link to="/humanizer"><Button variant="outline" size="sm" className="gap-1.5 text-xs">Humanize Content</Button></Link>
        <Link to="/builder"><Button variant="outline" size="sm" className="gap-1.5 text-xs"><PenTool className="h-3 w-3" /> Edit in Builder</Button></Link>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1.5 text-xs text-primary border-primary/20 hover:bg-primary/5 ml-auto"
          onClick={async () => {
            if (!analysis?.resume_id) {
              toast.error("Original file link not found. Please re-upload.");
              return;
            }
            setAnalyzing(true);
            const loadingToast = toast.loading("Running deep bullet analysis...");
            try {
              const { data: resume, error: fetchError } = await supabase
                .from("saved_resumes")
                .select("resume_data, title")
                .eq("id", analysis.resume_id)
                .single();
              
              if (fetchError || !resume) throw new Error("Could not find source resume data");

              const resumeText = typeof resume.resume_data === 'string' 
                ? resume.resume_data 
                : JSON.stringify(resume.resume_data, null, 2);

              const { data: newData, error: fnError } = await supabase.functions.invoke("analyze-resume", {
                body: { resumeText, fileName: resume.title, mimeType: "text/plain" }
              });

              if (fnError || !newData?.analysis) throw new Error(fnError?.message || "Analysis failed");

              if (analysis._id) {
                await supabase.from("resume_analyses").update({ 
                  resume_text: JSON.stringify(newData.analysis),
                  scores: newData.analysis.scores || {},
                } as any).eq("id", analysis._id);
              }

              setAnalysis({ ...newData.analysis, resume_id: analysis.resume_id }, fileName);
              toast.success("Analysis upgraded to full depth!");
            } catch (err: any) {
              toast.error(err.message);
            } finally {
              toast.dismiss(loadingToast);
              setAnalyzing(false);
            }
          }}
          disabled={analyzing}
        >
          {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshIcon className="h-3 w-3" />}
          Deep Re-scan
        </Button>
      </motion.div>

      {/* Key metrics with gauges */}
      <motion.div {...fade(1)} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="relative w-14 h-14 mx-auto mb-2">
            <MiniGauge value={strongPct} color={strongPct >= 60 ? "stroke-score-excellent" : strongPct >= 40 ? "stroke-score-warning" : "stroke-score-critical"} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold tabular-nums">{strongPct}%</span>
            </div>
          </div>
          <p className="text-xs font-semibold">{c.strong_bullets} Strong</p>
          <p className="text-[10px] text-muted-foreground">of {c.total_bullets} bullets</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold tabular-nums text-score-warning">{c.weak_bullets}</div>
          <p className="text-xs font-semibold mt-1">Weak Bullets</p>
          <p className="text-[10px] text-muted-foreground">need rewriting</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="relative w-14 h-14 mx-auto mb-2">
            <MiniGauge value={metricPct} color={metricPct >= 50 ? "stroke-score-excellent" : metricPct >= 30 ? "stroke-score-warning" : "stroke-score-critical"} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold tabular-nums">{metricPct}%</span>
            </div>
          </div>
          <p className="text-xs font-semibold">{c.metrics_used || 0} Metrics</p>
          <p className="text-[10px] text-muted-foreground">target: 60%+</p>
        </div>
        {c.power_language_score !== undefined && (
          <div className="rounded-xl border bg-card p-4 text-center">
            <div className="relative w-14 h-14 mx-auto mb-2">
              <MiniGauge value={c.power_language_score} color={c.power_language_score >= 70 ? "stroke-score-excellent" : c.power_language_score >= 50 ? "stroke-score-warning" : "stroke-score-critical"} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold tabular-nums">{c.power_language_score}</span>
              </div>
            </div>
            <p className="text-xs font-semibold">Power Language</p>
            <p className="text-[10px] text-muted-foreground">/100</p>
          </div>
        )}
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold tabular-nums">{c.total_bullets}</div>
          <p className="text-xs font-semibold mt-1">Total Bullets</p>
          <p className="text-[10px] text-muted-foreground">analyzed</p>
        </div>
      </motion.div>

      {/* STAR + XYZ Compliance */}
      {(star || xyz) && (
        <motion.div {...fade(2)} className="grid sm:grid-cols-2 gap-4">
          {star && (
            <div className="rounded-xl border bg-card p-4 sm:p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> STAR Compliance
              </h3>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="text-center p-3 rounded-lg bg-score-excellent/5 border border-score-excellent/15">
                  <div className="text-xl font-bold tabular-nums text-score-excellent">{star.complete}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Complete</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-score-warning/5 border border-score-warning/15">
                  <div className="text-xl font-bold tabular-nums text-score-warning">{star.partial}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Partial</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-score-critical/5 border border-score-critical/15">
                  <div className="text-xl font-bold tabular-nums text-score-critical">{star.missing}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Missing</div>
                </div>
              </div>
            </div>
          )}
          {xyz && (
            <div className="rounded-xl border bg-card p-4 sm:p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> XYZ Compliance
              </h3>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="text-center p-3 rounded-lg bg-score-excellent/5 border border-score-excellent/15">
                  <div className="text-xl font-bold tabular-nums text-score-excellent">{xyz.complete}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Complete</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-score-warning/5 border border-score-warning/15">
                  <div className="text-xl font-bold tabular-nums text-score-warning">{xyz.partial}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Partial</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-score-critical/5 border border-score-critical/15">
                  <div className="text-xl font-bold tabular-nums text-score-critical">{xyz.missing}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Missing</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Quantification depth */}
      {quant && (
        <motion.div {...fade(3)} className="rounded-xl border bg-card p-4 sm:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Hash className="h-4 w-4 text-primary" /> Quantification Depth
            <span className="ml-auto text-sm font-bold tabular-nums">{quant.score}/100</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { v: quant.bullets_with_numbers, l: "Numbers", icon: "#" },
              { v: quant.bullets_with_percentages, l: "Percentages", icon: "%" },
              { v: quant.bullets_with_dollar_amounts, l: "Dollar Amounts", icon: "$" },
              { v: quant.bullets_with_time_frames, l: "Time Frames", icon: "⏱" },
            ].map(s => (
              <div key={s.l} className="text-center p-3 rounded-lg bg-secondary/50">
                <div className="text-lg font-bold tabular-nums">{s.v}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
          {quant.recommendations?.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              {quant.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <BarChart3 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{r}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Action verbs + Repeated */}
      {(c.action_verbs_used?.length || c.repeated_verbs?.length) && (
        <motion.div {...fade(4)} className="grid sm:grid-cols-2 gap-4">
          {c.action_verbs_used && c.action_verbs_used.length > 0 && (
            <div className="rounded-xl border bg-card p-4 sm:p-5">
              <h3 className="font-semibold text-sm mb-3">Action Verbs ({c.action_verbs_used.length})</h3>
              <div className="flex flex-wrap gap-1.5">
                {c.action_verbs_used.map((v) => (
                  <span key={v} className="px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary border border-primary/20">{v}</span>
                ))}
              </div>
            </div>
          )}
          {c.repeated_verbs && c.repeated_verbs.length > 0 && (
            <div className="rounded-xl border bg-card p-4 sm:p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-score-warning" /> Repeated Verbs ({c.repeated_verbs.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {c.repeated_verbs.map((v) => (
                  <span key={v} className="px-2 py-0.5 rounded-md text-xs bg-score-warning/10 text-score-warning border border-score-warning/20">{v}</span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Authenticity snapshot (from humanizer) */}
      {ha && (
        <motion.div {...fade(4.5)} className="rounded-xl border bg-card p-4 sm:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Authenticity & Tone
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {ha.ai_probability !== undefined && (
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <div className={cn("text-xl font-bold tabular-nums", ha.ai_probability > 50 ? "text-score-critical" : "text-score-excellent")}>{ha.ai_probability}%</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Probability</div>
              </div>
            )}
            {ha.tone_analysis && (
              <>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <div className="text-sm font-bold">{ha.tone_analysis.overall_tone}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Tone</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <div className="text-lg font-bold tabular-nums">{ha.tone_analysis.personality_score}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Personality</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <div className="text-sm font-bold">{ha.tone_analysis.voice_uniqueness}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Uniqueness</div>
                </div>
              </>
            )}
          </div>
          {ha.detections?.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                Flagged Phrases ({ha.detections.length})
              </p>
              {ha.detections.slice(0, 3).map((d, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-score-warning/5 border border-score-warning/10 mb-2">
                  <XCircle className="h-3.5 w-3.5 text-score-warning mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground line-through">"{d.original}"</p>
                    <p className="text-[11px] text-score-excellent mt-0.5">→ "{d.humanized}"</p>
                  </div>
                </div>
              ))}
              {ha.detections.length > 3 && (
                <Link to="/humanizer" className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline mt-1">
                  View all {ha.detections.length} flagged phrases <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Bullet analysis */}
      {c.bullets?.length > 0 && (
        <motion.div {...fade(5)} className="rounded-xl border bg-card overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm">Bullet-by-Bullet Analysis ({c.bullets.length})</h3>
            <span className="text-xs text-muted-foreground">
              <span className="text-score-excellent font-semibold">{c.bullets.filter(b => b.strength === "strong").length}</span> strong · <span className="text-score-warning font-semibold">{c.bullets.filter(b => b.strength === "weak").length}</span> weak
            </span>
          </div>
          <div className="divide-y">
            {c.bullets.map((b, i) => (
              <motion.div key={i} {...fade(i + 6)} className="p-4">
                <div className="flex items-start gap-3 mb-2">
                  {b.strength === "strong" ? (
                    <CheckCircle2 className="h-4 w-4 text-score-excellent mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-score-warning mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed">{b.text}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {b.section && <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{b.section}</span>}
                      {b.verb && <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">verb: {b.verb}</span>}
                      {b.has_metric && <span className="text-[9px] px-1.5 py-0.5 rounded bg-score-excellent/10 text-score-excellent">has metric</span>}
                      {!b.has_metric && b.strength === "weak" && <span className="text-[9px] px-1.5 py-0.5 rounded bg-score-warning/10 text-score-warning">no metric</span>}
                    </div>
                    {b.issue && <p className="text-[11px] text-score-warning mt-1.5 font-medium">{b.issue}</p>}
                  </div>
                  <SeverityBadge level={b.strength === "strong" ? "excellent" : "warning"} label={b.strength === "strong" ? "Strong" : "Weak"} />
                </div>
                {b.fix && (
                  <div className="ml-7 mt-2 p-3 rounded-lg bg-score-excellent/5 border border-score-excellent/15">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Suggested Rewrite</p>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => { navigator.clipboard.writeText(b.fix); toast.success("Copied!"); }}>
                        <Copy className="h-3 w-3" /> Copy
                      </Button>
                    </div>
                    <p className="text-xs leading-relaxed">{b.fix}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Redundancy + Content Issues */}
      <div className="grid sm:grid-cols-2 gap-4">
        {c.redundancy_report && c.redundancy_report.length > 0 && (
          <motion.div {...fade(20)} className="rounded-xl border bg-card p-4 sm:p-5">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-score-risk" /> Redundancy ({c.redundancy_report.length})
            </h3>
            <div className="space-y-2">
              {c.redundancy_report.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2.5 rounded-lg bg-score-warning/5 border border-score-warning/10">
                  <AlertTriangle className="h-3.5 w-3.5 text-score-warning mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{r}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {c.issues?.length > 0 && (
          <motion.div {...fade(21)} className="rounded-xl border bg-card p-4 sm:p-5">
            <h3 className="font-semibold text-sm mb-4">Content Issues ({c.issues.length})</h3>
            <div className="space-y-2">
              {c.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2.5 rounded-lg bg-secondary/40">
                  <AlertTriangle className="h-3.5 w-3.5 text-score-warning mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{issue}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
