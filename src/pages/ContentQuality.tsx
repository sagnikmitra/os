import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { ScoreCard, SeverityBadge } from "@/components/ScoreCard";
import { motion } from "@/lib/motion-stub";
import { Type, CheckCircle2, AlertTriangle, BarChart3, RefreshCw, Hash, Target, PenTool, Sparkles, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/AnalysisContext";
import { Link } from "react-router-dom";
import { AnalysisRequiredState } from "@/components/AnalysisRequiredState";
import { toast } from "sonner";
import { ScoreRing, SectionNav, AnalysisSection, InlineTip, FilterChips } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export default function ContentQuality() {
  const { analysis } = useAnalysis();
  const [bulletFilter, setBulletFilter] = useState("all");

  if (!analysis) return (
    <AppLayout title="Content Quality">
      <AnalysisRequiredState
        pageTitle="Content Quality Analysis"
        description="Upload your resume to get AI-powered analysis of your bullet points, action verbs, metrics usage, and impact strength."
      />
    </AppLayout>
  );

  const c = analysis.content_analysis;
  const score = analysis.scores.content_quality;
  const quant = c.quantification_depth;
  const star = c.star_compliance;
  const bullets = c.bullets || [];

  const strongCount = bullets.filter(b => b.strength === "strong").length;
  const weakCount = bullets.filter(b => b.strength === "weak").length;

  const filteredBullets = bulletFilter === "all" ? bullets
    : bulletFilter === "weak" ? bullets.filter(b => b.strength === "weak")
    : bullets.filter(b => b.strength === "strong");

  const sections = [
    { id: "cq-stats", label: "Overview" },
    ...(star ? [{ id: "cq-star", label: "STAR Method" }] : []),
    ...(quant ? [{ id: "cq-quant", label: "Quantification" }] : []),
    { id: "cq-verbs", label: "Action Verbs" },
    { id: "cq-bullets", label: "Bullets", count: bullets.length },
    ...(c.issues?.length ? [{ id: "cq-issues", label: "Issues", count: c.issues.length }] : []),
  ];

  return (
    <AppLayout title="Content Quality">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2 pb-3 bg-background/80 backdrop-blur-lg border-b border-border/50 mb-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <ScoreRing score={score.score} size={52} strokeWidth={5} />
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight">Content Quality</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
                  {strongCount} strong · {weakCount} weak · {bullets.length} total bullets
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/rewrites"><Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"><Sparkles className="h-3 w-3" /> Rewrite</Button></Link>
              <Link to="/builder"><Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"><PenTool className="h-3 w-3" /> Edit</Button></Link>
            </div>
          </div>
          <SectionNav sections={sections} />
        </div>

        {/* Stats Grid */}
        <div id="cq-stats" className="scroll-mt-36">
          <motion.div {...fade(1)} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Strong", value: String(c.strong_bullets || 0), sub: `of ${c.total_bullets || 0}`, color: "score-excellent" },
              { label: "Weak", value: String(c.weak_bullets || 0), sub: "need rewriting", color: "score-warning" },
              { label: "With Metrics", value: String(c.metrics_used || 0), sub: "target: 60%+", color: "text-primary" },
              { label: "Total", value: String(c.total_bullets || 0), sub: "analyzed", color: "text-foreground" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border bg-card p-4 text-center">
                <div className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</div>
                <div className="text-[10px] text-muted-foreground">{stat.sub}</div>
              </div>
            ))}
          </motion.div>
          {/* Visual strength ratio bar */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground shrink-0">Strength</span>
            <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden flex">
              <div className="bg-score-excellent h-full transition-all duration-700" style={{ width: `${bullets.length ? (strongCount / bullets.length) * 100 : 0}%` }} />
              <div className="bg-score-warning h-full transition-all duration-700" style={{ width: `${bullets.length ? (weakCount / bullets.length) * 100 : 0}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{bullets.length ? Math.round((strongCount / bullets.length) * 100) : 0}%</span>
          </div>
        </div>

        {/* STAR Compliance */}
        {star && (
          <AnalysisSection id="cq-star" title="STAR Method Compliance" subtitle="Situation → Task → Action → Result" icon={<Target className="h-4 w-4" />}>
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg score-bg-excellent border score-border-excellent">
                  <div className="text-xl font-bold tabular-nums score-excellent">{star.complete}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Complete</div>
                </div>
                <div className="text-center p-3 rounded-lg score-bg-warning border score-border-warning">
                  <div className="text-xl font-bold tabular-nums score-warning">{star.partial}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Partial</div>
                </div>
                <div className="text-center p-3 rounded-lg score-bg-critical border score-border-critical">
                  <div className="text-xl font-bold tabular-nums score-critical">{star.missing}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Missing</div>
                </div>
              </div>
              <InlineTip className="mt-3">Complete STAR bullets get 3× more recruiter engagement. Focus on adding results to partial bullets.</InlineTip>
            </div>
          </AnalysisSection>
        )}

        {/* Quantification */}
        {quant && (
          <AnalysisSection id="cq-quant" title="Quantification Depth" subtitle={`Score: ${quant.score}/100`} icon={<Hash className="h-4 w-4" />} badge={<ScoreRing score={quant.score} size={36} strokeWidth={3} />}>
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Numbers", value: quant.bullets_with_numbers },
                  { label: "Percentages", value: quant.bullets_with_percentages },
                  { label: "Dollar Amounts", value: quant.bullets_with_dollar_amounts },
                  { label: "Time Frames", value: quant.bullets_with_time_frames },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 rounded-lg bg-secondary/50">
                    <div className="text-lg font-bold tabular-nums">{s.value}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
              {quant.recommendations?.length > 0 && (
                <div className="space-y-2">
                  {quant.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <BarChart3 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AnalysisSection>
        )}

        {/* Action Verbs */}
        {(c.action_verbs_used?.length || c.repeated_verbs?.length) && (
          <div id="cq-verbs" className="scroll-mt-36 grid sm:grid-cols-2 gap-4">
            {c.action_verbs_used && c.action_verbs_used.length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3">Action Verbs ({c.action_verbs_used.length})</h3>
                <div className="flex flex-wrap gap-1.5">
                  {c.action_verbs_used.map((v) => (
                    <span key={v} className="px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary border border-primary/20">{v}</span>
                  ))}
                </div>
              </div>
            )}
            {c.repeated_verbs && c.repeated_verbs.length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-score-warning" /> Repeated Verbs
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {c.repeated_verbs.map((v) => (
                    <span key={v} className="px-2 py-0.5 rounded-md text-xs score-bg-warning score-warning border score-border-warning">{v}</span>
                  ))}
                </div>
                <InlineTip className="mt-3">Vary your verbs to demonstrate range. Replace repeated verbs with stronger alternatives.</InlineTip>
              </div>
            )}
          </div>
        )}

        {/* Bullet-by-Bullet */}
        {bullets.length > 0 && (
          <div id="cq-bullets" className="scroll-mt-36 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Bullet Analysis</h3>
              <FilterChips
                value={bulletFilter}
                onChange={setBulletFilter}
                options={[
                  { id: "all", label: "All", count: bullets.length },
                  { id: "weak", label: "Weak", count: weakCount },
                  { id: "strong", label: "Strong", count: strongCount },
                ]}
              />
            </div>

            {filteredBullets.map((b, i) => (
              <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-4 sm:p-5">
                <div className="flex items-start gap-3 mb-3">
                  {b.strength === "strong" ? (
                    <CheckCircle2 className="h-4 w-4 text-score-excellent mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-score-warning mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">{b.text}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {b.section && <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{b.section}</span>}
                      {b.verb && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">verb: {b.verb}</span>}
                      {b.has_metric && <span className="text-[10px] px-1.5 py-0.5 rounded score-bg-excellent score-excellent">has metric</span>}
                      {!b.has_metric && b.strength === "weak" && <span className="text-[10px] px-1.5 py-0.5 rounded score-bg-warning score-warning">no metric</span>}
                    </div>
                    {b.issue && <p className="text-xs score-warning mt-1.5 font-medium">{b.issue}</p>}
                  </div>
                  <SeverityBadge level={b.strength === "strong" ? "excellent" : "warning"} label={b.strength === "strong" ? "Strong" : "Weak"} />
                </div>
                {b.fix && (
                  <div className="ml-7 mt-3 p-3 rounded-lg score-bg-excellent border score-border-excellent">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Suggested Rewrite</p>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => { navigator.clipboard.writeText(b.fix); toast.success("Copied!"); }}>
                        <Copy className="h-3 w-3" /> Copy
                      </Button>
                    </div>
                    <p className="text-sm leading-relaxed">{b.fix}</p>
                  </div>
                )}
              </motion.div>
            ))}

            {filteredBullets.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">No bullets match this filter.</div>
            )}
          </div>
        )}

        {/* Content Issues */}
        {c.issues?.length > 0 && (
          <AnalysisSection id="cq-issues" title="Content Issues" subtitle={`${c.issues.length} issues detected`} icon={<AlertTriangle className="h-4 w-4" />}>
            <div className="p-4 sm:p-5 grid sm:grid-cols-2 gap-3">
              {c.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-secondary/30">
                  <AlertTriangle className="h-3.5 w-3.5 text-score-warning mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{issue}</span>
                </div>
              ))}
            </div>
          </AnalysisSection>
        )}

        {/* Redundancy Report */}
        {c.redundancy_report && c.redundancy_report.length > 0 && (
          <AnalysisSection id="cq-redundancy" title="Redundancy Detected" icon={<RefreshCw className="h-4 w-4" />}>
            <div className="p-4 sm:p-5 space-y-2">
              {c.redundancy_report.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-secondary/30">
                  <AlertTriangle className="h-3.5 w-3.5 text-score-warning mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{r}</span>
                </div>
              ))}
            </div>
          </AnalysisSection>
        )}
      </div>
    </AppLayout>
  );
}
