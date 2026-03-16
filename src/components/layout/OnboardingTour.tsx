import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Upload, Shield, Briefcase, GraduationCap, Mail, TrendingUp, Hammer,
  ArrowRight, ArrowLeft, X, Sparkles, ChevronRight, Building2, DollarSign, Mic,
  Settings, Layers, HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOUR_KEY = "sgnk_tour_completed";

interface TourStep {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  features: { name: string; desc: string; url: string }[];
}

const tourSteps: TourStep[] = [
  {
    title: "Resume Intelligence",
    description: "Upload your resume and get deep AI analysis across 9 dimensions — ATS, content, structure, recruiter readability, and more.",
    icon: Upload,
    color: "from-blue-500 to-indigo-600",
    features: [
      { name: "Upload & Analyze", desc: "9-dimension AI scoring in seconds", url: "/upload" },
      { name: "Resume Builder", desc: "10 templates, 5 editing modes", url: "/builder" },
      { name: "My Resumes", desc: "Version control, tags & sharing", url: "/my-resumes" },
    ],
  },
  {
    title: "Deep Analysis Suite",
    description: "Drill into each dimension — ATS compatibility, recruiter view simulation, content quality, AI detection, and a fix roadmap.",
    icon: Shield,
    color: "from-emerald-500 to-teal-600",
    features: [
      { name: "ATS Score", desc: "Enterprise system compatibility", url: "/ats" },
      { name: "Recruiter View", desc: "6-second scan simulation", url: "/recruiter" },
      { name: "Humanizer", desc: "AI-detection & authenticity", url: "/humanizer" },
      { name: "Full Report", desc: "PDF report across all dimensions", url: "/reports" },
    ],
  },
  {
    title: "Job Search & Matching",
    description: "Find AI-matched jobs, set up alerts, track applications with a Kanban board, and tailor your resume to specific JDs.",
    icon: Briefcase,
    color: "from-blue-500 to-sky-600",
    features: [
      { name: "Jobs For You", desc: "AI-matched opportunities", url: "/jobs-for-you" },
      { name: "App Tracker", desc: "Kanban application pipeline", url: "/application-tracker" },
      { name: "JD Tailoring", desc: "Auto-tailor to job descriptions", url: "/jd-tailor" },
    ],
  },
  {
    title: "Research & Strategy",
    description: "Research target companies, get market intelligence, and build a strategic roadmap to land your dream role.",
    icon: Building2,
    color: "from-cyan-500 to-teal-600",
    features: [
      { name: "Company Intel", desc: "Culture, ratings & interview tips", url: "/company-research" },
      { name: "Market Digest", desc: "Industry trends & hot skills", url: "/market-digest" },
      { name: "Job Roadmap", desc: "30/60/90-day action plan", url: "/job-getting-roadmap" },
    ],
  },
  {
    title: "Interview & Salary",
    description: "Practice with AI mock interviews, build STAR stories, benchmark salaries, and compare offers side by side.",
    icon: Mic,
    color: "from-amber-500 to-orange-600",
    features: [
      { name: "Mock Interview", desc: "AI-powered practice sessions", url: "/mock-interview" },
      { name: "STAR Builder", desc: "Behavioral answer framework", url: "/star-builder" },
      { name: "Salary Data", desc: "Market benchmarks by role", url: "/salary-benchmark" },
      { name: "Offer Compare", desc: "Side-by-side TC analysis", url: "/offer-comparison" },
    ],
  },
  {
    title: "Outreach & Documents",
    description: "Generate cover letters, follow-up emails, thank you notes, elevator pitches, cold emails, and reference letters — all AI-powered.",
    icon: Mail,
    color: "from-rose-500 to-pink-600",
    features: [
      { name: "Cover Letter", desc: "Tailored to each job", url: "/cover-letter" },
      { name: "Follow-Up Email", desc: "Post-interview follow-ups", url: "/follow-up-email" },
      { name: "Cold Email A/B", desc: "Open-rate predictions", url: "/cold-email" },
      { name: "Referral Map", desc: "Network path finder", url: "/referral-mapper" },
    ],
  },
  {
    title: "Career Growth",
    description: "Visualize career paths, identify skill gaps, optimize LinkedIn, build your personal brand, and get a personalized learning roadmap.",
    icon: TrendingUp,
    color: "from-orange-500 to-amber-600",
    features: [
      { name: "Career Path", desc: "Visualize trajectories", url: "/career-path" },
      { name: "Skill Gap Map", desc: "Skills vs market demand", url: "/skill-gap" },
      { name: "LinkedIn", desc: "Profile optimization", url: "/linkedin-optimizer" },
      { name: "Learning Path", desc: "Curated courses & certs", url: "/learning-roadmap" },
    ],
  },
  {
    title: "System & More",
    description: "Export in multiple formats, track analytics, browse HR contacts, manage settings, and access the full help guide anytime.",
    icon: Settings,
    color: "from-slate-500 to-zinc-600",
    features: [
      { name: "Export Center", desc: "PDF, DOCX, LaTeX, JSON", url: "/export" },
      { name: "Portfolios", desc: "Build & publish websites", url: "/portfolios" },
      { name: "Help Guide", desc: "All 50+ features explained", url: "/help" },
    ],
  },
];

export function OnboardingTour() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_KEY);
    if (!completed) {
      const t = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  // Listen for manual tour trigger
  useEffect(() => {
    const handler = () => {
      setStep(0);
      setShow(true);
    };
    window.addEventListener("sgnk-replay-tour", handler);
    return () => window.removeEventListener("sgnk-replay-tour", handler);
  }, []);

  const complete = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "true");
    setShow(false);
  }, []);

  const next = useCallback(() => {
    if (step < tourSteps.length - 1) setStep((s) => s + 1);
    else complete();
  }, [step, complete]);

  const prev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  const goTo = useCallback((url: string) => {
    complete();
    navigate(url);
  }, [complete, navigate]);

  if (!show) return null;

  const current = tourSteps[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-lg rounded-2xl border bg-card shadow-2xl overflow-hidden"
        >
          {/* Header gradient */}
          <div className={cn("h-1.5 bg-gradient-to-r", current.color)} />

          <div className="p-6">
            {/* Progress + Close */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                {tourSteps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-primary/40" : "w-3 bg-border"
                    )}
                  />
                ))}
              </div>
              <button
                onClick={complete}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg", current.color)}>
                    <current.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                      {step + 1} of {tourSteps.length}
                    </p>
                    <h2 className="font-display text-lg font-bold tracking-tight">{current.title}</h2>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{current.description}</p>

                {/* Feature links */}
                <div className="space-y-2 mb-6">
                  {current.features.map((f) => (
                    <button
                      key={f.url}
                      onClick={() => goTo(f.url)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border bg-secondary/30 hover:bg-secondary/60 hover:border-primary/20 transition-all text-left group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{f.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={prev}
                disabled={step === 0}
                className="gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={complete} className="text-muted-foreground">
                  Skip tour
                </Button>
                <Button size="sm" onClick={next} className="gap-1.5">
                  {step === tourSteps.length - 1 ? (
                    <>Get Started <Sparkles className="h-3.5 w-3.5" /></>
                  ) : (
                    <>Next <ArrowRight className="h-3.5 w-3.5" /></>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/** Reset tour so it shows again */
export function resetTour() {
  localStorage.removeItem(TOUR_KEY);
  window.dispatchEvent(new Event("sgnk-replay-tour"));
}
