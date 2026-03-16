import { ScoreCard, SeverityBadge } from "@/components/ScoreCard";
import { motion } from "@/lib/motion-stub";
import { FileSearch, CheckCircle2, AlertTriangle, XCircle, Calendar, Layers, ShieldCheck, Database } from "lucide-react";
import { useAnalysis } from "@/context/AnalysisContext";
import { cn } from "@/lib/utils";

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

function ConfidenceBar({ value }: { value?: number }) {
  if (value === undefined) return null;
  const col = value >= 80 ? "bg-score-excellent" : value >= 60 ? "bg-score-warning" : "bg-score-critical";
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="h-1 w-12 rounded-full bg-secondary overflow-hidden">
        <div className={cn("h-full rounded-full", col)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground">{value}%</span>
    </div>
  );
}

export function ParsingContent() {
  const { analysis } = useAnalysis();
  if (!analysis) return null;

  const pa = analysis.parsing_analysis;
  const fields = pa?.fields || [];
  const score = analysis.scores.parsing;
  const dateConsistency = pa?.date_consistency;
  const sectionDetection = pa?.section_detection;

  const cleanFields = fields.filter(f => f.status === "clean").length;
  const problemFields = fields.filter(f => f.status !== "clean");
  const detectedSections = sectionDetection?.filter(s => s.detected).length || 0;
  const totalSections = sectionDetection?.length || 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div {...fade(0)} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">Parsing Quality</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">How accurately systems extract your resume data.</p>
        </div>
        <ScoreCard title="Parsing Score" score={score.score} icon={<FileSearch className="h-4 w-4" />} compact />
      </motion.div>

      {/* Key metrics */}
      <motion.div {...fade(1)} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {pa?.overall_extractability && (
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center",
                pa.overall_extractability === "Excellent" || pa.overall_extractability === "Good" ? "bg-score-excellent/10" : "bg-score-warning/10"
              )}>
                <ShieldCheck className={cn("h-5 w-5",
                  pa.overall_extractability === "Excellent" || pa.overall_extractability === "Good" ? "text-score-excellent" : "text-score-warning"
                )} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Extractability</p>
                <p className="text-sm font-bold">{pa.overall_extractability}</p>
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
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Clean Fields</p>
              <p className="text-sm font-bold">{cleanFields}/{fields.length}</p>
            </div>
          </div>
        </div>
        {problemFields.length > 0 && (
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-score-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-score-warning" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Issues</p>
                <p className="text-sm font-bold">{problemFields.length} field{problemFields.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>
        )}
        {totalSections > 0 && (
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Sections Found</p>
                <p className="text-sm font-bold">{detectedSections}/{totalSections}</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Field extraction */}
      {fields.length > 0 && (
        <motion.div {...fade(2)} className="rounded-xl border bg-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Extraction Preview</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">How ATS and HR systems see your resume.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-score-excellent" /> Clean</span>
              <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-score-warning" /> Partial</span>
              <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-score-critical" /> Failed</span>
            </div>
          </div>
          <div className="divide-y">
            {fields.map((f, i) => (
              <motion.div key={i} {...fade(i + 3)} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors">
                {statusIcon(f.status)}
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-24 shrink-0">{f.field}</span>
                <span className="text-xs flex-1 min-w-0 truncate">{f.extracted || "—"}</span>
                <ConfidenceBar value={f.confidence} />
                <SeverityBadge level={statusLevel(f.status)} label={statusLabel(f.status)} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Parsing risks — problem fields with notes */}
      {problemFields.length > 0 && (
        <motion.div {...fade(14)} className="rounded-xl border bg-card p-4 sm:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-score-warning" /> Parsing Risks ({problemFields.length})
          </h3>
          <div className="space-y-2.5">
            {problemFields.map((f, i) => (
              <div key={i} className={cn("flex items-start gap-3 p-3 rounded-xl border",
                f.status === "failed" ? "bg-score-critical/5 border-score-critical/15" : "bg-score-warning/5 border-score-warning/15"
              )}>
                {statusIcon(f.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold">{f.field}</p>
                    <SeverityBadge level={statusLevel(f.status)} label={statusLabel(f.status)} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Extracted: {f.extracted || "—"}</p>
                  {f.note && <p className="text-[11px] text-muted-foreground mt-0.5 italic">{f.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Date consistency */}
      {dateConsistency && (
        <motion.div {...fade(16)} className="rounded-xl border bg-card p-4 sm:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Date Format Consistency
          </h3>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-xs">Format: <span className="font-medium">{dateConsistency.format_used}</span></span>
            <SeverityBadge level={dateConsistency.consistent ? "excellent" : "warning"} label={dateConsistency.consistent ? "Consistent" : "Inconsistent"} />
          </div>
          {dateConsistency.issues?.length > 0 && (
            <div className="space-y-2">
              {dateConsistency.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2.5 rounded-lg bg-score-warning/5 border border-score-warning/10">
                  <AlertTriangle className="h-3.5 w-3.5 text-score-warning mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{issue}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Section detection */}
      {sectionDetection && sectionDetection.length > 0 && (
        <motion.div {...fade(17)} className="rounded-xl border bg-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Section Detection
            </h3>
            <span className="text-xs text-muted-foreground">{detectedSections}/{totalSections} found</span>
          </div>
          <div className="divide-y">
            {sectionDetection.map((s, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors">
                {s.detected ? <CheckCircle2 className="h-4 w-4 text-score-excellent shrink-0" /> : <XCircle className="h-4 w-4 text-score-critical shrink-0" />}
                <span className="text-xs font-medium w-28 shrink-0">{s.section}</span>
                <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">
                  {s.detected ? `"${s.header_text}"` : "Not detected"}
                </span>
                {s.detected && s.header_text !== s.standard_header && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-score-warning/10 text-score-warning shrink-0">
                    Recommend: "{s.standard_header}"
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
