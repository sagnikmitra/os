import AppLayout from "@/components/layout/AppLayout";
import { SeverityBadge } from "@/components/ScoreCard";
import { motion } from "@/lib/motion-stub";
import {
  Route, Clock, Zap, ArrowRight, CheckCircle2, AlertTriangle, PenTool,
  Target, TrendingUp, Copy, Wrench, Star, Calendar, BarChart3,
  Search, Layout, FileText, Bot, Sparkles, PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalysis, ResumeAnalysis } from "@/context/AnalysisContext";
import { Link } from "react-router-dom";
import { AnalysisRequiredState } from "@/components/AnalysisRequiredState";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { SectionNav, AnalysisSection } from "@/components/analysis/AnalysisShell";
import { cn } from "@/lib/utils";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

const impactColor = (impact: string) => {
  const i = impact?.toLowerCase() || "";
  if (i === "high" || i === "critical") return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
  if (i === "medium" || i === "moderate") return "text-amber-600 dark:text-amber-400 bg-amber-500/10";
  return "text-muted-foreground bg-secondary/50";
};

const effortBadge = (effort: string) => {
  const e = effort?.toLowerCase() || "";
  if (e.includes("quick") || e.includes("5 min")) return { level: "excellent" as const, label: "Quick Fix" };
  if (e.includes("15 min") || e.includes("30 min")) return { level: "strong" as const, label: effort };
  if (e.includes("hour")) return { level: "warning" as const, label: effort };
  return { level: "risk" as const, label: effort || "Significant" };
};

interface UnifiedFix {
  id: string;
  source: "Priority" | "ATS" | "Recruiter" | "Content" | "Structure" | "Parsing" | "AI";
  action: string;
  current?: string;
  improved?: string;
  impact: "high" | "medium" | "low";
  time_estimate: string;
  category: "formatting" | "keywords" | "content" | "structure" | "technical" | "ai";
}

