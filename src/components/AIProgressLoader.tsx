import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Brain, FileSearch, Wand2, CheckCircle2, Lightbulb } from "lucide-react";

const defaultSteps = [
  { label: "Reading your resume", icon: FileSearch, duration: 2500 },
  { label: "Analyzing content", icon: Brain, duration: 3000 },
  { label: "Generating insights", icon: Sparkles, duration: 3500 },
  { label: "Polishing output", icon: Wand2, duration: 2000 },
];

const funFacts = [
  "Recruiters spend ~7 seconds on a first resume scan",
  "Tailored resumes get 3× more callbacks",
  "92% of employers use ATS to filter applications",
  "Action verbs increase resume impact by 140%",
  "Adding metrics can boost interview rates by 40%",
  "The average job posting gets 250+ applications",
  "Networking fills 70% of all positions",
  "A strong LinkedIn profile gets 21× more views",
  "Most hiring managers prefer 1-page resumes",
  "Skills-based resumes are trending for career changers",
];

interface Props {
  loading: boolean;
  steps?: { label: string; icon?: any; duration?: number }[];
  context?: string; // e.g. "cover-letter", "bio", "interview"
  className?: string;
}

const contextSteps: Record<string, { label: string; icon: any; duration: number }[]> = {
  "cover-letter": [
    { label: "Analyzing your resume", icon: FileSearch, duration: 2000 },
    { label: "Matching to job requirements", icon: Brain, duration: 3000 },
    { label: "Crafting personalized letter", icon: Wand2, duration: 4000 },
    { label: "Finalizing tone & style", icon: Sparkles, duration: 2000 },
  ],
  bio: [
    { label: "Extracting key achievements", icon: FileSearch, duration: 2000 },
    { label: "Adapting for each platform", icon: Brain, duration: 3000 },
    { label: "Writing your bios", icon: Wand2, duration: 3000 },
    { label: "Optimizing character counts", icon: Sparkles, duration: 1500 },
  ],
  interview: [
    { label: "Reviewing your background", icon: FileSearch, duration: 2000 },
    { label: "Building question bank", icon: Brain, duration: 3000 },
    { label: "Preparing scenarios", icon: Lightbulb, duration: 3000 },
    { label: "Ready to practice", icon: Sparkles, duration: 1500 },
  ],
  analysis: [
    { label: "Parsing resume content", icon: FileSearch, duration: 2000 },
    { label: "Running AI analysis", icon: Brain, duration: 4000 },
    { label: "Scoring & benchmarking", icon: Sparkles, duration: 3000 },
    { label: "Preparing recommendations", icon: Wand2, duration: 2000 },
  ],
  outreach: [
    { label: "Understanding your profile", icon: FileSearch, duration: 2000 },
    { label: "Researching target context", icon: Brain, duration: 3000 },
    { label: "Drafting personalized content", icon: Wand2, duration: 3500 },
    { label: "Optimizing for engagement", icon: Sparkles, duration: 2000 },
  ],
  career: [
    { label: "Mapping your experience", icon: FileSearch, duration: 2000 },
    { label: "Analyzing career trajectory", icon: Brain, duration: 3500 },
    { label: "Identifying opportunities", icon: Lightbulb, duration: 3000 },
    { label: "Building your roadmap", icon: Wand2, duration: 2500 },
  ],
  salary: [
    { label: "Analyzing your profile", icon: FileSearch, duration: 2000 },
    { label: "Researching market data", icon: Brain, duration: 3500 },
    { label: "Building negotiation strategy", icon: Wand2, duration: 3000 },
    { label: "Preparing scripts", icon: Sparkles, duration: 2000 },
  ],
};

export default function AIProgressLoader({ loading, steps, context, className }: Props) {
  const resolvedSteps = steps || (context ? contextSteps[context] : null) || defaultSteps;
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * funFacts.length));
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(Date.now());

  // Step progression
  useEffect(() => {
    if (!loading) {
      setCurrentStep(0);
      setProgress(0);
      setElapsed(0);
      return;
    }
    startTime.current = Date.now();

    let totalDuration = 0;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    resolvedSteps.forEach((step, i) => {
      const dur = step.duration || 2500;
      timeouts.push(
        setTimeout(() => {
          setCurrentStep(i);
          // Animate progress to step percentage
          const stepProgress = ((i + 1) / resolvedSteps.length) * 85; // Max at 85% until done
          setProgress(stepProgress);
        }, totalDuration)
      );
      totalDuration += dur;
    });

    return () => timeouts.forEach(clearTimeout);
  }, [loading, resolvedSteps]);

  // Timer
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  // Rotate fun facts
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % funFacts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [loading]);

  // Complete animation
  useEffect(() => {
    if (!loading && progress > 0) {
      setProgress(100);
      setCurrentStep(resolvedSteps.length - 1);
    }
  }, [loading]);

  if (!loading) return null;

  const StepIcon = resolvedSteps[currentStep]?.icon || Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`rounded-xl border border-border bg-card p-6 space-y-5 ${className || ""}`}
    >
      {/* Header with animated icon */}
      <div className="flex items-center gap-3">
        <motion.div
          key={currentStep}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"
        >
          <StepIcon className="h-5 w-5 text-primary animate-pulse" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-sm font-semibold text-foreground"
            >
              {resolvedSteps[currentStep]?.label || "Processing..."}
            </motion.p>
          </AnimatePresence>
          <p className="text-[10px] text-muted-foreground">
            Step {currentStep + 1} of {resolvedSteps.length} · {elapsed}s elapsed
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{Math.round(progress)}%</span>
          <span>Almost there...</span>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex gap-1">
        {resolvedSteps.map((step, i) => {
          const Icon = step.icon || Sparkles;
          const isComplete = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <motion.div
              key={i}
              className={`flex-1 flex items-center gap-1.5 p-2 rounded-lg text-[10px] transition-colors ${
                isComplete
                  ? "bg-primary/10 text-primary"
                  : isCurrent
                  ? "bg-accent/50 text-foreground border border-border"
                  : "bg-muted/50 text-muted-foreground"
              }`}
              animate={isCurrent ? { scale: [1, 1.02, 1] } : {}}
              transition={isCurrent ? { repeat: Infinity, duration: 2 } : {}}
            >
              {isComplete ? (
                <CheckCircle2 className="h-3 w-3 shrink-0" />
              ) : (
                <Icon className={`h-3 w-3 shrink-0 ${isCurrent ? "animate-pulse" : ""}`} />
              )}
              <span className="truncate hidden sm:inline">{step.label.split(" ").slice(0, 2).join(" ")}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Fun fact */}
      <AnimatePresence mode="wait">
        <motion.div
          key={factIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50"
        >
          <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Did you know?</p>
            <p className="text-xs text-foreground mt-0.5">{funFacts[factIndex]}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
