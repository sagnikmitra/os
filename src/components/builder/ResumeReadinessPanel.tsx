import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ResumeAuditResult } from "@/lib/resume-audit";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  CircleDot,
  Eye,
  FileSearch,
  Gauge,
  Layers,
  Loader2,
  Sparkles,
  ShieldCheck,
  Type,
  XCircle,
} from "lucide-react";

export type AnalysisFixFocus = "all" | "ats" | "parsing" | "content" | "recruiter" | "structure" | "ai-detection";

export interface AnalysisFixDimension {
  key: Exclude<AnalysisFixFocus, "all">;
  label: string;
  score?: number;
  helper: string;
}

interface Props {
  audit: ResumeAuditResult;
  analysisAtsScore?: number;
  analysisParsingScore?: number;
  analysisFixDimensions?: AnalysisFixDimension[];
  hasAnalysisFixes?: boolean;
  applyingFixes?: boolean;
  applyingFixArea?: AnalysisFixFocus | null;
  onApplyAnalysisFixes?: (focusArea?: AnalysisFixFocus) => void;
}

function statusIcon(status: "pass" | "warn" | "fail") {
  if (status === "pass") return <CheckCircle2 className="h-3.5 w-3.5 text-score-excellent shrink-0" />;
  if (status === "warn") return <AlertTriangle className="h-3.5 w-3.5 text-score-warning shrink-0" />;
  return <XCircle className="h-3.5 w-3.5 text-score-critical shrink-0" />;
}

