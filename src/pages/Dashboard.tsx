import { useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import logoImg from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { motion } from "@/lib/motion-stub";
import { useAnalysis } from "@/context/AnalysisContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Hammer,
  FolderOpen,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Shield,
  FileText,
  Route,
  Briefcase,
  Target,
  Mic,
  DollarSign,
  MessageSquare,
  TrendingUp,
  Bot,
  BarChart3,
  LucideIcon,
} from "lucide-react";

const fade = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
});

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

type PrimaryAction = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: string;
};

const primaryActions: PrimaryAction[] = [
  {
    title: "Upload & Analyze",
    description: "Run deep ATS, content, structure, and recruiter-readability diagnostics.",
    href: "/upload",
    icon: Upload,
    accent: "bg-primary/12 text-primary",
  },
  {
    title: "Resume Builder",
    description: "Build role-specific resumes with templates and AI-assisted editing.",
    href: "/builder",
    icon: Hammer,
    accent: "bg-score-excellent/12 text-score-excellent",
  },
  {
    title: "My Resumes",
    description: "Manage versions, aliases, active selection, and exports in one place.",
    href: "/my-resumes",
    icon: FolderOpen,
    accent: "bg-score-warning/12 text-score-warning",
  },
  {
    title: "Features & Guide",
    description: "Explore all modules with walkthroughs and best-practice usage flows.",
    href: "/features",
    icon: Sparkles,
    accent: "bg-chart-4/12 text-chart-4",
  },
];

type CapabilityGroup = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  chips: string[];
};

const capabilityGroups: CapabilityGroup[] = [
  {
    title: "Deep Analysis",
    description: "From ATS compatibility to content strength and structure quality, identify exactly what to fix.",
    href: "/analysis",
    icon: Shield,
    chips: ["ATS", "Parsing", "Recruiter", "Content", "Structure", "Recommendations"],
  },
  {
    title: "Job Targeting",
    description: "Match resumes to job descriptions, tailor bullets, and track application progress.",
    href: "/jobs-for-you",
    icon: Target,
    chips: ["Jobs For You", "Job Match", "JD Tailor", "Applications"],
  },
  {
    title: "Interview & Salary",
    description: "Practice interviews, build STAR stories, benchmark salary, and compare offers confidently.",
    href: "/interview-prep",
    icon: Mic,
    chips: ["Interview Prep", "Mock Interview", "STAR", "Salary Data", "Offers"],
  },
  {
    title: "Outreach & Brand",
    description: "Create outreach assets and strengthen your professional story across channels.",
    href: "/cover-letter",
    icon: MessageSquare,
    chips: ["Cover Letter", "Follow-Up", "Thank You", "LinkedIn", "Branding"],
  },
];

const starterSteps = [
  { title: "Analyze your current resume", href: "/upload", icon: Upload },
  { title: "Apply top-priority fixes", href: "/analysis?tab=recommendations", icon: Route },
  { title: "Build role-specific versions", href: "/builder", icon: FileText },
];