export function ImprovementRoadmapContent({ embedded = false }: { embedded?: boolean }) {
  const { analysis } = useAnalysis();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!analysis) return (
    <AnalysisRequiredState
      pageTitle="Improvement Roadmap"
      description="Upload your resume to get a prioritized fix roadmap with immediate, short-term, and long-term improvements."
    />
  );

  // AGGREGATION ENGINE: Construct a massive master checklist from every analysis module
  const masterFixList = useMemo(() => {
    const fixes: UnifiedFix[] = [];
    const seen = new Set<string>();

    const addUnique = (fix: Omit<UnifiedFix, "id">) => {
      const key = fix.action.toLowerCase().substring(0, 50);
      if (!seen.has(key)) {
        fixes.push({ ...fix, id: `fix-${fixes.length}` });
        seen.add(key);
      }
    };

    // 1. Core Priorities
    (analysis.priorities || []).forEach(p => {
      addUnique({
        source: "Priority",
        action: p.label,
        impact: (p.estimated_impact?.toLowerCase() || "high") as any,
        time_estimate: p.effort || "15 min",
        category: "technical",
        improved: `Standardize this using the ${p.framework || "recommended"} framework.`
      });
    });

    // 2. Red Flags
    (analysis.red_flags || []).forEach(flag => {
      addUnique({
        source: "Recruiter",
        action: typeof flag === 'string' ? flag : (flag as any).issue || flag,
        impact: "high",
        time_estimate: "15 min",
        category: "content",
        improved: "Remove or rewrite this element immediately to pass the 6-second scan."
      });
    });

    // 3. ATS Gaps
    const ats = analysis.ats_analysis;
    (ats?.missing_keywords || []).forEach(kw => {
      addUnique({
        source: "ATS",
        action: `Add missing keyword: ${kw}`,
        impact: "high",
        time_estimate: "5 min",
        category: "keywords",
        improved: `Naturally integrate "${kw}" into your experience bullet points.`
      });
    });

    (ats?.recommendations || []).forEach(rec => {
      addUnique({
        source: "ATS",
        action: rec.text,
        impact: (rec.impact?.toLowerCase() || "medium") as any,
        time_estimate: "15 min",
        category: "formatting",
      });
    });

    // 4. Recruiter Issues
    (analysis.recruiter_analysis?.issues || []).forEach(issue => {
      addUnique({
        source: "Recruiter",
        action: issue.issue,
        impact: (issue.severity === "risk" ? "high" : "medium") as any,
        time_estimate: "20 min",
        category: "content",
        improved: issue.fix
      });
    });

    // 5. Content Quality
    (analysis.content_analysis?.bullets || []).filter(b => b.strength === "weak").slice(0, 10).forEach(b => {
      addUnique({
        source: "Content",
        action: `Verify & Quantify: "${b.text.substring(0, 40)}..."`,
        current: b.text,
        improved: b.fix,
        impact: "high",
        time_estimate: "10 min",
        category: "content"
      });
    });

    // 6. Structure Gaps
    (analysis.structure_analysis?.missing_sections || []).forEach(sec => {
      addUnique({
        source: "Structure",
        action: `Add missing section: ${sec}`,
        impact: "medium",
        time_estimate: "15 min",
        category: "structure",
        improved: `Create a dedicated ${sec} section to improve document flow.`
      });
    });

    // 7. Parsing Failures
    (analysis.parsing_analysis?.fields || []).filter(f => f.status === "failed" || f.status === "partial").forEach(f => {
      addUnique({
        source: "Parsing",
        action: `Fix parse error in field: ${f.field}`,
        impact: "high",
        time_estimate: "5 min",
        category: "formatting",
        improved: `Ensure ${f.field} is clearly labeled and follows standard date/text formats.`
      });
    });

    // 8. AI Detection (Humanizer)
    (analysis.humanizer_analysis?.detections || []).slice(0, 5).forEach(det => {
      addUnique({
        source: "AI",
        action: `De-roboticize text: "${det.original.substring(0, 30)}..."`,
        current: det.original,
        improved: det.humanized,
        impact: "medium",
        time_estimate: "5 min",
        category: "ai"
      });
    });

    return fixes;
  }, [analysis]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const quickWins = masterFixList.filter(f => f.time_estimate.includes("5 min") || f.time_estimate.includes("10 min"));
  const deepFixes = masterFixList.filter(f => !quickWins.includes(f));
  
  const sectionRewrites = analysis.improvement_roadmap?.section_by_section_rewrites || [];

  const sections = [
    { id: "ir-overview", label: "Strategy", icon: <Target className="h-4 w-4" /> },
    { id: "ir-quick", label: "Quick Wins", count: quickWins.length, icon: <Zap className="h-4 w-4" /> },
    { id: "ir-deep", label: "Deep Fixes", count: deepFixes.length, icon: <Wrench className="h-4 w-4" /> },
    ...(sectionRewrites.length ? [{ id: "ir-grades", label: "Section Grades", icon: <Layout className="h-4 w-4" /> }] : []),
  ];

  return (
    <div className={cn(
      "space-y-6 pb-20",
      !embedded && "p-4 sm:p-6 max-w-5xl mx-auto"
    )}>
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2 pb-3 bg-background/80 backdrop-blur-lg border-b border-border/50 mb-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <Route className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight">Master Fix Roadmap</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
                  Aggregated from {masterFixList.length} diagnostic checkpoints
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/builder"><Button variant="default" size="sm" className="gap-1.5 text-xs h-8 shadow-sm">Go to Builder</Button></Link>
            </div>
          </div>
          <SectionNav sections={sections} />
        </div>

        {/* 1. Strategy Overview */}
        <div id="ir-overview" className="scroll-mt-32">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div {...fade(1)} className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles className="h-16 w-16 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2 truncate">
                <Target className="h-5 w-5 text-primary" /> The Executive Way Ahead
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {analysis.overall_verdict?.one_liner || "Follow this roadmap to transform your resume into a top-1% document."}
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1 rounded-full bg-background border text-[10px] font-bold">GRADE: {analysis.overall_verdict?.grade || "B"}</div>
                <div className="px-3 py-1 rounded-full bg-background border text-[10px] font-bold">TOTAL FIXES: {masterFixList.length}</div>
              </div>
            </motion.div>

            <motion.div {...fade(2)} className="grid grid-cols-2 gap-3">
              {[
                { label: "Quick Wins", value: quickWins.length, icon: Zap, color: "text-emerald-500" },
                { label: "Deep Rewrites", value: deepFixes.length, icon: Wrench, color: "text-amber-500" },
                { label: "ATS Gaps", value: masterFixList.filter(f => f.source === "ATS").length, icon: Search, color: "text-blue-500" },
                { label: "Red Flags", value: analysis.red_flags.length, icon: AlertTriangle, color: "text-rose-500" },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl border bg-card p-4 flex flex-col justify-between">
                  <stat.icon className={`h-4 w-4 ${stat.color} mb-2`} />
                  <div>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{stat.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* 2. Quick Wins (5-10 mins) */}
        <AnalysisSection 
          id="ir-quick" 
          title="Phase 1: Quick Wins" 
          subtitle="Estimated time: 30-45 mins to clear these items."
          icon={<Zap className="h-4 w-4" />}
        >
          <div className="divide-y divide-border/40">
            {quickWins.map((fix, idx) => (
              <FixItem key={fix.id} fix={fix} index={idx} onCopy={handleCopy} copiedKey={copiedKey} />
            ))}
            {quickWins.length === 0 && <EmptyFixState />}
          </div>
        </AnalysisSection>

        {/* 3. Deep Fixes (15+ mins) */}
        <AnalysisSection 
          id="ir-deep" 
          title="Phase 2: Deep Impact Fixes" 
          subtitle="Strategic rewrites that significantly boost your interview callback rate."
          icon={<Wrench className="h-4 w-4" />}
        >
          <div className="divide-y divide-border/40">
            {deepFixes.map((fix, idx) => (
              <FixItem key={fix.id} fix={fix} index={idx} onCopy={handleCopy} copiedKey={copiedKey} />
            ))}
            {deepFixes.length === 0 && <EmptyFixState />}
          </div>
        </AnalysisSection>

        {/* 4. Section Grades */}
        {sectionRewrites.length > 0 && (
          <AnalysisSection id="ir-grades" title="Section-by-Section Health" icon={<BarChart3 className="h-4 w-4" />}>
            <div className="p-4 grid sm:grid-cols-2 gap-4">
              {sectionRewrites.map((sec: any, i: number) => {
                const grade = sec.current_grade?.replace(/[+-]/g, "") || "C";
                const gradeColor = grade === "A" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : grade === "B" ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                : grade === "C" ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-rose-500/10 text-rose-600 border-rose-500/20";
                
                return (
                  <div key={i} className="p-4 rounded-xl border bg-secondary/20 flex items-start gap-4">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold border", gradeColor)}>
                      {sec.current_grade}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold mb-1">{sec.section}</h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {sec.issues?.[0] || sec.rewrite_suggestions?.[0] || "Standard section review."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </AnalysisSection>
        )}
      </div>
  );
}

function FixItem({ fix, index, onCopy, copiedKey }: { fix: UnifiedFix, index: number, onCopy: (t: string, k: string) => void, copiedKey: string | null }) {
  const SourceIcon = (() => {
    switch(fix.source) {
      case "ATS": return Search;
      case "AI": return Bot;
      case "Content": return FileText;
      case "Structure": return Layout;
      default: return CheckCircle2;
    }
  })();

  return (
    <motion.div {...fade(index)} className="p-4 sm:p-5 hover:bg-secondary/20 transition-colors">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl border bg-background shadow-sm shrink-0">
          <SourceIcon className="h-4 w-4 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">{fix.source}</span>
            <SeverityBadge 
              level={fix.impact === "high" ? "critical" : fix.impact === "medium" ? "warning" : "strong"} 
              label={fix.impact} 
            />
            <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
              <Clock className="h-3 w-3" /> {fix.time_estimate}
            </span>
          </div>
          
          <h4 className="text-sm font-bold mb-2 leading-tight">{fix.action}</h4>
          
          {(fix.current || fix.improved) && (
            <div className="mt-3 space-y-2">
              {fix.current && (
                <div className="text-[11px] p-2 bg-destructive/5 rounded border border-destructive/10">
                  <span className="font-bold text-destructive/80 block mb-0.5">CURRENT</span>
                  {fix.current}
                </div>
              )}
              {fix.improved && (
                <div className="group relative">
                  <div className="text-[11px] p-2 bg-emerald-500/5 rounded border border-emerald-500/10 pr-10">
                    <span className="font-bold text-emerald-600 block mb-0.5 uppercase">Improved {fix.source === "AI" ? "(Humanized)" : ""}</span>
                    {fix.improved}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onCopy(fix.improved!, fix.id)}
                  >
                    {copiedKey === fix.id ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <Link to="/builder" className="shrink-0 hidden sm:block">
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-primary">
            Fix <PlusCircle className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

function EmptyFixState() {
  return (
    <div className="p-10 text-center">
      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
      </div>
      <h4 className="text-sm font-bold">All items cleared!</h4>
      <p className="text-xs text-muted-foreground mt-1">No pending fixes detected for this phase.</p>
    </div>
  );
}

export default function ImprovementRoadmap({ embedded = false }: { embedded?: boolean }) {
  const content = <ImprovementRoadmapContent embedded={embedded} />;
  return embedded ? content : <AppLayout title="Improvement Roadmap">{content}</AppLayout>;
}
