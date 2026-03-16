import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { ScoreCard, SeverityBadge } from "@/components/ScoreCard";
import { motion } from "@/lib/motion-stub";
import { Shield, CheckCircle2, XCircle, AlertTriangle, BarChart3, Hash, PenTool, Sparkles, Bot, Target as TargetIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/AnalysisContext";
import { Link } from "react-router-dom";
import { AnalysisRequiredState } from "@/components/AnalysisRequiredState";
import { ScoreRing, SectionNav, CheckSummaryBar, AnalysisSection, InlineTip, FilterChips } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

const categoryColors: Record<string, string> = {
  formatting: "bg-primary/10 text-primary",
  keywords: "bg-accent/10 text-accent",
  structure: "score-bg-strong score-strong",
  contact: "score-bg-warning score-warning",
  compatibility: "score-bg-risk score-risk",
};

export default function ATSAnalysis() {
  const { analysis } = useAnalysis();
  const [checkFilter, setCheckFilter] = useState("all");

  if (!analysis) return (
    <AppLayout title="ATS Score">
      <AnalysisRequiredState
        pageTitle="ATS Compatibility Score"
        description="Upload and analyze your resume to see how well it performs with Applicant Tracking Systems used by top companies."
        icon={<Shield className="h-7 w-7 text-primary" />}
      />
    </AppLayout>
  );

  const ats = analysis.ats_analysis;
  const score = analysis.scores.ats;
  const density = ats.keyword_density;

  const allChecks = ats.checks || [];
  const passCount = allChecks.filter(c => c.status === "pass").length;
  const warnCount = allChecks.filter(c => c.status === "warning").length;
  const failCount = allChecks.filter(c => c.status === "fail").length;

  const filteredChecks = checkFilter === "all" ? allChecks
    : checkFilter === "pass" ? allChecks.filter(c => c.status === "pass")
    : checkFilter === "fail" ? allChecks.filter(c => c.status === "fail")
    : allChecks.filter(c => c.status === "warning");

  const checksByCategory = filteredChecks.reduce((acc, c) => {
    const cat = c.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {} as Record<string, typeof ats.checks>);

  const sections = [
    { id: "ats-overview", label: "Overview" },
    { id: "ats-checks", label: "Checks", count: allChecks.length },
    ...(density ? [{ id: "ats-keywords", label: "Keywords" }] : []),
    ...(ats.matched_keywords?.length || ats.missing_keywords?.length ? [{ id: "ats-keyword-match", label: "Keyword Match" }] : []),
    ...(ats.formatting_issues?.length ? [{ id: "ats-formatting", label: "Formatting" }] : []),
    ...(ats.recommendations?.length ? [{ id: "ats-recs", label: "Recommendations" }] : []),
  ];

  return (
    <AppLayout title="ATS Compatibility">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2 pb-3 bg-background/80 backdrop-blur-lg border-b border-border/50 mb-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <ScoreRing score={score.score} size={52} strokeWidth={5} />
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight">ATS Compatibility</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">{score.summary}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/builder"><Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"><PenTool className="h-3 w-3" /> Fix</Button></Link>
              <Link to="/rewrites"><Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"><Sparkles className="h-3 w-3" /> Rewrite</Button></Link>
            </div>
          </div>
          <SectionNav sections={sections} />
        </div>

        {/* Overview */}
        <div id="ats-overview" className="scroll-mt-36">
          <motion.div {...fade(1)} className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  ats.pass_likelihood === "High" ? "score-bg-excellent" : ats.pass_likelihood === "Moderate" ? "score-bg-warning" : "score-bg-critical"
                }`}>
                  <Shield className={`h-5 w-5 ${
                    ats.pass_likelihood === "High" ? "score-excellent" : ats.pass_likelihood === "Moderate" ? "score-warning" : "score-critical"
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Pass Likelihood: {ats.pass_likelihood}</h3>
                  <p className="text-xs text-muted-foreground">{score.summary}</p>
                </div>
              </div>
            </div>
            {ats.estimated_rank_percentile && (
              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Estimated Rank: Top {ats.estimated_rank_percentile}%</h3>
                    <p className="text-xs text-muted-foreground">Predicted ATS ranking among applicants</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
          <InlineTip className="mt-4">
            ATS systems auto-reject ~75% of resumes. A score above 80 means your resume passes most screening filters.
          </InlineTip>
        </div>

        {/* Checks */}
        <div id="ats-checks" className="scroll-mt-36 space-y-4">
          <CheckSummaryBar passed={passCount} warned={warnCount} failed={failCount} />
          <FilterChips
            value={checkFilter}
            onChange={setCheckFilter}
            options={[
              { id: "all", label: "All", count: allChecks.length },
              { id: "fail", label: "Failed", count: failCount },
              { id: "warning", label: "Warnings", count: warnCount },
              { id: "pass", label: "Passed", count: passCount },
            ]}
          />

          {Object.entries(checksByCategory).map(([cat, checks], ci) => (
            <AnalysisSection
              key={cat}
              id={`ats-check-${cat}`}
              title={cat.charAt(0).toUpperCase() + cat.slice(1)}
              subtitle={`${checks.filter(c => c.status === "pass").length}/${checks.length} passed`}
              icon={<span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-bold ${categoryColors[cat] || "bg-secondary text-secondary-foreground"}`}>{cat}</span>}
              badge={<span className="text-xs text-muted-foreground tabular-nums">{checks.filter(c => c.status === "pass").length}/{checks.length}</span>}
            >
              <div className="divide-y">
                {checks.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 hover:bg-secondary/30 transition-colors">
                    {c.status === "pass" ? <CheckCircle2 className="h-4 w-4 text-score-excellent mt-0.5 shrink-0" /> :
                     c.status === "fail" ? <XCircle className="h-4 w-4 text-score-critical mt-0.5 shrink-0" /> :
                     <AlertTriangle className="h-4 w-4 text-score-warning mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{c.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{c.detail}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <SeverityBadge level={c.status === "pass" ? "excellent" : c.status === "fail" ? "critical" : "warning"} />
                      {c.status !== "pass" && (
                        <Link to="/builder">
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1">
                            <PenTool className="h-3 w-3" /> Fix
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AnalysisSection>
          ))}

          {filteredChecks.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No checks match this filter.
            </div>
          )}
        </div>

        {/* Keyword Density */}
        {density && (
          <AnalysisSection
            id="ats-keywords"
            title="Keyword Density Analysis"
            subtitle={`${density.total_keywords} total · ${density.unique_keywords} unique · ${density.industry_coverage} industry coverage`}
            icon={<Hash className="h-4 w-4" />}
          >
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Total Keywords", value: density.total_keywords },
                  { label: "Unique", value: density.unique_keywords },
                  { label: "Industry Coverage", value: density.industry_coverage, span: 2 },
                ].map((stat) => (
                  <div key={stat.label} className={`text-center p-3 rounded-lg bg-secondary/50 ${stat.span ? "col-span-2" : ""}`}>
                    <div className="text-xl font-bold tabular-nums">{stat.value}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
              {density.top_repeated?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Most Repeated</p>
                  <div className="flex flex-wrap gap-2">
                    {density.top_repeated.map((kw) => (
                      <span key={kw.keyword} className="px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {kw.keyword} <span className="text-muted-foreground ml-1">×{kw.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AnalysisSection>
        )}

        {/* Keywords Match */}
        <div id="ats-keyword-match" className="scroll-mt-36 grid sm:grid-cols-2 gap-4">
          {ats.matched_keywords?.length > 0 && (
            <motion.div {...fade(15)} className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-score-excellent" /> Recognized ({ats.matched_keywords.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {ats.matched_keywords.map((kw) => (
                  <span key={kw} className="px-2 py-0.5 rounded-md text-xs font-medium score-bg-excellent score-excellent">{kw}</span>
                ))}
              </div>
            </motion.div>
          )}
          {ats.missing_keywords?.length > 0 && (
            <motion.div {...fade(16)} className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-score-warning" /> Missing ({ats.missing_keywords.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {ats.missing_keywords.map((kw) => (
                  <span key={kw} className="px-2 py-0.5 rounded-md text-xs font-medium score-bg-warning score-warning">{kw}</span>
                ))}
              </div>
              <InlineTip className="mt-3">Add these keywords naturally into your experience bullets to improve ATS matching.</InlineTip>
            </motion.div>
          )}
        </div>

        {/* Formatting Issues */}
        {ats.formatting_issues && ats.formatting_issues.length > 0 && (
          <AnalysisSection
            id="ats-formatting"
            title="Formatting Issues"
            subtitle={`${ats.formatting_issues.length} issues found`}
            icon={<AlertTriangle className="h-4 w-4" />}
            badge={<SeverityBadge level="risk" label={`${ats.formatting_issues.length} issues`} />}
          >
            <div className="p-4 sm:p-5 space-y-2">
              {ats.formatting_issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-secondary/30">
                  <XCircle className="h-3.5 w-3.5 text-score-risk mt-0.5 shrink-0" />
                  <span className="text-muted-foreground flex-1">{issue}</span>
                  <Link to="/builder">
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 shrink-0">
                      <PenTool className="h-3 w-3" /> Fix
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </AnalysisSection>
        )}

        {/* Recommendations */}
        {ats.recommendations?.length > 0 && (
          <AnalysisSection
            id="ats-recs"
            title="ATS-Safe Recommendations"
            subtitle={`${ats.recommendations.length} recommendations`}
            icon={<Sparkles className="h-4 w-4" />}
          >
            <div className="p-4 sm:p-5 space-y-3">
              {ats.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    rec.priority === "critical" ? "bg-score-critical" : rec.priority === "risk" ? "bg-score-risk" : rec.priority === "warning" ? "bg-score-warning" : "bg-score-strong"
                  }`} />
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{rec.text}</p>
                  {rec.impact && (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium shrink-0">{rec.impact}</span>
                  )}
                </div>
              ))}
            </div>
          </AnalysisSection>
        )}
      </div>
    </AppLayout>
  );
}
