import AppLayout from "@/components/layout/AppLayout";
import { ScoreCard, SeverityBadge } from "@/components/ScoreCard";
import { motion } from "@/lib/motion-stub";
import { Layers, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Layout, Minus } from "lucide-react";
import { useAnalysis } from "@/context/AnalysisContext";
import { AnalysisRequiredState } from "@/components/AnalysisRequiredState";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export default function ResumeStructure() {
  const { analysis } = useAnalysis();
  if (!analysis) return (
    <AppLayout title="Structure">
      <AnalysisRequiredState
        pageTitle="Structure Analysis"
        description="Upload your resume to see section ordering, layout balance, page count assessment, and visual hierarchy analysis."
      />
    </AppLayout>
  );

  const s = analysis.structure_analysis;
  const score = analysis.scores.structure;
  const layout = s.layout_assessment;

  return (
    <AppLayout title="Resume Structure">
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <motion.div {...fade(0)} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Resume Structure</h2>
            <p className="text-sm text-muted-foreground mt-1">Section-by-section health, layout analysis, and strategic positioning.</p>
          </div>
          <ScoreCard title="Structure" score={score.score} icon={<Layers className="h-4 w-4" />} compact />
        </motion.div>

        {/* Layout Assessment */}
        {layout && (
          <motion.div {...fade(1)} className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Layout className="h-4 w-4 text-primary" /> Layout Assessment
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <div className="text-lg font-bold tabular-nums">{layout.page_count}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pages</div>
                {layout.page_count !== layout.ideal_page_count && (
                  <div className="text-[10px] score-warning">Ideal: {layout.ideal_page_count}</div>
                )}
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <SeverityBadge level={layout.white_space === "balanced" ? "excellent" : "warning"} label={layout.white_space} />
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">White Space</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <SeverityBadge level={layout.visual_hierarchy === "clear" ? "excellent" : layout.visual_hierarchy === "moderate" ? "warning" : "critical"} label={layout.visual_hierarchy} />
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Hierarchy</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <SeverityBadge level={layout.section_balance === "balanced" ? "excellent" : "warning"} label={layout.section_balance} />
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Balance</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-sm font-semibold">{s.seniority_signal}</p>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Seniority</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Section-by-Section */}
        {s.sections?.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Section Health ({s.sections.length} sections)</h3>
            {s.sections.map((sec, i) => (
              <motion.div key={i} {...fade(i + 2)} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    {sec.status === "excellent" || sec.status === "strong" ? (
                      <CheckCircle2 className="h-4 w-4 text-score-excellent shrink-0" />
                    ) : sec.status === "critical" ? (
                      <XCircle className="h-4 w-4 text-score-critical shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-score-warning shrink-0" />
                    )}
                    <h3 className="font-semibold text-sm">{sec.name}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    {sec.word_count && <span className="text-xs text-muted-foreground">{sec.word_count} words</span>}
                    {sec.position && sec.recommended_position && sec.position !== sec.recommended_position && (
                      <span className="text-xs text-score-warning flex items-center gap-1">
                        #{sec.position} <ArrowRight className="h-3 w-3" /> #{sec.recommended_position}
                      </span>
                    )}
                    <span className="text-sm font-bold tabular-nums">{sec.score}</span>
                    <SeverityBadge level={sec.status} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground ml-7">{sec.notes}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Missing & Unnecessary Sections */}
        {((s.missing_sections && s.missing_sections.length > 0) || (s.unnecessary_sections && s.unnecessary_sections.length > 0)) && (
          <motion.div {...fade(12)} className="grid sm:grid-cols-2 gap-6">
            {s.missing_sections && s.missing_sections.length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-score-risk" /> Missing Sections
                </h3>
                <div className="space-y-2">
                  {s.missing_sections.map((sec, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Minus className="h-3.5 w-3.5 text-score-risk shrink-0" />
                      <span className="text-muted-foreground">{sec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {s.unnecessary_sections && s.unnecessary_sections.length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-score-warning" /> Consider Removing
                </h3>
                <div className="space-y-2">
                  {s.unnecessary_sections.map((sec, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Minus className="h-3.5 w-3.5 text-score-warning shrink-0" />
                      <span className="text-muted-foreground">{sec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Section Order Issues */}
        {s.section_order_issues && s.section_order_issues.length > 0 && (
          <motion.div {...fade(13)} className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold text-sm mb-4">Section Order Issues</h3>
            <div className="space-y-2">
              {s.section_order_issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-secondary/40">
                  <AlertTriangle className="h-3.5 w-3.5 text-score-warning mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{issue}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Seniority Signal (if no layout) */}
        {!layout && s.seniority_signal && (
          <motion.div {...fade(14)} className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold text-sm mb-4">Seniority Signal Detection</h3>
            <div className="grid sm:grid-cols-4 gap-4">
              {["Junior", "Mid-Level", "Senior", "Lead / Principal"].map((level) => (
                <div key={level} className={`p-4 rounded-lg text-center border ${
                  s.seniority_signal?.toLowerCase().includes(level.toLowerCase().split(" ")[0]) ? "border-accent bg-accent/5" : "bg-secondary/50"
                }`}>
                  <p className="text-sm font-semibold">{level}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {s.seniority_signal?.toLowerCase().includes(level.toLowerCase().split(" ")[0]) ? "Detected" : "Not signaled"}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
