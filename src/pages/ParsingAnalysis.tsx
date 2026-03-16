import AppLayout from "@/components/layout/AppLayout";
import { SeverityBadge } from "@/components/ScoreCard";
import { motion } from "@/lib/motion-stub";
import { FileSearch, CheckCircle2, AlertTriangle, XCircle, Calendar, Layers } from "lucide-react";
import { useAnalysis } from "@/context/AnalysisContext";
import { AnalysisRequiredState } from "@/components/AnalysisRequiredState";
import { ScoreRing, SectionNav, AnalysisSection, InlineTip, CheckSummaryBar } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

const statusIcon = (s: string) => {
  if (s === "clean") return <CheckCircle2 className="h-4 w-4 text-score-excellent" />;
  if (s === "failed") return <XCircle className="h-4 w-4 text-score-critical" />;
  return <AlertTriangle className="h-4 w-4 text-score-warning" />;
};

const statusLevel = (s: string) => {
  if (s === "clean") return "excellent" as const;
  if (s === "failed") return "critical" as const;
  return "warning" as const;
};

const statusLabel = (s: string) => {
  if (s === "clean") return "Clean";
  if (s === "failed") return "Failed";
  if (s === "ambiguous") return "Ambiguous";
  return "Partial";
};

export default function ParsingAnalysis() {
  const { analysis } = useAnalysis();
  if (!analysis) return (
    <AppLayout title="Parsing Check">
      <AnalysisRequiredState
        pageTitle="Parsing Analysis"
        description="Upload your resume to see how accurately ATS systems extract your contact info, dates, skills, and sections."
        icon={<FileSearch className="h-7 w-7 text-primary" />}
      />
    </AppLayout>
  );

  const pa = analysis.parsing_analysis;
  const fields = pa?.fields || [];
  const score = analysis.scores.parsing;
  const dateConsistency = pa?.date_consistency;
  const sectionDetection = pa?.section_detection;

  const cleanCount = fields.filter(f => f.status === "clean").length;
  const failedCount = fields.filter(f => f.status === "failed").length;
  const ambiguousCount = fields.length - cleanCount - failedCount;

  const sections = [
    { id: "pa-fields", label: "Extraction", count: fields.length },
    ...(dateConsistency ? [{ id: "pa-dates", label: "Date Format" }] : []),
    ...(sectionDetection?.length ? [{ id: "pa-sections", label: "Section Detection" }] : []),
    ...(fields.filter(f => f.note).length ? [{ id: "pa-risks", label: "Risks" }] : []),
  ];

  return (
    <AppLayout title="Parsing Analysis">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2 pb-3 bg-background/80 backdrop-blur-lg border-b border-border/50 mb-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <ScoreRing score={score.score} size={52} strokeWidth={5} />
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight">Parsing Quality</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">How accurately systems extract your resume data</p>
              </div>
            </div>
            {pa?.overall_extractability && (
              <SeverityBadge level={pa.overall_extractability === "Excellent" ? "excellent" : pa.overall_extractability === "Good" ? "strong" : pa.overall_extractability === "Fair" ? "warning" : "critical"} label={pa.overall_extractability} />
            )}
          </div>
          <SectionNav sections={sections} />
        </div>

        {/* Field Extraction */}
        {fields.length > 0 && (
          <div id="pa-fields" className="scroll-mt-36 space-y-3">
            <CheckSummaryBar passed={cleanCount} warned={ambiguousCount} failed={failedCount} />
            <InlineTip>This shows exactly what an ATS sees when it reads your resume. Fields marked "Failed" may cause data loss.</InlineTip>

            <AnalysisSection id="pa-fields-list" title="Extraction Preview" subtitle="How ATS and HR systems see your resume" icon={<FileSearch className="h-4 w-4" />}>
              <div className="divide-y">
                {fields.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 sm:gap-4 px-3 sm:px-5 py-2.5 sm:py-3 hover:bg-secondary/30 transition-colors">
                    {statusIcon(f.status)}
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground w-20 sm:w-28 shrink-0">{f.field}</span>
                    <span className="text-xs sm:text-sm flex-1 min-w-0 truncate">{f.extracted}</span>
                    {f.confidence !== undefined && (
                      <span className="text-xs tabular-nums text-muted-foreground hidden sm:inline">{f.confidence}%</span>
                    )}
                    <SeverityBadge level={statusLevel(f.status)} label={statusLabel(f.status)} />
                  </div>
                ))}
              </div>
            </AnalysisSection>
          </div>
        )}

        {/* Date Consistency */}
        {dateConsistency && (
          <AnalysisSection id="pa-dates" title="Date Format Consistency" subtitle={`Format: ${dateConsistency.format_used}`} icon={<Calendar className="h-4 w-4" />}
            badge={<SeverityBadge level={dateConsistency.consistent ? "excellent" : "warning"} label={dateConsistency.consistent ? "Consistent" : "Inconsistent"} />}
          >
            <div className="p-4 sm:p-5">
              {dateConsistency.issues?.length > 0 ? (
                <div className="space-y-2">
                  {dateConsistency.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs sm:text-sm p-2.5 rounded-lg bg-secondary/30">
                      <AlertTriangle className="h-3.5 w-3.5 text-score-warning mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{issue}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">All dates use a consistent format. ✓</p>
              )}
            </div>
          </AnalysisSection>
        )}

        {/* Section Detection */}
        {sectionDetection && sectionDetection.length > 0 && (
          <AnalysisSection id="pa-sections" title="Section Detection" subtitle={`${sectionDetection.filter(s => s.detected).length}/${sectionDetection.length} detected`} icon={<Layers className="h-4 w-4" />}>
            <div className="divide-y">
              {sectionDetection.map((s, i) => (
                <div key={i} className="flex items-center gap-2.5 sm:gap-4 px-3 sm:px-5 py-2.5 sm:py-3">
                  {s.detected ? <CheckCircle2 className="h-4 w-4 text-score-excellent shrink-0" /> : <XCircle className="h-4 w-4 text-score-critical shrink-0" />}
                  <span className="text-xs sm:text-sm font-medium w-24 sm:w-32 shrink-0">{s.section}</span>
                  <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">
                    {s.detected ? `"${s.header_text}"` : "Not detected"}
                  </span>
                  {s.detected && s.header_text !== s.standard_header && (
                    <span className="text-[10px] sm:text-xs score-warning hidden sm:inline">Recommend: "{s.standard_header}"</span>
                  )}
                </div>
              ))}
            </div>
          </AnalysisSection>
        )}

        {/* Parsing Risks */}
        {fields.filter(f => f.note).length > 0 && (
          <AnalysisSection id="pa-risks" title="Parsing Risks" subtitle={`${fields.filter(f => f.note).length} potential issues`} icon={<AlertTriangle className="h-4 w-4" />}>
            <div className="p-4 sm:p-5 space-y-2 sm:space-y-3">
              {fields.filter(f => f.note).map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 sm:p-3 rounded-lg bg-secondary/30">
                  <AlertTriangle className="h-3.5 w-3.5 text-score-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium">{f.field}</p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{f.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnalysisSection>
        )}
      </div>
    </AppLayout>
  );
}
