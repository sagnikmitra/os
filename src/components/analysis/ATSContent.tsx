import { ScoreCard, SeverityBadge } from "@/components/ScoreCard";
import { motion } from "@/lib/motion-stub";
import {
  Shield, CheckCircle2, XCircle, AlertTriangle, BarChart3, Hash, PenTool,
  Sparkles, Bot, Target as TargetIcon, TrendingUp, ArrowRight, Gauge, Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/AnalysisContext";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

const categoryColors: Record<string, string> = {
  formatting: "bg-primary/10 text-primary",
  keywords: "bg-accent/10 text-accent",
  structure: "bg-score-strong/10 score-strong",
  contact: "bg-score-warning/10 score-warning",
  compatibility: "bg-score-risk/10 score-risk",
};

function MiniGauge({ value, size = 48, stroke = 4, color }: { value: number; size?: number; stroke?: number; color: string }) {
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

function ProgressBar({ value, max = 100, color = "bg-primary" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ATSAnalysisContent() {
  const { analysis } = useAnalysis();
  if (!analysis) return null;

  const ats = analysis.ats_analysis;
  const score = analysis.scores.ats;
  const density = ats.keyword_density;
  const sim = ats.ats_simulation;

  const checksByCategory = (ats.checks || []).reduce((acc, c) => {
    const cat = c.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {} as Record<string, typeof ats.checks>);

  const passCount = (ats.checks || []).filter(c => c.status === "pass").length;
  const totalChecks = (ats.checks || []).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header with score + pass rate */}
      <motion.div {...fade(0)} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">ATS Compatibility Analysis</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">How well your resume survives automated screening systems.</p>
        </div>
        <ScoreCard title="ATS Score" score={score.score} icon={<Shield className="h-4 w-4" />} compact />
      </motion.div>

      {/* Quick actions */}
      <motion.div {...fade(0.5)} className="flex flex-wrap gap-2">
        <Link to="/builder"><Button variant="outline" size="sm" className="gap-1.5 text-xs"><PenTool className="h-3 w-3" /> Fix in Builder</Button></Link>
        <Link to="/rewrites"><Button variant="outline" size="sm" className="gap-1.5 text-xs"><Sparkles className="h-3 w-3" /> Rewrite Bullets</Button></Link>
        <Link to="/humanizer"><Button variant="outline" size="sm" className="gap-1.5 text-xs"><Bot className="h-3 w-3" /> Humanize</Button></Link>
        <Link to="/jd-tailor"><Button variant="outline" size="sm" className="gap-1.5 text-xs"><TargetIcon className="h-3 w-3" /> Tailor for JD</Button></Link>
      </motion.div>

      {/* Key metrics row */}
      <motion.div {...fade(1)} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center",
              ats.pass_likelihood === "High" ? "bg-score-excellent/10" : ats.pass_likelihood === "Medium" || ats.pass_likelihood === "Moderate" ? "bg-score-warning/10" : "bg-score-critical/10"
            )}>
              <Shield className={cn("h-5 w-5",
                ats.pass_likelihood === "High" ? "text-score-excellent" : ats.pass_likelihood === "Medium" || ats.pass_likelihood === "Moderate" ? "text-score-warning" : "text-score-critical"
              )} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Pass Likelihood</p>
              <p className="text-sm font-bold">{ats.pass_likelihood}</p>
            </div>
          </div>
        </div>
        {ats.estimated_rank_percentile && (
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Rank</p>
                <p className="text-sm font-bold">Top {ats.estimated_rank_percentile}%</p>
              </div>
            </div>
          </div>
        )}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-score-excellent/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-score-excellent" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Checks Passed</p>
              <p className="text-sm font-bold">{passCount}/{totalChecks}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Keywords</p>
              <p className="text-sm font-bold">{ats.matched_keywords?.length || 0} <span className="text-score-excellent text-xs">✓</span> · {ats.missing_keywords?.length || 0} <span className="text-score-warning text-xs">✗</span></p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ATS Simulation — visual cards */}
      {sim && (
        <motion.div {...fade(2)} className="rounded-xl border bg-card p-4 sm:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" /> ATS System Simulation
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(["greenhouse", "lever", "workday", "taleo"] as const).map(system => {
              const s = sim[system];
              if (!s) return null;
              const pct = s.parse_success;
              const col = pct >= 80 ? "stroke-score-excellent" : pct >= 60 ? "stroke-score-warning" : "stroke-score-critical";
              const barCol = pct >= 80 ? "bg-score-excellent" : pct >= 60 ? "bg-score-warning" : "bg-score-critical";
              return (
                <div key={system} className="rounded-lg border bg-card p-3 text-center">
                  <div className="relative w-14 h-14 mx-auto mb-2">
                    <MiniGauge value={pct} size={56} stroke={5} color={col} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold tabular-nums">{pct}%</span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold capitalize">{system}</p>
                  {s.issues?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {s.issues.slice(0, 2).map((issue, i) => (
                        <p key={i} className="text-[10px] text-muted-foreground leading-tight">{issue}</p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Keyword density */}
      {density && (
        <motion.div {...fade(3)} className="rounded-xl border bg-card p-4 sm:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Hash className="h-4 w-4 text-primary" /> Keyword Density Analysis
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <div className="text-xl font-bold tabular-nums">{density.total_keywords}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <div className="text-xl font-bold tabular-nums">{density.unique_keywords}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Unique</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <div className="text-sm font-bold">{density.industry_coverage}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Coverage</div>
            </div>
          </div>
          {density.top_repeated?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Top Repeated</p>
              <div className="flex flex-wrap gap-1.5">
                {density.top_repeated.map((kw) => (
                  <span key={kw.keyword} className="px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    {kw.keyword} <span className="text-muted-foreground ml-1">×{kw.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Keywords — matched vs missing */}
      <div className="grid sm:grid-cols-2 gap-4">
        {ats.matched_keywords?.length > 0 && (
          <motion.div {...fade(4)} className="rounded-xl border bg-card p-4 sm:p-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-score-excellent" /> Matched Keywords ({ats.matched_keywords.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {ats.matched_keywords.map((kw) => (
                <span key={kw} className="px-2 py-0.5 rounded-md text-xs font-medium bg-score-excellent/10 text-score-excellent border border-score-excellent/20">{kw}</span>
              ))}
            </div>
          </motion.div>
        )}
        {ats.missing_keywords?.length > 0 && (
          <motion.div {...fade(5)} className="rounded-xl border bg-card p-4 sm:p-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-score-warning" /> Missing Keywords ({ats.missing_keywords.length})
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {ats.missing_keywords.map((kw) => (
                <span key={kw} className="px-2 py-0.5 rounded-md text-xs font-medium bg-score-warning/10 text-score-warning border border-score-warning/20">{kw}</span>
              ))}
            </div>
            <Link to="/jd-tailor" className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline">
              Tailor to a specific job <ArrowRight className="h-3 w-3" />
            </Link>
          </motion.div>
        )}
      </div>

      {/* ATS Checks by category */}
      {Object.entries(checksByCategory).map(([cat, checks], ci) => (
        <motion.div key={cat} {...fade(ci + 6)} className="rounded-xl border bg-card overflow-hidden">
          <div className="p-4 border-b flex items-center gap-2">
            <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-bold", categoryColors[cat] || "bg-secondary text-secondary-foreground")}>{cat}</span>
            <h3 className="font-semibold text-sm">Checks</h3>
            <span className="text-xs text-muted-foreground ml-auto">
              {checks.filter(c => c.status === "pass").length}/{checks.length} passed
            </span>
            <ProgressBar value={checks.filter(c => c.status === "pass").length} max={checks.length} color={checks.filter(c => c.status === "pass").length === checks.length ? "bg-score-excellent" : "bg-score-warning"} />
          </div>
          <div className="divide-y">
            {checks.map((c, i) => (
              <div key={i} className="flex items-start gap-3 p-3 sm:p-4 hover:bg-secondary/30 transition-colors">
                {c.status === "pass" ? <CheckCircle2 className="h-4 w-4 text-score-excellent mt-0.5 shrink-0" /> :
                 c.status === "fail" ? <XCircle className="h-4 w-4 text-score-critical mt-0.5 shrink-0" /> :
                 <AlertTriangle className="h-4 w-4 text-score-warning mt-0.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium">{c.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{c.detail}</p>
                </div>
                <SeverityBadge level={c.status === "pass" ? "excellent" : c.status === "fail" ? "critical" : "warning"} />
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Formatting issues */}
      {ats.formatting_issues && ats.formatting_issues.length > 0 && (
        <motion.div {...fade(15)} className="rounded-xl border bg-card p-4 sm:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-score-risk" /> Formatting Issues ({ats.formatting_issues.length})
          </h3>
          <div className="space-y-2">
            {ats.formatting_issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-xs p-2.5 rounded-lg bg-score-risk/5 border border-score-risk/10">
                <XCircle className="h-3.5 w-3.5 text-score-risk mt-0.5 shrink-0" />
                <span className="text-muted-foreground flex-1">{issue}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ATS Recommendations */}
      {ats.recommendations?.length > 0 && (
        <motion.div {...fade(16)} className="rounded-xl border bg-card p-4 sm:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" /> ATS Recommendations ({ats.recommendations.length})
          </h3>
          <div className="space-y-2.5">
            {ats.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40 border border-border/40">
                <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0",
                  rec.priority === "critical" ? "bg-score-critical" : rec.priority === "risk" ? "bg-score-risk" : rec.priority === "warning" ? "bg-score-warning" : "bg-score-strong"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed">{rec.text}</p>
                  {rec.impact && <p className="text-[10px] text-muted-foreground mt-1">Impact: {rec.impact}</p>}
                </div>
                <SeverityBadge level={rec.priority === "critical" ? "critical" : rec.priority === "risk" ? "risk" : rec.priority === "warning" ? "warning" : "strong"} label={rec.priority} />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
