import { useRef, useEffect } from "react";
import { motion } from "@/lib/motion-stub";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Mic, MicOff, Send, Volume2, VolumeX, X, Clock,
  User, Bot as BotIcon, CheckCircle2, AlertTriangle,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "interviewer" | "candidate";
  content: string;
  type?: "question" | "feedback" | "answer";
  feedback?: { feedback: string; score: number; strengths?: string[]; weaknesses?: string[] };
  timestamp?: number;
  wordCount?: number;
  wasVoice?: boolean;
}

interface ConversationModeProps {
  messages: Message[];
  loading: boolean;
  answer: string;
  setAnswer: (v: string) => void;
  questionCount: number;
  scores: number[];
  elapsedTime: number;
  isListening: boolean;
  isSpeaking: boolean;
  ttsEnabled: boolean;
  ttsSupported: boolean;
  voiceSupported: boolean;
  role: string;
  company: string;
  interviewType: string;
  silenceTimer: number;
  silenceThreshold: number;
  onSubmitAnswer: (isVoice: boolean) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onToggleTts: () => void;
  onStopSpeaking: () => void;
  onSwitchToVoice: () => void;
  onEnd: () => void;
}

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function AudioBars({ active, className }: { active: boolean; className?: string }) {
  return (
    <div className={cn("flex items-end gap-[2px] h-4", className)}>
      {[0, 1, 2, 3, 4].map(i => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-current"
          animate={active ? { height: [4, 12 + Math.random() * 4, 6, 14, 4] } : { height: 4 }}
          transition={active ? { duration: 0.6 + i * 0.1, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" } : { duration: 0.3 }}
        />
      ))}
    </div>
  );
}

export function ConversationMode({
  messages, loading, answer, setAnswer, questionCount, scores, elapsedTime,
  isListening, isSpeaking, ttsEnabled, ttsSupported, voiceSupported,
  role, company, interviewType, silenceTimer, silenceThreshold,
  onSubmitAnswer, onStartListening, onStopListening, onToggleTts, onStopSpeaking, onSwitchToVoice, onEnd,
}: ConversationModeProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const questions = messages.filter(m => m.type === "question");
  const silencePercent = silenceTimer > 0 ? Math.min((silenceTimer / silenceThreshold) * 100, 100) : 0;

  return (
    <div className="flex h-[calc(100vh-var(--header-height,64px))]">
      {/* ── LEFT SIDEBAR ── */}
      <div className="w-[280px] border-r flex flex-col bg-card/80 backdrop-blur-xl shrink-0 hidden md:flex">
        {/* Role badge */}
        <div className="px-5 pt-5 pb-4 border-b">
          <p className="text-[10px] uppercase tracking-widest text-primary font-semibold mb-1">{interviewType} Interview</p>
          <h3 className="font-display text-sm font-bold leading-tight">{role}</h3>
          {company && <p className="text-xs text-muted-foreground mt-0.5">{company}</p>}
        </div>

        {/* Progress ring + timer */}
        <div className="px-5 py-4 border-b">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" strokeWidth="3" className="stroke-border" />
                <circle
                  cx="32" cy="32" r="28" fill="none" strokeWidth="3" strokeLinecap="round"
                  className="stroke-primary"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - questionCount / 12)}
                  style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-lg font-bold tabular-nums">{questionCount}</span>
                <span className="text-[9px] text-muted-foreground">of 12</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Clock className="h-3 w-3" />
                <span className="tabular-nums font-medium">{formatTime(elapsedTime)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Question {questionCount} of 12</p>
            </div>
          </div>
        </div>

        {/* Score pills */}
        <div className="px-5 py-3 border-b">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-2">Scores</p>
          <div className="flex gap-1.5">
            {scores.map((s, i) => (
              <span key={i} className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                s >= 8 ? "bg-score-excellent/15 text-score-excellent"
                  : s >= 6 ? "bg-score-warning/15 text-score-warning"
                  : "bg-score-critical/15 text-score-critical"
              )}>{s}</span>
            ))}
            {Array.from({ length: 5 - scores.length }).map((_, i) => (
              <span key={`e-${i}`} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs text-muted-foreground/30">–</span>
            ))}
          </div>
        </div>

        {/* Interview Agenda */}
        <div className="flex-1 overflow-y-auto px-5 py-3 scrollbar-thin">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-3">Interview Agenda</p>
          <div className="space-y-1.5">
            {questions.map((q, i) => (
              <div key={i} className={cn(
                "flex items-start gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors",
                i === questions.length - 1 ? "bg-primary/10 text-primary" : "text-muted-foreground"
              )}>
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
                  i < questions.length - 1 ? "bg-score-excellent/20 text-score-excellent" : "bg-primary/20 text-primary"
                )}>{i + 1}</span>
                <span className="line-clamp-2 leading-relaxed">{q.content.substring(0, 80)}...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Switch to Voice Mode */}
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full gap-2 h-10 text-xs font-display font-semibold bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
            onClick={onSwitchToVoice}
          >
            <Headphones className="h-4 w-4" />
            Switch to Voice Mode
          </Button>
        </div>
      </div>

      {/* ── MAIN CHAT ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="h-11 border-b px-4 flex items-center justify-between bg-background/90 backdrop-blur-md shrink-0 md:hidden">
          <span className="text-xs text-muted-foreground font-medium">Q{questionCount}/12 · {formatTime(elapsedTime)}</span>
          <div className="flex items-center gap-2">
            {ttsSupported && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => { onToggleTts(); if (isSpeaking) onStopSpeaking(); }}>
                {ttsEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={onEnd}>
              <X className="h-3 w-3 mr-1" /> End
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={(questionCount / 12) * 100} className="h-0.5 rounded-none" />

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-0 scrollbar-thin">
          <div className="max-w-2xl mx-auto py-6 space-y-5">
            {messages.map((m, i) => {
              const isCandidate = m.role === "candidate";
              const isFeedback = m.type === "feedback";

              if (isCandidate) {
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end gap-3">
                    <div className="max-w-[80%]">
                      <div className="flex items-center gap-2 justify-end mb-1.5">
                        <span className="text-[10px] text-muted-foreground/50">{m.wordCount && `${m.wordCount}w`}{m.wasVoice && " · 🎤"}</span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">You</span>
                      </div>
                      <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-3 text-sm leading-relaxed">
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-6">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </motion.div>
                );
              }

              if (isFeedback && m.feedback) {
                return (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-3 justify-start">
                    <div className="w-8 h-8 shrink-0" />
                    <div className="max-w-[80%] rounded-xl border bg-card p-4 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs font-bold px-2.5 py-1 rounded-lg",
                          m.feedback.score >= 8 ? "bg-score-excellent/15 text-score-excellent"
                            : m.feedback.score >= 6 ? "bg-score-warning/15 text-score-warning"
                            : "bg-score-critical/15 text-score-critical"
                        )}>{m.feedback.score}/10</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Feedback</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{m.feedback.feedback}</p>
                      {m.feedback.strengths && m.feedback.strengths.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {m.feedback.strengths.map((s, si) => (
                            <span key={si} className="text-[10px] px-2 py-0.5 rounded-full bg-score-excellent/10 text-score-excellent flex items-center gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5" /> {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {m.feedback.weaknesses && m.feedback.weaknesses.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {m.feedback.weaknesses.map((w, wi) => (
                            <span key={wi} className="text-[10px] px-2 py-0.5 rounded-full bg-score-warning/10 text-score-warning flex items-center gap-1">
                              <AlertTriangle className="h-2.5 w-2.5" /> {w}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              }

              // Interviewer question
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0 mt-6">
                    <BotIcon className="h-3.5 w-3.5 text-accent-foreground" />
                  </div>
                  <div className="max-w-[80%]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Alex · Interviewer</span>
                      {isSpeaking && i === messages.length - 1 && <AudioBars active className="text-primary" />}
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-secondary border px-4 py-3 text-sm leading-relaxed">
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Loading indicator */}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <BotIcon className="h-3.5 w-3.5 text-accent-foreground" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-secondary border px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.span key={i} className="w-2 h-2 rounded-full bg-primary/40"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">Evaluating your response...</span>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Answer input bar */}
        {!loading && (
          <div className="border-t bg-background/95 backdrop-blur-md px-4 py-3 shrink-0">
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2 items-end">
                {voiceSupported && (
                  <Button
                    variant={isListening ? "destructive" : "outline"}
                    size="icon"
                    className={cn(
                      "h-10 w-10 rounded-xl shrink-0 transition-all",
                      isListening && "animate-pulse shadow-lg shadow-destructive/20"
                    )}
                    onClick={isListening ? onStopListening : onStartListening}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}
                <div className="flex-1 relative">
                  <Textarea
                    placeholder={isListening ? "🎤 Listening — speak your answer..." : "Type your answer here... (⌘+Enter to submit)"}
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    rows={1}
                    className={cn(
                      "text-sm min-h-[40px] max-h-[120px] resize-none pr-20 rounded-xl",
                      isListening && "ring-2 ring-destructive/30 border-destructive/20 bg-destructive/5"
                    )}
                    onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmitAnswer(isListening); }}
                    style={{ height: "auto", overflow: "auto" }}
                  />
                  <div className="absolute right-2 bottom-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground/40 tabular-nums">{answer.split(/\s+/).filter(Boolean).length}w</span>
                    <Button
                      size="icon"
                      className="h-7 w-7 rounded-lg"
                      onClick={() => onSubmitAnswer(isListening)}
                      disabled={!answer.trim()}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {isListening && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mt-2 px-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    <span className="text-[11px] text-destructive font-medium">Recording</span>
                    <AudioBars active className="text-destructive ml-1" />
                  </div>
                  {/* Silence indicator */}
                  {silenceTimer > 0 && answer.trim().length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-border overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-score-warning"
                          style={{ width: `${silencePercent}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {Math.ceil(silenceThreshold - silenceTimer)}s
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
