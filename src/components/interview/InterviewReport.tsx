import { motion } from "@/lib/motion-stub";
import { Button } from "@/components/ui/button";
import {
  RotateCcw, ArrowRight, Target, MessageSquare as MsgSq,
  Mic, Users, TrendingUp, CheckCircle2, Zap, AlertTriangle,
  Brain, Volume2, Clock, Download,
} from "lucide-react";
import { TranscriptViewer } from "./TranscriptViewer";
import { cn } from "@/lib/utils";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface Dimension { name: string; score: number; feedback: string; }
interface VoiceAnalysis { pace: string; fillerWords: string; responseTime: string; overallDelivery: string; }
interface QuestionBreakdown { questionNumber: number; score: number; highlight: string; }

interface FinalAnalysis {
  overallScore: number;
  verdict: string;
  summary: string;
  dimensions: Dimension[];
  strengths: string[];
  improvements: string[];
  voiceAnalysis?: VoiceAnalysis;
  questionBreakdown?: QuestionBreakdown[];
  nextSteps: string[];
}

interface TranscriptEntry {
  role: "interviewer" | "candidate";
  content: string;
  type?: "question" | "feedback" | "answer";
  timestamp?: number;
  highlight?: "excellent" | "needs-work" | "missed" | null;
  coachingNote?: string;
  wordCount?: number;
}

interface InterviewReportProps {
  analysis: FinalAnalysis;
  transcript: TranscriptEntry[];
  voiceAnswerCount: number;
  role: string;
  company: string;
  interviewType: string;
  onReset: () => void;
}

const pillarIcons: Record<string, typeof Target> = {
  "Communication Clarity": MsgSq,
  "Technical Depth": Brain,
  "Relevance & Structure": Target,
  "Confidence & Delivery": Volume2,
  "Handling Pushback": Users,
};

function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth="8" className="stroke-border" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth="8" strokeLinecap="round"
          className={cn(score >= 80 ? "stroke-score-excellent" : score >= 60 ? "stroke-score-warning" : "stroke-score-critical")}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-display text-4xl font-bold tabular-nums"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >{score}</motion.span>
        <span className="text-xs text-muted-foreground -mt-0.5">/100</span>
      </div>
    </div>
  );
}

function MiniScore({ label, score, icon: Icon }: { label: string; score: number; icon: typeof Target }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-4 flex flex-col items-center gap-2.5 text-center min-w-[120px]"
    >
      <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-display text-2xl font-bold tabular-nums">{score}<span className="text-xs text-muted-foreground font-normal">/100</span></p>
        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium leading-tight">{label}</p>
      </div>
    </motion.div>
  );
}

