/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Link } from "react-router-dom";
import { SeverityBadge, ScoreCard, getScoreLevel } from "@/components/ScoreCard";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import {
  Shield, FileSearch, Eye, Type, Bot, Briefcase, Target, Layers,
  Sparkles, AlertTriangle, ArrowRight, TrendingUp, CheckCircle2,
  MapPin, Building2, GraduationCap, Zap, Clock, GitBranch, Star, PenTool,
  Upload, Hammer, Mail, Brain, Crown, LineChart, Crosshair, Search, Route,
  BookOpen, ListChecks, ChevronDown, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/AnalysisContext";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ReactNode> = {
  ats: <Shield className="h-4 w-4" />,
  parsing: <FileSearch className="h-4 w-4" />,
  recruiter_readability: <Eye className="h-4 w-4" />,
  content_quality: <Type className="h-4 w-4" />,
  human_authenticity: <Bot className="h-4 w-4" />,
  impact_strength: <TrendingUp className="h-4 w-4" />,
  structure: <Layers className="h-4 w-4" />,
  clarity: <Sparkles className="h-4 w-4" />,
  strategic_positioning: <Target className="h-4 w-4" />,
};

const titleMap: Record<string, string> = {
  ats: "ATS Score", parsing: "Parsing Score", recruiter_readability: "Recruiter Readability",
  content_quality: "Content Quality", human_authenticity: "Human Authenticity",
  impact_strength: "Impact Strength", structure: "Structure Score",
  clarity: "Clarity Score", strategic_positioning: "Strategic Position",
};

const tabMap: Record<string, string> = {
  ats: "ats", parsing: "parsing", recruiter_readability: "recruiter",
  content_quality: "content", human_authenticity: "humanizer",
  impact_strength: "content", structure: "structure",
  clarity: "content", strategic_positioning: "structure",
};

const fade = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as any },
});