function PrimaryActionCard({ action }: { action: PrimaryAction }) {
  const Icon = action.icon;

  return (
    <Link to={action.href} className="group block h-full">
      <div className="h-full rounded-2xl border border-border/65 bg-card/95 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${action.accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-foreground">{action.title}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{action.description}</p>
        <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
          Open
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}

function getScoreTone(score: number) {
  if (score >= 85) return "bg-score-excellent/10 text-score-excellent border-score-excellent/25";
  if (score >= 70) return "bg-primary/10 text-primary border-primary/25";
  if (score >= 55) return "bg-score-warning/10 text-score-warning border-score-warning/25";
  return "bg-destructive/10 text-destructive border-destructive/25";
}

export default function Dashboard() {
  const { analysis, fileName } = useAnalysis();

  const averageScore = useMemo(() => {
    if (!analysis) return null;
    const values = Object.values(analysis.scores || {})
      .map((s) => s?.score)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

    if (!values.length) return null;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [analysis]);

  const scoreHighlights = useMemo(() => {
    if (!analysis) return [];
    return [
      { label: "ATS", score: analysis.scores.ats?.score ?? null, href: "/ats" },
      { label: "Content", score: analysis.scores.content_quality?.score ?? null, href: "/content" },
      { label: "Structure", score: analysis.scores.structure?.score ?? null, href: "/structure" },
      { label: "Recruiter", score: analysis.scores.recruiter_readability?.score ?? null, href: "/recruiter" },
    ].filter((item) => typeof item.score === "number") as { label: string; score: number; href: string }[];
  }, [analysis]);

  return (
    <AppLayout title="Home" subtitle="CareerOS platform workspace">
      <div className="page-container max-w-7xl space-y-6 py-4 sm:py-6 lg:py-8">
        <motion.div {...fade(0)}>
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/95 p-5 sm:p-7 lg:p-8">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/[0.08] blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-score-excellent/[0.08] blur-3xl" />

            <div className="relative grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/75 px-3 py-1.5">
                  <img src={logoImg} alt="sgnk CareerOS" className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{getGreeting()}</span>
                </div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  Build, optimize, and win with your full CareerOS workspace
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  This is your command center for resume intelligence, job targeting, outreach, interview prep,
                  and career growth planning. Launch every part of your job-search system from one home base.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  <Link to="/upload">
                    <Button className="h-9 gap-1.5 text-xs sm:text-sm">
                      Start With Upload
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Link to="/features">
                    <Button variant="outline" className="h-9 gap-1.5 text-xs sm:text-sm">
                      Explore Capabilities
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Platform Scope</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { label: "Resume Intelligence", icon: BarChart3 },
                    { label: "Job Matching", icon: Briefcase },
                    { label: "Interview Simulator", icon: Mic },
                    { label: "Offer Strategy", icon: DollarSign },
                    { label: "Outreach Engine", icon: MessageSquare },
                    { label: "AI Humanizer", icon: Bot },
                    { label: "Career Growth", icon: TrendingUp },
                    { label: "Full Reports", icon: FileText },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 rounded-lg border border-border/55 bg-card/75 px-2.5 py-2">
                      <item.icon className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate text-[11px] font-medium text-foreground/90">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {analysis ? (
          <motion.div {...fade(1)} className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-border/65 bg-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Latest Analysis Snapshot</p>
                  <p className="mt-1 text-sm font-semibold text-foreground line-clamp-1">{fileName || "Latest uploaded resume"}</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {analysis.overall_verdict?.one_liner || "Analysis is ready. Open the deep-dive dashboard to inspect section-level insights."}
                  </p>
                </div>
                {analysis.overall_verdict?.grade && (
                  <Badge className="border border-primary/20 bg-primary/10 text-primary">Grade {analysis.overall_verdict.grade}</Badge>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/analysis">
                  <Button size="sm" className="h-8 gap-1.5 text-xs">
                    Open Analysis Dashboard
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link to="/reports">
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    Open Full Report
                  </Button>
                </Link>
                <Link to="/improvement-roadmap">
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    Priority Roadmap
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-border/65 bg-card p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Score Highlights</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {scoreHighlights.length > 0 ? (
                  scoreHighlights.map((item) => (
                    <Link key={item.label} to={item.href} className="group rounded-lg border border-border/55 bg-background/70 px-3 py-2 hover:border-primary/25 hover:bg-primary/[0.04]">
                      <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`rounded-md border px-1.5 py-0.5 text-sm font-bold tabular-nums ${getScoreTone(item.score)}`}>
                          {item.score}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/55 group-hover:text-primary" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-2 rounded-lg border border-dashed border-border/70 px-3 py-4 text-xs text-muted-foreground">
                    Score highlights are not available yet.
                  </div>
                )}
              </div>

              {averageScore !== null && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Average score across evaluated dimensions: <span className="font-semibold text-foreground">{averageScore}/100</span>
                </p>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div {...fade(1)} className="rounded-2xl border border-border/65 bg-card p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Get Started In 3 Steps</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {starterSteps.map((step, idx) => (
                <Link key={step.title} to={step.href} className="group rounded-xl border border-border/60 bg-background/70 p-3 hover:border-primary/30 hover:bg-primary/[0.03]">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="h-4 w-4" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Step {idx + 1}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{step.title}</p>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div {...fade(2)}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Primary Workflows</p>
            <Link to="/features" className="text-xs font-medium text-primary hover:underline">
              Browse all modules
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {primaryActions.map((action) => (
              <PrimaryActionCard key={action.title} action={action} />
            ))}
          </div>
        </motion.div>

        <motion.div {...fade(3)}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Capability Matrix</p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {capabilityGroups.map((group) => (
              <Link key={group.title} to={group.href} className="group rounded-2xl border border-border/65 bg-card p-4 sm:p-5 transition-all hover:border-primary/30 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <group.icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-semibold text-foreground">{group.title}</p>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 group-hover:text-primary" />
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{group.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {group.chips.map((chip) => (
                        <span key={chip} className="rounded-full border border-border/65 bg-background/70 px-2 py-0.5 text-[11px] font-medium text-foreground/85">
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
