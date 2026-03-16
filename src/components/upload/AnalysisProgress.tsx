import {
  CheckCircle2, Loader2, FileSearch, Brain, BarChart3, Sparkles,
  Target, TrendingUp, Shield, Lightbulb, Clock, Zap, Eye, Search,
  FileText, Award, Users, Briefcase, GraduationCap, Code, MessageSquare,
  AlertTriangle, Gauge, LineChart, Puzzle, Scale, Fingerprint,
  Kanban, Mic, Star, BadgeDollarSign, Mail, Network, GitFork, Grid3X3,
  Linkedin, BookOpen, Hammer, Upload, ChevronRight,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "@/lib/motion-stub";

const ANALYSIS_PHASES = [
  { icon: FileText, label: "Extracting contact info & metadata", detail: "Name, email, phone, links…" },
  { icon: Briefcase, label: "Mapping experience timeline", detail: "Roles, companies, tenure…" },
  { icon: GraduationCap, label: "Reviewing education & credentials", detail: "Degrees, certifications…" },
  { icon: Code, label: "Cataloging technical & soft skills", detail: "Skills vs. O*NET taxonomy…" },
  { icon: Search, label: "Running ATS compatibility checks", detail: "Greenhouse, Lever, Workday…" },
  { icon: Eye, label: "Simulating recruiter scan", detail: "Eye-tracking, F-pattern, load…" },
  { icon: Target, label: "Scoring bullets for impact", detail: "STAR/XYZ compliance, metrics…" },
  { icon: Fingerprint, label: "Checking human authenticity", detail: "AI detection, voice uniqueness…" },
  { icon: Puzzle, label: "Mapping competencies", detail: "Leadership, problem-solving…" },
  { icon: LineChart, label: "Analyzing career progression", detail: "Trajectory, gaps, tenure…" },
  { icon: Scale, label: "Running bias scan", detail: "Gender-coded language, age…" },
  { icon: AlertTriangle, label: "Finding interview vulnerabilities", detail: "Vague claims, inflated text…" },
  { icon: Award, label: "Benchmarking against peers", detail: "Percentile, market position…" },
  { icon: Gauge, label: "Computing final scores", detail: "9 dimensions, overall verdict…" },
  { icon: Sparkles, label: "Generating smart rewrites", detail: "Before/after for weak bullets…" },
  { icon: Zap, label: "Building improvement roadmap", detail: "Prioritized fixes, estimates…" },
];

const STAGES = [
  { label: "Reading", icon: FileSearch },
  { label: "AI Analysis", icon: Brain },
  { label: "Parsing", icon: BarChart3 },
  { label: "Scoring", icon: Sparkles },
];

const STAGE_WEIGHTS = [5, 80, 8, 7];

const FEATURE_CATEGORIES = [
  {
    title: "Resume Intelligence",
    color: "from-blue-500/15 to-indigo-500/10 border-blue-500/20",
    iconColor: "text-blue-500",
    features: [
      { name: "9-Dimension Scoring", icon: Shield, url: "/ats" },
      { name: "Resume Builder", icon: Hammer, url: "/builder" },
      { name: "Smart Rewrites", icon: Sparkles, url: "/rewrites" },
    ],
  },
  {
    title: "Job Search",
    color: "from-emerald-500/15 to-teal-500/10 border-emerald-500/20",
    iconColor: "text-emerald-500",
    features: [
      { name: "AI Job Matching", icon: Briefcase, url: "/jobs-for-you" },
      { name: "Application Tracker", icon: Kanban, url: "/application-tracker" },
      { name: "Company Research", icon: Search, url: "/company-research" },
    ],
  },
  {
    title: "Interview Prep",
    color: "from-amber-500/15 to-orange-500/10 border-amber-500/20",
    iconColor: "text-amber-500",
    features: [
      { name: "Mock Interview", icon: Mic, url: "/mock-interview" },
      { name: "STAR Builder", icon: Star, url: "/star-builder" },
      { name: "Offer Comparison", icon: BadgeDollarSign, url: "/offer-comparison" },
    ],
  },
  {
    title: "Outreach & Growth",
    color: "from-violet-500/15 to-purple-500/10 border-violet-500/20",
    iconColor: "text-violet-500",
    features: [
      { name: "Cover Letters", icon: Mail, url: "/cover-letter" },
      { name: "LinkedIn Optimizer", icon: Linkedin, url: "/linkedin-optimizer" },
      { name: "Career Path", icon: GitFork, url: "/career-path" },
    ],
  },
];

interface Props {
  currentStep: number;
  fileReadProgress?: number;
  elapsedSeconds?: number;
  isComplete?: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function AnalysisProgress({ currentStep, fileReadProgress = 0, elapsedSeconds = 0, isComplete = false }: Props) {
  const [stageProgress, setStageProgress] = useState(0);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [completedPhases, setCompletedPhases] = useState<Set<number>>(new Set());

  // Cycle through analysis phases during step 1
  useEffect(() => {
    if (currentStep !== 1) {
      setCurrentPhaseIndex(0);
      setCompletedPhases(new Set());
      return;
    }

    let phaseIdx = 0;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];

    const runPhase = () => {
      if (cancelled || phaseIdx >= ANALYSIS_PHASES.length) return;
      setCurrentPhaseIndex(phaseIdx);
      setPhaseProgress(0);

      const duration = (3 + Math.random() * 3) * 1000; // 3-6s random
      const progressInterval = setInterval(() => {
        if (cancelled) return;
        setPhaseProgress(prev => Math.min(prev + (100 / (duration / 80)), 100));
      }, 80);
      intervals.push(progressInterval);

      const timer = setTimeout(() => {
        clearInterval(progressInterval);
        if (cancelled) return;
        const completedIdx = phaseIdx;
        setCompletedPhases(prev => new Set([...prev, completedIdx]));
        phaseIdx++;
        if (phaseIdx < ANALYSIS_PHASES.length) runPhase();
      }, duration);
      timers.push(timer);
    };

    runPhase();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      intervals.forEach(clearInterval);
    };
  }, [currentStep]);

  // Progress per stage
  useEffect(() => {
    if (currentStep === 0) {
      setStageProgress(fileReadProgress);
      return;
    }
    if (currentStep === 1) {
      const done = completedPhases.size;
      const partial = phaseProgress / ANALYSIS_PHASES.length;
      setStageProgress(Math.min(95, ((done / ANALYSIS_PHASES.length) * 100) + partial));
      return;
    }
    setStageProgress(0);
    const interval = setInterval(() => setStageProgress(prev => Math.min(prev + 2, 95)), 50);
    return () => clearInterval(interval);
  }, [currentStep, fileReadProgress, completedPhases.size, phaseProgress]);

  const overallProgress = useMemo(() => {
    if (isComplete) return 100;
    let completed = 0;
    for (let i = 0; i < currentStep && i < STAGES.length; i++) completed += STAGE_WEIGHTS[i];
    if (currentStep < STAGES.length) completed += (stageProgress / 100) * STAGE_WEIGHTS[currentStep];
    return Math.min(Math.round(completed), 99);
  }, [currentStep, stageProgress, isComplete]);

  // Visible window: show all completed phases (scrolled) + active + next pending
  const visiblePhases = useMemo(() => {
    const items: { phase: typeof ANALYSIS_PHASES[0]; index: number; status: "done" | "active" | "pending" }[] = [];

    // Show last 3 completed
    const sortedCompleted = [...completedPhases].sort((a, b) => a - b);
    const recentDone = sortedCompleted.slice(-3);
    for (const idx of recentDone) {
      items.push({ phase: ANALYSIS_PHASES[idx], index: idx, status: "done" });
    }

    // Current (only if not already in completed)
    if (currentPhaseIndex < ANALYSIS_PHASES.length && !completedPhases.has(currentPhaseIndex)) {
      items.push({ phase: ANALYSIS_PHASES[currentPhaseIndex], index: currentPhaseIndex, status: "active" });
    }

    // Next pending
    const nextIdx = currentPhaseIndex + 1;
    if (nextIdx < ANALYSIS_PHASES.length && !completedPhases.has(nextIdx)) {
      items.push({ phase: ANALYSIS_PHASES[nextIdx], index: nextIdx, status: "pending" });
    }

    return items;
  }, [currentPhaseIndex, completedPhases]);

  return (
    <div className="space-y-4">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}} />
      {/* Overall progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <div className="flex items-center gap-2">
            {!isComplete && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
            <span className="text-foreground font-bold tracking-tight uppercase">
              {isComplete ? "Intelligence Synced" : "Deep Neural Analysis"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {elapsedSeconds > 0 && (
              <span className="text-muted-foreground/60 flex items-center gap-1 font-medium bg-secondary/50 px-1.5 py-0.5 rounded">
                <Clock className="h-2.5 w-2.5" />
                {formatTime(elapsedSeconds)}
              </span>
            )}
            <span className="text-primary font-black tabular-nums bg-primary/10 px-1.5 py-0.5 rounded">{overallProgress}%</span>
          </div>
        </div>
        <div className="h-3 rounded-full bg-secondary/50 p-0.5 overflow-hidden border border-border/50">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out relative group ${isComplete ? "bg-[hsl(var(--score-excellent))]" : "bg-primary"}`}
            style={{ width: `${overallProgress}%` }}
          >
            {/* Glow effect for progress bar */}
            <div className={`absolute inset-0 blur-md opacity-50 ${isComplete ? "bg-[hsl(var(--score-excellent))]" : "bg-primary"}`} />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Stage chips */}
      <div className="flex items-center gap-1">
        {STAGES.map((stage, i) => {
          const done = isComplete || i < currentStep;
          const active = !isComplete && i === currentStep;
          return (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                done ? "text-[hsl(var(--score-excellent))]" : active ? "text-primary bg-primary/10" : "text-muted-foreground/40"
              }`}>
                {done ? <CheckCircle2 className="h-3 w-3" /> : <stage.icon className="h-3 w-3" />}
                <span className="hidden sm:inline">{stage.label}</span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`h-px flex-1 ${done ? "bg-[hsl(var(--score-excellent))]/30" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Live analysis feed — no duplicates */}
      {currentStep === 1 && !isComplete && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Live Analysis</p>
            <p className="text-[10px] text-muted-foreground/50 tabular-nums">{completedPhases.size}/{ANALYSIS_PHASES.length} checks</p>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm divide-y divide-border/30 overflow-hidden shadow-sm">
            {visiblePhases.map(({ phase, index, status }) => {
              const Icon = phase.icon;
              return (
                <div
                  key={`p-${index}`}
                  className={`flex items-center gap-4 px-4 py-3.5 transition-all duration-300 ${
                    status === "active" ? "bg-primary/[0.03] scale-[1.005]" : status === "pending" ? "opacity-30 grayscale" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    {status === "done" ? (
                      <div className="h-5 w-5 rounded-full bg-[hsl(var(--score-excellent))]/10 flex items-center justify-center border border-[hsl(var(--score-excellent))]/20">
                        <CheckCircle2 className="h-3 w-3 text-[hsl(var(--score-excellent))]" />
                      </div>
                    ) : status === "active" ? (
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Loader2 className="h-3 w-3 text-primary animate-spin" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-border/50" />
                    )}
                  </div>
                  
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    status === "done" ? "bg-[hsl(var(--score-excellent))]/5" : status === "active" ? "bg-primary/5" : "bg-muted/30"
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      status === "done" ? "text-[hsl(var(--score-excellent))]" : status === "active" ? "text-primary" : "text-muted-foreground/40"
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] truncate tracking-tight ${
                      status === "active" ? "text-foreground font-bold" : "text-muted-foreground font-medium"
                    }`}>{phase.label}</p>
                    {status === "active" && (
                      <motion.p 
                        initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                        className="text-[11px] text-muted-foreground/70 mt-0.5 font-medium italic"
                      >
                        {phase.detail}
                      </motion.p>
                    )}
                  </div>
                  
                  {status === "active" && (
                    <div className="w-16 h-1 rounded-full bg-secondary overflow-hidden shrink-0 border border-border/30">
                      <div className="h-full rounded-full bg-primary transition-all duration-100" style={{ width: `${phaseProgress}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dot progress */}
          <div className="flex justify-center gap-0.5 pt-0.5">
            {ANALYSIS_PHASES.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  completedPhases.has(i) ? "w-1.5 bg-[hsl(var(--score-excellent))]/60" :
                  i === currentPhaseIndex ? "w-3 bg-primary" : "w-1 bg-muted-foreground/15"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completion */}
      {isComplete && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--score-excellent))]/10 border border-[hsl(var(--score-excellent))]/20">
          <CheckCircle2 className="h-5 w-5 text-[hsl(var(--score-excellent))] shrink-0" />
          <div>
            <p className="text-sm font-semibold">Analysis complete!</p>
            <p className="text-xs text-muted-foreground">Loading your detailed report…</p>
          </div>
        </div>
      )}

      {/* Long wait message */}
      {elapsedSeconds > 45 && currentStep === 1 && !isComplete && (
        <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2.5 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
            {elapsedSeconds > 90
              ? "Almost there — wrapping up deep analysis."
              : "Running 10 professional frameworks simultaneously. Quality takes a moment."
            }
          </span>
        </div>
      )}

      {/* Feature showcase — always visible during analysis */}
      {!isComplete && (
        <>
          <div className="border-t border-border pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
              What you'll unlock
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FEATURE_CATEGORIES.map((cat) => (
                <div key={cat.title} className={`rounded-xl border bg-gradient-to-br ${cat.color} p-3`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${cat.iconColor} mb-2`}>{cat.title}</p>
                  <div className="space-y-1.5">
                    {cat.features.map((f) => (
                      <div key={f.url} className="flex items-center gap-1.5">
                        <f.icon className={`h-3 w-3 ${cat.iconColor} shrink-0`} />
                        <span className="text-[11px] text-foreground/80 truncate">{f.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