function Section({ title, icon, children, defaultOpen = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 sm:px-5 py-3 hover:bg-secondary/30 transition-colors"
      >
        <span className="text-primary">{icon}</span>
        <h3 className="font-display text-sm font-semibold flex-1 text-left">{title}</h3>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function OverviewContent({ onNavigateToTab }: { onNavigateToTab?: (tab: string) => void }) {
  const { analysis } = useAnalysis();
  
  if (!analysis) return null;

  const scoreEntries = Object.entries(analysis.scores);
  const info = analysis.extracted_info;
  const verdict = analysis.overall_verdict;
  const career = analysis.career_narrative;
  const skills = analysis.skills_analysis;
  const competency = analysis.competency_mapping;
  const benchmarking = analysis.industry_benchmarking;
  const executive = analysis.executive_presence;
  const interviewVuln = analysis.interview_vulnerability;
  const consistency = analysis.consistency_audit;
  const roadmap = analysis.improvement_roadmap;

  // Compute overall average for the hero ring
  const validScores = scoreEntries.filter(([, v]) => v && typeof v === "object" && "score" in v).map(([, v]) => (v as any).score as number);
  const avgScore = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
  const avgLevel = getScoreLevel(avgScore);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Hero Overall Score Card */}
      <motion.div {...fade(0)}>
        <div className="rounded-3xl border bg-card p-6 sm:p-8 relative overflow-hidden">
          {/* Decorative background glow */}
          <div className={cn(
            "absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-20 transition-colors duration-500",
            avgScore >= 90 ? "bg-score-excellent" : avgScore >= 70 ? "bg-score-warning" : "bg-score-critical"
          )} />
          
          <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Massive Score Ring */}
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" strokeWidth="8" className="stroke-secondary/50" />
                <circle
                  cx="50" cy="50" r="44" fill="none" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${avgScore * 2.76} 276`}
                  className={cn(
                    "transition-all duration-1000 ease-out",
                    avgScore >= 90 ? "stroke-score-excellent" : avgScore >= 70 ? "stroke-score-warning" : "stroke-score-critical"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn(
                  "font-display text-5xl sm:text-6xl font-bold tracking-tighter transition-colors duration-500",
                  avgScore >= 90 ? "text-score-excellent" : avgScore >= 70 ? "text-score-warning" : "text-score-critical"
                )}>
                  {avgScore}
                </span>
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1 opacity-70">Aggregate</span>
              </div>
            </div>

            {/* Analysis Summary & Verdict */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border mb-4">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-2">Analysis Verdict</span>
                {verdict?.grade && (
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-md bg-background border",
                    avgScore >= 90 ? "text-score-excellent" : avgScore >= 70 ? "text-score-warning" : "text-score-critical"
                  )}>
                    Grade {verdict.grade}
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                {avgScore >= 90 ? "Exceptional Potential" : 
                 avgScore >= 80 ? "Strong Competitive Edge" : 
                 avgScore >= 70 ? "Solid Foundation" : "Strategic Optimization Needed"}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {verdict?.one_liner || "Your resume has been processed across 20+ dimensions of evaluation."}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-8">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full", avgScore >= 90 ? "bg-score-excellent" : avgScore >= 70 ? "bg-score-warning" : "bg-score-critical")} />
                  <span className="text-sm font-medium text-foreground">
                    {avgScore >= 90 ? "Excellent" : avgScore >= 80 ? "Very Good" : avgScore >= 70 ? "Average" : "Needs Review"}
                  </span>
                </div>
                <div className="w-px h-4 bg-border hidden sm:block" />
                <span className="text-sm text-muted-foreground">
                  Compared to <span className="text-foreground font-semibold">1,200+</span> industry peers in {benchmarking?.target_role || "your field"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hero Verdict Banner - Simplified now that we have the hero score */}
      {verdict && (
        <motion.div {...fade(1)}>
          <div className="rounded-2xl border bg-card/50 overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="font-display text-lg font-bold tracking-tight text-muted-foreground uppercase tracking-widest text-[11px]">{info?.name || "Personal Context"}</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    {info?.current_title && <span className="flex items-center gap-2 text-foreground font-medium"><Briefcase className="h-4 w-4 text-primary/60" /> {info.current_title}</span>}
                    {info?.current_company && <span className="flex items-center gap-2 text-foreground font-medium"><Building2 className="h-4 w-4 text-primary/60" /> {info.current_company}</span>}
                    {info?.location && <span className="flex items-center gap-2 text-foreground font-medium"><MapPin className="h-4 w-4 text-primary/60" /> {info.location}</span>}
                    {info?.total_experience_years !== undefined && <span className="flex items-center gap-2 text-foreground font-medium"><Clock className="h-4 w-4 text-primary/60" /> {info.total_experience_years}y Experience</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-2 px-5 sm:px-6 py-3 border-t bg-secondary/10">
              <Link to="/upload"><Button variant="outline" size="sm" className="text-xs h-8 gap-2"><Upload className="h-4 w-4" /> Rescan Resume</Button></Link>
              <Link to="/builder"><Button variant="outline" size="sm" className="gap-2 text-xs h-8"><Hammer className="h-4 w-4" /> Manual Edit</Button></Link>
              <Link to="/job-match"><Button size="sm" className="gap-2 text-xs h-8">Job Match Engine <ArrowRight className="h-4 w-4" /></Button></Link>
              {verdict.estimated_response_rate && (
                <span className="text-xs text-muted-foreground ml-auto hidden sm:flex items-center gap-2 bg-background/50 px-3 py-1 rounded-full border">
                  Expected Response: <span className="font-bold text-foreground">{verdict.estimated_response_rate}</span>
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Next Steps — contextual */}
      {verdict && (
        <motion.div {...fade(2)}>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 flex items-center gap-2">
            <span className="w-8 h-px bg-border" />
            {verdict.ready_to_apply ? "Ready to apply — next steps" : "Improve first — suggested actions"}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {(verdict.ready_to_apply
              ? [
                  { title: "Job Match", desc: "Check fit for a role", href: "/job-match", icon: Briefcase },
                  { title: "Cover Letter", desc: "AI-tailored letter", href: "/cover-letter", icon: Mail },
                  { title: "Interview Prep", desc: "Practice questions", href: "/interview-prep", icon: GraduationCap },
                  { title: "Find Jobs", desc: "AI-matched roles", href: "/jobs-for-you", icon: Search },
                ]
              : [
                  { title: "Fix Roadmap", desc: "Prioritized fixes", href: "/improvement-roadmap", icon: Route },
                  { title: "Rewrite Bullets", desc: "Strengthen content", href: "/rewrites", icon: PenTool },
                  { title: "Resume Builder", desc: "Edit sections", href: "/builder", icon: Hammer },
                  { title: "ATS Deep Dive", desc: "Fix compatibility", href: "/ats", icon: Shield },
                ]
            ).map((step) => (
              <Link key={step.href} to={step.href} className="group">
                <div className="flex items-center gap-2.5 p-3 rounded-xl border hover:border-primary/25 hover:bg-primary/[0.02] transition-all">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                    <step.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{step.title}</p>
                    <p className="text-[10px] text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Stats */}
      {verdict && (
        <motion.div {...fade(3)}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Ready", value: verdict.ready_to_apply ? "Yes" : "No", icon: <CheckCircle2 className="h-4 w-4" />, color: verdict.ready_to_apply ? "text-score-excellent" : "text-score-critical" },
              { label: "Trajectory", value: career?.progression || "N/A", icon: <GitBranch className="h-4 w-4" />, color: career?.progression === "ascending" ? "text-score-excellent" : "text-score-warning" },
              { label: "Biggest Risk", value: verdict.biggest_risk || "None", icon: <AlertTriangle className="h-4 w-4" />, color: "text-score-critical" },
              { label: "Top Asset", value: verdict.biggest_asset || "N/A", icon: <Star className="h-4 w-4" />, color: "text-score-excellent" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border bg-card/40 p-5 group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className={stat.color}>{stat.icon}</span>
                  <span className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-bold">{stat.label}</span>
                </div>
                <p className="text-sm font-bold truncate text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Score Grid */}
      <motion.div {...fade(4)}>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-4 flex items-center gap-2">
          <span className="w-8 h-px bg-border" />
          Dimension-specific Analysis
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {scoreEntries
            .filter(([, val]) => val && typeof val === "object" && "score" in val)
            .map(([key, val]) => (
              <button key={key} onClick={() => onNavigateToTab?.(tabMap[key] || "overview")} className="block w-full text-left">
                <ScoreCard title={titleMap[key] || key} score={(val as any).score} description={(val as any).summary} icon={iconMap[key]} />
              </button>
            ))}
        </div>
      </motion.div>

      {/* Skills Matrix */}
      {skills && (
        <motion.div {...fade(4)}>
          <Section title="Skills Matrix" icon={<Zap className="h-4 w-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {skills.technical_skills?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Technical</p>
                  <div className="flex flex-wrap gap-1">{skills.technical_skills.map((s: string) => <span key={s} className="px-2 py-0.5 rounded text-[11px] bg-primary/10 text-primary">{s}</span>)}</div>
                </div>
              )}
              {skills.tools_platforms?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Tools</p>
                  <div className="flex flex-wrap gap-1">{skills.tools_platforms.map((s: string) => <span key={s} className="px-2 py-0.5 rounded text-[11px] bg-accent/10 text-accent">{s}</span>)}</div>
                </div>
              )}
              {skills.soft_skills?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Soft Skills</p>
                  <div className="flex flex-wrap gap-1">{skills.soft_skills.map((s: string) => <span key={s} className="px-2 py-0.5 rounded text-[11px] bg-secondary text-secondary-foreground">{s}</span>)}</div>
                </div>
              )}
            </div>
            {skills.missing_for_role?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/40">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Missing for Target Role</p>
                <div className="flex flex-wrap gap-1">{skills.missing_for_role.map((s: string) => <span key={s} className="px-2 py-0.5 rounded text-[11px] bg-score-warning/10 text-score-warning">{s}</span>)}</div>
              </div>
            )}
          </Section>
        </motion.div>
      )}

      {/* Priorities & Red Flags — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {analysis.priorities.length > 0 && (
          <motion.div {...fade(5)}>
            <Section title="Top Priorities" icon={<BarChart3 className="h-4 w-4" />}>
              <div className="space-y-1">
                {analysis.priorities.slice(0, 6).map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/40 transition-colors">
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", p.severity === "critical" ? "bg-score-critical" : p.severity === "risk" ? "bg-score-risk" : "bg-score-warning")} />
                    <span className="text-xs flex-1 truncate">{p.label}</span>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>
        )}
        {analysis.red_flags.length > 0 && (
          <motion.div {...fade(6)}>
            <Section title="Red Flags" icon={<AlertTriangle className="h-4 w-4" />}>
              <div className="space-y-1">
                {analysis.red_flags.slice(0, 6).map((flag: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg">
                    <AlertTriangle className="h-3 w-3 text-score-warning mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{flag}</span>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>
        )}
      </div>

      {/* Career Trajectory — collapsed by default */}
      {career && career.transitions?.length > 0 && (
        <motion.div {...fade(7)}>
          <Section title="Career Trajectory" icon={<GitBranch className="h-4 w-4" />} defaultOpen={false}>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <SeverityBadge level={career.progression === "ascending" ? "excellent" : career.progression === "lateral" ? "warning" : "risk"} label={career.progression} />
              <span className="text-xs text-muted-foreground">{career.job_tenure_pattern} · Avg: {career.average_tenure_months}mo</span>
            </div>
            <div className="space-y-2">
              {career.transitions.map((t: any, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 text-xs">
                  <span className="text-muted-foreground truncate">{t.from}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{t.to}</span>
                  <SeverityBadge level={t.type === "promotion" ? "excellent" : t.type === "lateral" ? "warning" : t.type === "pivot" ? "strong" : "risk"} label={t.type} />
                </div>
              ))}
            </div>
          </Section>
        </motion.div>
      )}

      {/* Competency Mapping — collapsed */}
      {competency && (
        <motion.div {...fade(8)}>
          <Section title="Competency Mapping" icon={<Brain className="h-4 w-4" />} defaultOpen={false}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {(["leadership", "technical_depth", "communication", "problem_solving", "collaboration", "innovation", "business_impact"] as const).map((key) => {
                const c = competency[key];
                if (!c) return null;
                const level = c.score >= 80 ? "excellent" : c.score >= 60 ? "strong" : c.score >= 40 ? "warning" : "critical";
                return (
                  <div key={key} className="p-2.5 rounded-lg bg-secondary/30">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-semibold capitalize truncate">{key.replace(/_/g, " ")}</span>
                      <SeverityBadge level={level} label={`${c.score}`} />
                    </div>
                    {c.evidence?.length > 0 && <p className="text-[10px] text-muted-foreground line-clamp-1 italic">"{c.evidence[0]}"</p>}
                  </div>
                );
              })}
            </div>
          </Section>
        </motion.div>
      )}

      {/* Benchmarking — collapsed */}
      {benchmarking && (
        <motion.div {...fade(9)}>
          <Section title="Industry Benchmarking" icon={<LineChart className="h-4 w-4" />} defaultOpen={false}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {[
                { label: "Target Role", value: benchmarking.target_role },
                { label: "Percentile", value: `${benchmarking.percentile_estimate}th` },
                { label: "Positioning", value: benchmarking.market_positioning },
                { label: "Salary Signal", value: benchmarking.salary_signal },
              ].map((s) => (
                <div key={s.label} className="p-2 rounded-lg bg-secondary/30 text-center">
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">{s.label}</p>
                  <p className="text-xs font-semibold truncate capitalize mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </Section>
        </motion.div>
      )}

      {/* Executive Presence — collapsed */}
      {executive && executive.applicable && (
        <motion.div {...fade(10)}>
          <Section title="Executive Presence" icon={<Crown className="h-4 w-4" />} defaultOpen={false}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Strategic", value: executive.strategic_thinking_signals },
                { label: "Board Ready", value: executive.board_readiness_signals },
                { label: "Cross-Func", value: executive.cross_functional_leadership },
                { label: "Language", value: executive.executive_language_score },
              ].map((item) => {
                const level = item.value >= 80 ? "excellent" : item.value >= 60 ? "strong" : item.value >= 40 ? "warning" : "critical";
                return (
                  <div key={item.label} className="p-2.5 rounded-lg bg-secondary/30 text-center">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">{item.label}</p>
                    <SeverityBadge level={level} label={`${item.value}/100`} />
                  </div>
                );
              })}
            </div>
          </Section>
        </motion.div>
      )}

      {/* Interview Vulnerability — collapsed */}
      {interviewVuln && (
        <motion.div {...fade(11)}>
          <Section title="Interview Vulnerability" icon={<Crosshair className="h-4 w-4" />} defaultOpen={false}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">Risk:</span>
              <SeverityBadge level={interviewVuln.overall_risk_score >= 70 ? "critical" : interviewVuln.overall_risk_score >= 40 ? "warning" : "excellent"} label={`${interviewVuln.overall_risk_score}/100`} />
            </div>
            {interviewVuln.cross_question_zones?.length > 0 && (
              <div className="space-y-2">
                {interviewVuln.cross_question_zones.slice(0, 4).map((zone: any, i: number) => (
                  <div key={i} className="p-2.5 rounded-lg bg-secondary/30 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold flex-1">"{zone.claim}"</p>
                      <SeverityBadge level={zone.risk_level === "high" ? "critical" : zone.risk_level === "medium" ? "warning" : "strong"} label={zone.risk_level} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{zone.why_risky}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </motion.div>
      )}

      {/* Consistency Audit — collapsed */}
      {consistency && (
        <motion.div {...fade(12)}>
          <Section title="Consistency Audit" icon={<Search className="h-4 w-4" />} defaultOpen={false}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">Score:</span>
              <SeverityBadge level={consistency.overall_consistency_score >= 80 ? "excellent" : consistency.overall_consistency_score >= 60 ? "warning" : "critical"} label={`${consistency.overall_consistency_score}/100`} />
            </div>
            {consistency.contradictions?.length > 0 && (
              <div className="space-y-2">
                {consistency.contradictions.slice(0, 3).map((c: any, i: number) => (
                  <div key={i} className="p-2.5 rounded-lg bg-score-risk/5 border border-score-risk/10 space-y-1 text-xs">
                    <p>"{c.claim_a}" <span className="text-muted-foreground">vs</span> "{c.claim_b}"</p>
                    <p className="text-[10px] text-primary">Fix: {c.resolution}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </motion.div>
      )}

      {/* Improvement Roadmap — collapsed */}
      {roadmap && (
        <motion.div {...fade(13)}>
          <Section title="Improvement Roadmap" icon={<Route className="h-4 w-4" />} defaultOpen={false}>
            {roadmap.immediate_fixes?.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Immediate Fixes</p>
                <div className="space-y-2">
                  {roadmap.immediate_fixes.slice(0, 3).map((fix: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-secondary/30 space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold">{fix.action}</p>
                        <SeverityBadge level={fix.impact === "high" ? "excellent" : "strong"} label={fix.impact} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-1.5 rounded bg-score-risk/5 border border-score-risk/10">
                          <p className="text-[9px] text-score-risk font-semibold mb-0.5">Before</p>
                          <p className="text-[10px] text-muted-foreground">{fix.current}</p>
                        </div>
                        <div className="p-1.5 rounded bg-score-excellent/5 border border-score-excellent/10">
                          <p className="text-[9px] text-score-excellent font-semibold mb-0.5">After</p>
                          <p className="text-[10px] text-foreground/80">{fix.improved}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roadmap.short_term_improvements?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Short-Term</p>
                  {roadmap.short_term_improvements.slice(0, 3).map((s: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-secondary/30 mb-1">
                      <ListChecks className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <p className="font-medium">{s.action}</p>
                    </div>
                  ))}
                </div>
              )}
              {roadmap.long_term_development?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Long-Term</p>
                  {roadmap.long_term_development.slice(0, 3).map((l: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-secondary/30 mb-1">
                      <BookOpen className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <p className="font-medium">{l.area}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        </motion.div>
      )}

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <motion.div {...fade(14)}>
          <Section title="What's Working Well" icon={<CheckCircle2 className="h-4 w-4" />} defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {analysis.strengths.map((s: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg">
                  <CheckCircle2 className="h-3 w-3 text-score-excellent mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{s}</span>
                </div>
              ))}
            </div>
          </Section>
        </motion.div>
      )}
    </div>
  );
}