export function ResumeReadinessPanel({
  audit,
  analysisAtsScore,
  analysisParsingScore,
  analysisFixDimensions = [],
  hasAnalysisFixes,
  applyingFixes,
  applyingFixArea,
  onApplyAnalysisFixes,
}: Props) {
  const passCount = audit.checks.filter((check) => check.status === "pass").length;
  const warnCount = audit.checks.filter((check) => check.status === "warn").length;
  const failCount = audit.checks.filter((check) => check.status === "fail").length;
  const hasSyncedReadiness =
    typeof analysisAtsScore === "number" && typeof analysisParsingScore === "number";
  const syncedReadinessScore = hasSyncedReadiness
    ? Math.round((analysisAtsScore + analysisParsingScore) / 2)
    : null;
  const headlineScore = syncedReadinessScore ?? audit.score;
  const scoreTone =
    headlineScore >= 80
      ? "text-score-excellent"
      : headlineScore >= 60
      ? "text-score-warning"
      : "text-score-critical";

  const templateTone =
    audit.templateMeta.parseRisk === "low"
      ? "bg-score-excellent/10 text-score-excellent border-score-excellent/25"
      : audit.templateMeta.parseRisk === "medium"
      ? "bg-score-warning/10 text-score-warning border-score-warning/25"
      : "bg-score-critical/10 text-score-critical border-score-critical/25";

  const fixIcon = (key: AnalysisFixDimension["key"]) => {
    if (key === "ats") return <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />;
    if (key === "parsing") return <FileSearch className="h-3.5 w-3.5 text-muted-foreground" />;
    if (key === "content") return <Type className="h-3.5 w-3.5 text-muted-foreground" />;
    if (key === "recruiter") return <Eye className="h-3.5 w-3.5 text-muted-foreground" />;
    if (key === "structure") return <Layers className="h-3.5 w-3.5 text-muted-foreground" />;
    return <Bot className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const scoreToneClass = (score?: number) => {
    if (typeof score !== "number") return "border-border text-muted-foreground";
    if (score >= 80) return "border-score-excellent/25 text-score-excellent";
    if (score >= 60) return "border-score-warning/25 text-score-warning";
    return "border-score-critical/25 text-score-critical";
  };

  const metricToneClass = (score?: number) => {
    if (typeof score !== "number") return "border-border/70 bg-background text-muted-foreground";
    if (score >= 80) return "border-score-excellent/20 bg-score-excellent/5 text-score-excellent";
    if (score >= 60) return "border-score-warning/20 bg-score-warning/5 text-score-warning";
    return "border-score-critical/20 bg-score-critical/5 text-score-critical";
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold">
              {hasSyncedReadiness ? "ATS + Parsing Readiness" : "Builder Readiness"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {hasSyncedReadiness
                ? "Average of latest ATS and parsing analysis scores."
                : "Live editor checks for quality, parsing, and structure."}
            </p>
          </div>
          <div className="text-right">
            <p className={cn("text-2xl font-bold tabular-nums leading-none", scoreTone)}>{headlineScore}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">/100</p>
          </div>
        </div>

        {hasSyncedReadiness ? (
          <>
            <div className="grid grid-cols-3 gap-1.5">
              <div className={cn("rounded-md border px-2 py-1.5 text-center", metricToneClass(analysisAtsScore))}>
                <p className="text-[10px] text-muted-foreground">ATS</p>
                <p className="text-xs font-semibold tabular-nums">{analysisAtsScore}</p>
              </div>
              <div className={cn("rounded-md border px-2 py-1.5 text-center", metricToneClass(analysisParsingScore))}>
                <p className="text-[10px] text-muted-foreground">Parsing</p>
                <p className="text-xs font-semibold tabular-nums">{analysisParsingScore}</p>
              </div>
              <div className={cn("rounded-md border px-2 py-1.5 text-center", metricToneClass(audit.score))}>
                <p className="text-[10px] text-muted-foreground">Builder</p>
                <p className="text-xs font-semibold tabular-nums">{audit.score}</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Builder score updates live while editing. ATS/Parsing update when a full analysis run is available.
            </p>
          </>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            <div className="rounded-md border border-score-excellent/20 bg-score-excellent/5 px-2 py-1.5 text-center">
              <p className="text-[10px] text-muted-foreground">Pass</p>
              <p className="text-xs font-semibold tabular-nums text-score-excellent">{passCount}</p>
            </div>
            <div className="rounded-md border border-score-warning/20 bg-score-warning/5 px-2 py-1.5 text-center">
              <p className="text-[10px] text-muted-foreground">Warn</p>
              <p className="text-xs font-semibold tabular-nums text-score-warning">{warnCount}</p>
            </div>
            <div className="rounded-md border border-score-critical/20 bg-score-critical/5 px-2 py-1.5 text-center">
              <p className="text-[10px] text-muted-foreground">Fail</p>
              <p className="text-xs font-semibold tabular-nums text-score-critical">{failCount}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">Impact {audit.quantifiedPct}%</Badge>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">Action verbs {audit.actionVerbPct}%</Badge>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">Est. {audit.estimatedPages.toFixed(1)} pages</Badge>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">{audit.estimatedWordCount} words</Badge>
        </div>

        <div className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold", templateTone)}>
          <ShieldCheck className="h-3 w-3" />
          Template risk: {audit.templateMeta.parseRisk}
        </div>
      </div>

      {audit.blockers.length > 0 && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 space-y-2">
          <p className="text-[11px] font-semibold text-destructive">Must-fix before final export</p>
          {audit.blockers.slice(0, 3).map((blocker) => (
            <div key={blocker} className="flex items-start gap-1.5 text-[10px] text-destructive/90 leading-relaxed">
              <CircleDot className="h-3 w-3 shrink-0 mt-0.5" />
              <span>{blocker}</span>
            </div>
          ))}
        </div>
      )}

      {analysisFixDimensions.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-3 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold">Analysis Fix Center</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Apply focused fixes for each area, or run all in one pass.
              </p>
            </div>
            {hasAnalysisFixes && onApplyAnalysisFixes && (
              <Button
                onClick={() => onApplyAnalysisFixes("all")}
                disabled={applyingFixes}
                variant="outline"
                size="sm"
                className="h-7 text-[10px] gap-1.5 shrink-0"
              >
                {applyingFixes && (applyingFixArea === "all" || !applyingFixArea) ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {applyingFixes && (applyingFixArea === "all" || !applyingFixArea) ? "Applying..." : "Apply all"}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {analysisFixDimensions.map((item) => {
              const applyingThis = applyingFixes && applyingFixArea === item.key;
              return (
                <div key={item.key} className="rounded-md border border-border/60 bg-background/70 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {fixIcon(item.key)}
                      <p className="text-[11px] font-medium truncate">{item.label}</p>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-semibold tabular-nums rounded-full border px-2 py-0.5 shrink-0",
                        scoreToneClass(item.score),
                      )}
                    >
                      {typeof item.score === "number" ? item.score : "--"}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{item.helper}</p>
                  {hasAnalysisFixes && onApplyAnalysisFixes && (
                    <Button
                      onClick={() => onApplyAnalysisFixes(item.key)}
                      disabled={applyingFixes}
                      variant="ghost"
                      size="sm"
                      className="h-7 mt-1.5 px-2.5 text-[10px] gap-1.5 text-primary"
                    >
                      {applyingThis ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      {applyingThis ? "Applying..." : "Apply fix"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-card p-3 space-y-2.5">
        <div className="flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[11px] font-semibold">Audit Checklist</p>
        </div>
        <Separator />
        <div className="space-y-2">
          {audit.checks.map((check) => (
            <div key={check.id} className="rounded-md border border-border/50 bg-background/70 p-2">
              <div className="flex items-start gap-2">
                {statusIcon(check.status)}
                <div className="min-w-0">
                  <p className="text-[11px] font-medium leading-tight">{check.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{check.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
