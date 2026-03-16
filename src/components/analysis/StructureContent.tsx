import { ScoreCard, SeverityBadge } from "@/components/ScoreCard";
import { motion } from "@/lib/motion-stub";
import {
  Layers, CheckCircle2, AlertTriangle, XCircle, Layout, Minus, ArrowUpDown,
  GitCompare, Search, ArrowRight, PenTool,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/AnalysisContext";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

function ProgressBar({ value, max = 100, color = "bg-primary" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StructureContent() {
  const { analysis } = useAnalysis();
  if (!analysis) return null;

  const s = analysis.structure_analysis;
  const score = analysis.scores.structure;
  const layout = s.layout_assessment;
  const mece = s.mece_assessment;
  const consistency = analysis.consistency_audit;

  const excellentSections = s.sections?.filter(sec => sec.status === "excellent" || sec.status === "strong").length || 0;
  const warningSections = s.sections?.filter(sec => sec.status === "warning").length || 0;
  const criticalSections = s.sections?.filter(sec => sec.status === "critical").length || 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div {...fade(0)} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">Resume Structure</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Section-by-section health, layout analysis, and information architecture.</p>
        </div>
        <div className="flex items-center gap-2">
          <ScoreCard title="Structure" score={score.score} icon={<Layers className="h-4 w-4" />} compact />
          <Link to="/builder"><Button variant="outline" size="sm" className="gap-1.5 text-xs"><PenTool className="h-3 w-3" /> Edit</Button></Link>
        </div>
      </motion.div>

      {/* Layout assessment cards */}
      {layout && (
        <motion.div {...fade(1)} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="rounded-xl border bg-card p-4 text-center">
            <div className="text-2xl font-bold tabular-nums">{layout.page_count}</div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Pages</p>
            {layout.page_count !== layout.ideal_page_count && (
              <p className="text-[10px] text-score-warning font-medium">Ideal: {layout.ideal_page_count}</p>
            )}
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <SeverityBadge level={layout.white_space === "balanced" ? "excellent" : "warning"} label={layout.white_space} />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">White Space</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <SeverityBadge level={layout.visual_hierarchy?.toLowerCase().includes("clear") ? "excellent" : layout.visual_hierarchy?.toLowerCase().includes("moderate") ? "warning" : "critical"} label={layout.visual_hierarchy} />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">Hierarchy</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <SeverityBadge level={layout.section_balance === "balanced" ? "excellent" : "warning"} label={layout.section_balance} />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">Balance</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-sm font-bold">{s.seniority_signal}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Seniority</p>
          </div>
        </motion.div>
      )}

      {/* Section health summary bar */}
      {s.sections?.length > 0 && (
        <motion.div {...fade(1.5)} className="rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Section Health Overview</h3>
            <span className="text-xs text-muted-foreground">{s.sections.length} sections</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden flex">
              {excellentSections > 0 && <div className="h-full bg-score-excellent" style={{ width: `${(excellentSections / s.sections.length) * 100}%` }} />}
              {warningSections > 0 && <div className="h-full bg-score-warning" style={{ width: `${(warningSections / s.sections.length) * 100}%` }} />}
              {criticalSections > 0 && <div className="h-full bg-score-critical" style={{ width: `${(criticalSections / s.sections.length) * 100}%` }} />}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-score-excellent" /> {excellentSections} Strong</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-score-warning" /> {warningSections} Warning</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-score-critical" /> {criticalSections} Critical</span>
          </div>
        </motion.div>
      )}

      {/* Section cards */}
      {s.sections?.length > 0 && (
        <div className="space-y-3">
          {s.sections.map((sec, i) => {
            const barColor = sec.status === "excellent" || sec.status === "strong" ? "bg-score-excellent" : sec.status === "warning" ? "bg-score-warning" : "bg-score-critical";
            return (
              <motion.div key={i} {...fade(i + 2)} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {sec.status === "excellent" || sec.status === "strong" ? (
                      <CheckCircle2 className="h-4 w-4 text-score-excellent shrink-0" />
                    ) : sec.status === "critical" ? (
                      <XCircle className="h-4 w-4 text-score-critical shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-score-warning shrink-0" />
                    )}
                    <h3 className="font-semibold text-xs sm:text-sm truncate">{sec.name}</h3>
                    {sec.position !== undefined && sec.recommended_position !== undefined && sec.position !== sec.recommended_position && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-score-warning/10 text-score-warning shrink-0">
                        Position: {sec.position} → {sec.recommended_position}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {sec.word_count && <span className="text-[10px] text-muted-foreground hidden sm:inline">{sec.word_count} words</span>}
                    <span className="text-sm font-bold tabular-nums">{sec.score}</span>
                    <SeverityBadge level={sec.status} />
                  </div>
                </div>
                <ProgressBar value={sec.score} color={barColor} />
                <p className="text-[11px] text-muted-foreground mt-2 ml-7">{sec.notes}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* MECE Assessment */}
      {mece && (
        <motion.div {...fade(12)} className="rounded-xl border bg-card p-4 sm:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-primary" /> MECE Assessment
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className={cn("p-3 rounded-lg text-center border",
              mece.mutually_exclusive ? "bg-score-excellent/5 border-score-excellent/15" : "bg-score-warning/5 border-score-warning/15"
            )}>
              {mece.mutually_exclusive
                ? <CheckCircle2 className="h-5 w-5 text-score-excellent mx-auto mb-1" />
                : <XCircle className="h-5 w-5 text-score-warning mx-auto mb-1" />
              }
              <p className="text-xs font-semibold">Mutually Exclusive</p>
              <p className="text-[10px] text-muted-foreground">{mece.mutually_exclusive ? "No overlap" : "Content overlaps"}</p>
            </div>
            <div className={cn("p-3 rounded-lg text-center border",
              mece.collectively_exhaustive ? "bg-score-excellent/5 border-score-excellent/15" : "bg-score-warning/5 border-score-warning/15"
            )}>
              {mece.collectively_exhaustive
                ? <CheckCircle2 className="h-5 w-5 text-score-excellent mx-auto mb-1" />
                : <XCircle className="h-5 w-5 text-score-warning mx-auto mb-1" />
              }
              <p className="text-xs font-semibold">Collectively Exhaustive</p>
              <p className="text-[10px] text-muted-foreground">{mece.collectively_exhaustive ? "All areas covered" : "Gaps found"}</p>
            </div>
          </div>
          {mece.overlapping_sections?.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Overlapping Sections</p>
              <div className="flex flex-wrap gap-1.5">
                {mece.overlapping_sections.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs bg-score-warning/10 text-score-warning border border-score-warning/20">{s}</span>
                ))}
              </div>
            </div>
          )}
          {mece.missing_coverage?.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Missing Coverage</p>
              <div className="flex flex-wrap gap-1.5">
                {mece.missing_coverage.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs bg-score-critical/10 text-score-critical border border-score-critical/20">{s}</span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Missing + Unnecessary */}
      {((s.missing_sections?.length ?? 0) > 0 || (s.unnecessary_sections?.length ?? 0) > 0) && (
        <motion.div {...fade(13)} className="grid sm:grid-cols-2 gap-4">
          {s.missing_sections && s.missing_sections.length > 0 && (
            <div className="rounded-xl border bg-card p-4 sm:p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-score-risk" /> Missing Sections ({s.missing_sections.length})
              </h3>
              <div className="space-y-2">
                {s.missing_sections.map((sec, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-score-risk/5 border border-score-risk/10">
                    <Minus className="h-3.5 w-3.5 text-score-risk shrink-0" />
                    <span>{sec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {s.unnecessary_sections && s.unnecessary_sections.length > 0 && (
            <div className="rounded-xl border bg-card p-4 sm:p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-score-warning" /> Consider Removing ({s.unnecessary_sections.length})
              </h3>
              <div className="space-y-2">
                {s.unnecessary_sections.map((sec, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-score-warning/5 border border-score-warning/10">
                    <Minus className="h-3.5 w-3.5 text-score-warning shrink-0" />
                    <span>{sec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Section order issues */}
      {s.section_order_issues && s.section_order_issues.length > 0 && (
        <motion.div {...fade(14)} className="rounded-xl border bg-card p-4 sm:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-score-warning" /> Section Order Issues
          </h3>
          <div className="space-y-2">
            {s.section_order_issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-xs p-2.5 rounded-lg bg-score-warning/5 border border-score-warning/10">
                <AlertTriangle className="h-3.5 w-3.5 text-score-warning mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{issue}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Consistency Audit */}
      {consistency && (
        <motion.div {...fade(15)} className="rounded-xl border bg-card p-4 sm:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" /> Consistency Audit
            <span className="ml-auto text-sm font-bold tabular-nums">{consistency.overall_consistency_score}/100</span>
          </h3>

          {consistency.contradictions?.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                Contradictions ({consistency.contradictions.length})
              </p>
              <div className="space-y-2">
                {consistency.contradictions.slice(0, 4).map((c, i) => (
                  <div key={i} className="p-3 rounded-lg bg-score-risk/5 border border-score-risk/10">
                    <div className="flex items-start gap-2 text-xs mb-1">
                      <XCircle className="h-3.5 w-3.5 text-score-risk mt-0.5 shrink-0" />
                      <span>"{c.claim_a}" <span className="text-muted-foreground">({c.location_a})</span></span>
                    </div>
                    <div className="flex items-start gap-2 text-xs ml-5 mb-1">
                      <span className="text-muted-foreground">vs</span>
                      <span>"{c.claim_b}" <span className="text-muted-foreground">({c.location_b})</span></span>
                    </div>
                    {c.resolution && (
                      <p className="text-[11px] text-primary ml-5 mt-1">→ {c.resolution}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {consistency.timeline_issues?.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                Timeline Issues ({consistency.timeline_issues.length})
              </p>
              {consistency.timeline_issues.map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2.5 rounded-lg bg-score-warning/5 border border-score-warning/10 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-score-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{t.issue}</p>
                    <p className="text-muted-foreground mt-0.5">{t.details}</p>
                    {t.fix && <p className="text-primary mt-0.5">→ {t.fix}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {consistency.tone_shifts?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                Tone Shifts ({consistency.tone_shifts.length})
              </p>
              {consistency.tone_shifts.map((ts, i) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2.5 rounded-lg bg-secondary/40 mb-2">
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{ts.section_a} ↔ {ts.section_b}: {ts.description}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