export function InterviewReport({
  analysis, transcript, voiceAnswerCount, role, company, interviewType, onReset,
}: InterviewReportProps) {
  const verdictColor = analysis.verdict === "Exceptional" || analysis.verdict === "Strong"
    ? "text-score-excellent" : analysis.verdict === "Promising"
    ? "text-score-warning" : "text-score-critical";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">

      {/* ═══════ EXECUTIVE SUMMARY ═══════ */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2 mb-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">Interview Complete</p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{capitalize(interviewType)} Interview Report</h2>
        <p className="text-sm text-muted-foreground">{role}{company ? ` at ${company}` : ""}</p>
      </motion.div>

      {/* Score + Pillars */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl border bg-card p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="flex flex-col items-center gap-3">
            <ScoreRing score={analysis.overallScore} />
            <span className={cn("font-display text-sm font-bold", verdictColor)}>{analysis.verdict}</span>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {analysis.dimensions.map((d, i) => {
                const Icon = pillarIcons[d.name] || Target;
                return <MiniScore key={i} label={d.name} score={d.score} icon={Icon} />;
              })}
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1.5">AI Summary</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
        </div>
      </motion.div>

      {/* ═══════ DIMENSION DETAILS ═══════ */}
      <div className="grid sm:grid-cols-2 gap-4">
        {analysis.dimensions.map((d, i) => {
          const Icon = pillarIcons[d.name] || Target;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
              className="rounded-xl border bg-card p-5"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-xs font-semibold">{d.name}</h4>
                </div>
                <span className="font-display text-lg font-bold tabular-nums">{d.score}</span>
              </div>
              <div className="h-1.5 rounded-full bg-border mb-3">
                <motion.div
                  className={cn("h-full rounded-full", d.score >= 80 ? "bg-score-excellent" : d.score >= 60 ? "bg-score-warning" : "bg-score-critical")}
                  initial={{ width: 0 }}
                  animate={{ width: `${d.score}%` }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{d.feedback}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ═══════ STRENGTHS & LEVEL-UPS ═══════ */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-score-excellent/20 bg-score-excellent/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-score-excellent" />
            <h4 className="font-display text-sm font-semibold text-score-excellent">Top Strengths</h4>
          </div>
          <ul className="space-y-2.5">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                <span className="h-1.5 w-1.5 rounded-full bg-score-excellent mt-1.5 shrink-0" /> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-score-warning/20 bg-score-warning/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-score-warning" />
            <h4 className="font-display text-sm font-semibold text-score-warning">Level-Ups</h4>
          </div>
          <ul className="space-y-2.5">
            {analysis.improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                <span className="h-1.5 w-1.5 rounded-full bg-score-warning mt-1.5 shrink-0" /> {s}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* ═══════ VOICE ANALYSIS ═══════ */}
      {analysis.voiceAnalysis && voiceAnswerCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-xl border bg-card p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" />
            <h4 className="font-display text-sm font-semibold">Vocal Delivery Analysis</h4>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Speaking Pace", value: analysis.voiceAnalysis.pace, icon: Clock },
              { label: "Filler Words", value: analysis.voiceAnalysis.fillerWords, icon: AlertTriangle },
              { label: "Response Time", value: analysis.voiceAnalysis.responseTime, icon: Zap },
              { label: "Overall Delivery", value: analysis.voiceAnalysis.overallDelivery, icon: Volume2 },
            ].map((item, i) => (
              <div key={i} className="rounded-lg bg-secondary/50 border p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className="h-3.5 w-3.5 text-primary/60" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{item.label}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══════ QUESTION BREAKDOWN ═══════ */}
      {analysis.questionBreakdown && analysis.questionBreakdown.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="rounded-xl border bg-card p-5 space-y-3"
        >
          <h4 className="font-display text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Question-by-Question Breakdown
          </h4>
          <div className="space-y-2">
            {analysis.questionBreakdown.map((q, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary/50 border">
                <span className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                  q.score >= 8 ? "bg-score-excellent/15 text-score-excellent"
                    : q.score >= 6 ? "bg-score-warning/15 text-score-warning"
                    : "bg-score-critical/15 text-score-critical"
                )}>{q.score}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground font-medium">Question {q.questionNumber}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{q.highlight}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══════ NEXT STEPS ═══════ */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="rounded-xl border border-primary/10 bg-primary/5 p-5 space-y-3"
      >
        <div className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-primary" />
          <h4 className="font-display text-sm font-semibold text-primary">Recommended Next Steps</h4>
        </div>
        <ul className="space-y-2.5">
          {analysis.nextSteps.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
              <span className="text-primary font-bold tabular-nums shrink-0">{i + 1}.</span> {s}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* ═══════ SMART TRANSCRIPT ═══════ */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
        <TranscriptViewer entries={transcript} />
      </motion.div>

      {/* ═══════ ACTIONS ═══════ */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="flex items-center justify-center gap-3 pb-8 print:hidden"
      >
        <Button variant="outline" onClick={() => window.print()} className="gap-2 px-6 h-11 font-semibold rounded-xl">
          <Download className="h-4 w-4" /> Download PDF
        </Button>
        <Button onClick={onReset} className="gap-2 px-8 h-11 font-semibold rounded-xl">
          <RotateCcw className="h-4 w-4" /> Practice Again
        </Button>
      </motion.div>

      {/* Print-only footer — appears at bottom of every PDF page */}
      <div className="print-footer">Built by Sagnik · sgnk CareerOS</div>
    </div>
  );
}
