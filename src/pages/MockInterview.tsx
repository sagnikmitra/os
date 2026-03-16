import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  Loader2, Mic, Play, Volume2, Briefcase, Building2, Brain, Users,
  Sparkles, Target, MessageSquare, Headphones, FileText,
} from "lucide-react";
import ResumeSourceSelector from "@/components/ResumeSourceSelector";
import { useResumeSource } from "@/hooks/useResumeSource";
import { cn } from "@/lib/utils";

import { ConversationMode } from "@/components/interview/ConversationMode";
import { ImmersiveVoiceMode } from "@/components/interview/ImmersiveVoiceMode";
import { InterviewReport } from "@/components/interview/InterviewReport";
import { InterviewHistory } from "@/components/interview/InterviewHistory";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

interface Message {
  role: "interviewer" | "candidate";
  content: string;
  type?: "question" | "feedback" | "answer";
  feedback?: { feedback: string; score: number; strengths?: string[]; weaknesses?: string[] };
  timestamp?: number;
  wordCount?: number;
  wasVoice?: boolean;
}

interface FinalAnalysis {
  overallScore: number;
  verdict: string;
  summary: string;
  dimensions: { name: string; score: number; feedback: string }[];
  strengths: string[];
  improvements: string[];
  voiceAnalysis?: { pace: string; fillerWords: string; responseTime: string; overallDelivery: string };
  questionBreakdown: { questionNumber: number; score: number; highlight: string }[];
  nextSteps: string[];
}

const interviewTypes = [
  { id: "behavioral", label: "Behavioral", icon: Users, desc: "STAR-based questions", color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "technical", label: "Technical", icon: Brain, desc: "Skills & knowledge", color: "text-violet-500", bg: "bg-violet-500/10" },
  { id: "situational", label: "Situational", icon: Target, desc: "Hypothetical scenarios", color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "case-study", label: "Case Study", icon: Briefcase, desc: "Business problems", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "mixed", label: "Mixed", icon: Sparkles, desc: "All types combined", color: "text-primary", bg: "bg-primary/10" },
];

const FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "actually", "literally", "so", "well", "right"];
function countFillerWords(text: string): number {
  const lower = text.toLowerCase();
  return FILLER_WORDS.reduce((count, filler) => count + (lower.match(new RegExp(`\\b${filler}\\b`, "gi"))?.length || 0), 0);
}

// ─── SILENCE DETECTION CONFIG ───
const SILENCE_THRESHOLD = 4; // seconds of silence before auto-submit
const TOTAL_QUESTIONS = 12;

export default function MockInterview() {
  const { user } = useAuth();
  const resume = useResumeSource();
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [interviewType, setInterviewType] = useState("behavioral");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [finalAnalysis, setFinalAnalysis] = useState<FinalAnalysis | null>(null);
  const [analyzingFinal, setAnalyzingFinal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Interview mode
  const [interviewMode, setInterviewMode] = useState<"conversation" | "voice">("conversation");
  const [isPaused, setIsPaused] = useState(false);

  // Past session viewing
  const [viewingPastSession, setViewingPastSession] = useState<any>(null);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timerRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isPausedRef = useRef(false);
  const finishedRef = useRef(false);
  const loadingRef = useRef(false);

  // Silence detection
  const [silenceTimer, setSilenceTimer] = useState(0);
  const silenceIntervalRef = useRef<any>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const answerRef = useRef("");

  // Keep answerRef in sync
  useEffect(() => { answerRef.current = answer; }, [answer]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { finishedRef.current = finished; }, [finished]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  // Voice metrics
  const [voiceAnswerCount, setVoiceAnswerCount] = useState(0);
  const [totalWPM, setTotalWPM] = useState(0);
  const [totalFillerWords, setTotalFillerWords] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const lastQuestionTime = useRef<number>(Date.now());

  // Browser support check
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(!!SR);
    setTtsSupported(!!window.speechSynthesis);
    if (window.speechSynthesis) synthRef.current = window.speechSynthesis;
  }, []);

  // Timer
  useEffect(() => {
    if (started && !finished && !isPaused) {
      timerRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
    if (finished || isPaused) clearInterval(timerRef.current);
  }, [started, finished, isPaused]);

  // ─── TTS ───
  const speak = useCallback((text: string, audioDataUri?: string) => {
    if (!ttsEnabled) return;
    if (audioDataUri) {
      setIsSpeaking(true);
      const audio = new Audio(audioDataUri);
      (window as any).currentInterviewAudio = audio;
      audio.onended = () => { setIsSpeaking(false); lastQuestionTime.current = Date.now(); (window as any).currentInterviewAudio = null; };
      audio.onerror = () => { setIsSpeaking(false); fallbackSpeak(text); };
      audio.play().catch(() => { setIsSpeaking(false); fallbackSpeak(text); });
      return;
    }
    fallbackSpeak(text);
  }, [ttsEnabled]);

  const fallbackSpeak = useCallback((text: string) => {
    if (!synthRef.current) return;
    const clean = text.replace(/\*\*/g, "").replace(/---/g, "").replace(/#+\s/g, "").replace(/\n+/g, ". ");
    synthRef.current.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 0.95; u.pitch = 1;
    const voices = synthRef.current.getVoices();
    const pref = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en")) || voices.find(v => v.lang.startsWith("en"));
    if (pref) u.voice = pref;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => { setIsSpeaking(false); lastQuestionTime.current = Date.now(); };
    u.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(u);
  }, []);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    if ((window as any).currentInterviewAudio) {
      (window as any).currentInterviewAudio.pause();
      (window as any).currentInterviewAudio.currentTime = 0;
      (window as any).currentInterviewAudio = null;
    }
    setIsSpeaking(false);
  }, []);

  // ─── SPEECH RECOGNITION with silence tracking ───
  const startListening = useCallback(() => {
    if (loadingRef.current || finishedRef.current || isPausedRef.current) return;
    if (isListeningRef.current) return;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Speech recognition not supported"); return; }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 3; // Pick best of 3 alternatives for accuracy
    let finalTranscript = "";

    // Reset silence tracker on start
    lastSpeechTimeRef.current = Date.now();
    setSilenceTimer(0);

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          // Pick the alternative with highest confidence
          let bestAlt = event.results[i][0];
          for (let a = 1; a < event.results[i].length; a++) {
            if (event.results[i][a].confidence > bestAlt.confidence) {
              bestAlt = event.results[i][a];
            }
          }
          finalTranscript += bestAlt.transcript + " ";
        } else {
          interim = event.results[i][0].transcript;
        }
      }
      setAnswer(finalTranscript + interim);
      // Reset silence timer every time we get speech input
      lastSpeechTimeRef.current = Date.now();
      setSilenceTimer(0);
    };
    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        toast.error("Mic error: " + event.error);
      }
      // Don't set isListening false on "no-speech" — auto-restart handles it
      if (event.error !== "no-speech") {
        isListeningRef.current = false;
        setIsListening(false);
      }
    };
    // Auto-restart: Chrome kills recognition after ~60s of silence
    recognition.onend = () => {
      if (
        recognitionRef.current === recognition &&
        isListeningRef.current &&
        !isPausedRef.current &&
        !finishedRef.current &&
        !loadingRef.current
      ) {
        try {
          recognition.start();
        } catch {
          recognitionRef.current = null;
          isListeningRef.current = false;
          setIsListening(false);
        }
      } else {
        recognitionRef.current = null;
        isListeningRef.current = false;
        setIsListening(false);
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
    isListeningRef.current = true;
    setIsListening(true);
    stopSpeaking();
  }, [stopSpeaking]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    isListeningRef.current = false;
    if (recognition) {
      recognition.onend = null;
      try { recognition.stop(); } catch {}
    }
    setIsListening(false);
    setSilenceTimer(0);
    clearInterval(silenceIntervalRef.current);
  }, []);

  // ─── AUTO-START MIC when AI finishes speaking ───
  const wasSpeakingRef = useRef(false);
  useEffect(() => {
    if (wasSpeakingRef.current && !isSpeaking && started && !finished && !loading && !isPaused && voiceSupported) {
      // AI just finished speaking → auto-start mic after a short delay
      const timeout = setTimeout(() => {
        if (!isListeningRef.current && !loadingRef.current && !isPausedRef.current) startListening();
      }, 500);
      return () => clearTimeout(timeout);
    }
    wasSpeakingRef.current = isSpeaking;
  }, [isSpeaking, started, finished, loading, isPaused, voiceSupported, startListening]);

  // Also auto-start mic when TTS is disabled but a new question arrives
  useEffect(() => {
    if (started && !finished && !isPaused && !ttsEnabled && !isListening && !isSpeaking && !loading && voiceSupported && questionCount > 0) {
      const timeout = setTimeout(() => startListening(), 800);
      return () => clearTimeout(timeout);
    }
  }, [questionCount, started, finished, isPaused, ttsEnabled, isListening, isSpeaking, loading, voiceSupported, startListening]);

  // ─── SILENCE DETECTION ───
  useEffect(() => {
    if (isListening && !loading && !finished && !isPaused && answerRef.current.trim().length > 0) {
      silenceIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - lastSpeechTimeRef.current) / 1000;
        setSilenceTimer(elapsed);

        if (elapsed >= SILENCE_THRESHOLD && answerRef.current.trim().length > 20) {
          clearInterval(silenceIntervalRef.current);
          setSilenceTimer(0);
          submitAnswer(true);
        }
      }, 200);

      return () => clearInterval(silenceIntervalRef.current);
    } else {
      clearInterval(silenceIntervalRef.current);
      setSilenceTimer(0);
    }
  }, [isListening, answer, loading, finished, isPaused]);

  // ─── ACTIONS ───
  const startInterview = async () => {
    if (!role.trim()) { toast.error("Enter a role"); return; }
    setLoading(true);
    try {
      const resumeData = resume.getResumeData();
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: { action: "start", role, company, interviewType, resumeData, jobDescription: jobDescription.trim() || undefined },
      });
      if (error) throw error;
      if (!data?.question || typeof data.question !== "string") {
        throw new Error(data?.error || "Could not start interview. Please try again.");
      }
      setMessages([{ role: "interviewer", content: data.question, type: "question", timestamp: Date.now() }]);
      setStarted(true);
      setQuestionCount(1);
      setElapsedTime(0);
      lastQuestionTime.current = Date.now();
      setTimeout(() => speak(data.question, data.audio_data), 300);
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  const submitAnswer = async (isVoice = false) => {
    const currentAnswer = answerRef.current;
    if (!currentAnswer.trim()) return;
    if (currentAnswer.trim().length < 10) {
      toast.error("Your answer is too short — try to provide a more detailed response.");
      return;
    }
    setLoading(true);
    stopListening();
    const responseTime = (Date.now() - lastQuestionTime.current) / 1000;
    const words = currentAnswer.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const wpm = responseTime > 0 ? Math.round((wordCount / responseTime) * 60) : 0;
    const fillers = countFillerWords(currentAnswer);

    if (isVoice || voiceAnswerCount > 0) {
      setVoiceAnswerCount(prev => prev + 1);
      setTotalWPM(prev => prev + wpm);
      setTotalFillerWords(prev => prev + fillers);
      setResponseTimes(prev => [...prev, responseTime]);
    }

    const newMessages: Message[] = [
      ...messages,
      { role: "candidate", content: currentAnswer, type: "answer", timestamp: Date.now(), wordCount, wasVoice: isVoice || isListening },
    ];
    setMessages(newMessages);
    setAnswer("");

    try {
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: { action: "answer", role, company, interviewType, conversation: newMessages.map(m => ({ role: m.role, content: m.content })), questionNumber: questionCount, jobDescription: jobDescription.trim() || undefined },
      });
      if (error) throw error;
      const feedback = data?.feedback;
      if (!feedback || typeof feedback !== "object") {
        throw new Error(data?.error || "Invalid interview response. Please retry.");
      }
      if (feedback?.score) setScores(prev => [...prev, feedback.score]);

      if (data.finished) {
        setMessages(prev => [...prev, {
          role: "interviewer", content: feedback?.feedback || "Thank you for completing the interview!",
          type: "feedback", feedback, timestamp: Date.now(),
        }]);
        setFinished(true);
        runFinalAnalysis(newMessages, feedback);
      } else {
        setMessages(prev => [
          ...prev,
          { role: "interviewer", content: feedback?.feedback || "", type: "feedback", feedback, timestamp: Date.now() },
          { role: "interviewer", content: data?.question || "Let’s continue with the next question.", type: "question", timestamp: Date.now() },
        ]);
        setQuestionCount(prev => prev + 1);
        lastQuestionTime.current = Date.now();
        setTimeout(() => speak(data?.question || "Let’s continue with the next question.", data?.audio_data), 500);
      }
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  const runFinalAnalysis = async (conv: Message[], _lastFeedback: any) => {
    setAnalyzingFinal(true);
    try {
      const voiceMetrics = voiceAnswerCount > 0 ? {
        avgWPM: Math.round(totalWPM / Math.max(voiceAnswerCount, 1)),
        fillerCount: totalFillerWords,
        avgResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / Math.max(responseTimes.length, 1)),
        longestPause: Math.round(Math.max(...responseTimes, 0)),
      } : null;
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: { action: "final-analysis", role, company, interviewType, conversation: conv.map(m => ({ role: m.role, content: m.content })), questionNumber: questionCount, voiceMetrics, jobDescription: jobDescription.trim() || undefined },
      });
      if (error) throw error;
      if (!data || typeof data !== "object" || typeof (data as any).overallScore !== "number") {
        throw new Error("Invalid final analysis payload");
      }
      setFinalAnalysis(data as FinalAnalysis);

      // ── Save session to database ──
      try {
        if (user) {
          await supabase.from("mock_interview_sessions" as any).insert({
            user_id: user.id,
            resume_id: resume.selectedResumeId || null,
            role,
            company: company || null,
            interview_type: interviewType,
            job_description: jobDescription.trim() || null,
            transcript: conv.map(m => ({ role: m.role, content: m.content, type: m.type })),
            analysis: data,
            scores,
            overall_score: (data as any).overallScore || null,
            verdict: (data as any).verdict || null,
            voice_metrics: voiceMetrics,
            duration_seconds: elapsedTime,
            question_count: questionCount,
          });
        }
      } catch (saveErr) {
        console.error("Failed to save interview session:", saveErr);
      }
    } catch (e: any) {
      console.error("Final analysis failed:", e);
      toast.error("Could not generate final analysis");
    } finally { setAnalyzingFinal(false); }
  };

  const reset = () => {
    stopSpeaking(); stopListening();
    setStarted(false); setMessages([]); setQuestionCount(0); setScores([]);
    setFinished(false); setFinalAnalysis(null); setVoiceAnswerCount(0);
    setTotalWPM(0); setTotalFillerWords(0); setResponseTimes([]);
    setElapsedTime(0); setInterviewMode("conversation"); setIsPaused(false); setJobDescription("");
    setSilenceTimer(0); setViewingPastSession(null);
  };

  const endInterview = () => {
    stopListening();
    stopSpeaking();
    if (!finished && messages.length > 0) {
      setFinished(true);
      runFinalAnalysis(messages, null);
    }
  };

  const togglePause = () => {
    if (!isPaused) {
      stopListening();
      stopSpeaking();
    }
    setIsPaused(prev => !prev);
  };

  const currentQuestionText = [...messages].reverse().find(m => m.type === "question")?.content || "";

  // ════════════════════════════════════════════
  // SCREEN ROUTING
  // ════════════════════════════════════════════

  // ── VIEWING PAST SESSION REPORT ──
  if (viewingPastSession) {
    const pastTranscript = (viewingPastSession.transcript || []).map((m: any) => ({
      ...m,
      highlight: m.type === "feedback" ? null : null,
    }));

    function capitalizeType(s: string) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    }

    return (
      <AppLayout title="Mock Interview" subtitle="Past Interview Report">
        <InterviewReport
          analysis={viewingPastSession.analysis}
          transcript={pastTranscript}
          voiceAnswerCount={viewingPastSession.voice_metrics ? 1 : 0}
          role={viewingPastSession.role}
          company={viewingPastSession.company || ""}
          interviewType={viewingPastSession.interview_type}
          onReset={() => setViewingPastSession(null)}
        />
      </AppLayout>
    );
  }

  // ── SETUP ──
  if (!started) {
    return (
      <AppLayout title="Mock Interview" subtitle="AI-powered interview simulation">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
          <motion.div {...fade(0)}>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1">Interview Simulator</h1>
            <p className="text-sm text-muted-foreground">Practice with a realistic AI interviewer. Choose your mode — conversation or immersive voice.</p>
          </motion.div>

          <motion.div {...fade(1)} className="rounded-2xl border bg-card p-5 sm:p-6 space-y-5">
            <ResumeSourceSelector {...resume} textareaRows={3} />

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Target Role <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g., Senior Software Engineer" value={role} onChange={e => setRole(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Company <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="e.g., Google" value={company} onChange={e => setCompany(e.target.value)} className="pl-9 h-10" />
                </div>
              </div>
            </div>

            {/* JD Paste (optional) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-muted-foreground" />
                Job Description <span className="text-muted-foreground font-normal">(optional — for tailored questions)</span>
              </Label>
              <Textarea
                placeholder="Paste the job description here to get interview questions tailored to the specific role requirements..."
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                rows={3}
                className="text-sm resize-none"
              />
              {jobDescription.trim() && (
                <p className="text-[10px] text-score-excellent flex items-center gap-1">✓ JD loaded — questions will be tailored to this role</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Interview Style</Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {interviewTypes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setInterviewType(t.id)}
                    className={cn(
                      "rounded-xl border p-3 text-center transition-all hover:shadow-sm",
                      interviewType === t.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                        : "bg-card hover:bg-secondary/30"
                    )}
                  >
                    <div className={cn("h-8 w-8 rounded-lg mx-auto mb-2 flex items-center justify-center", interviewType === t.id ? "bg-primary/10" : t.bg)}>
                      <t.icon className={cn("h-4 w-4", interviewType === t.id ? "text-primary" : t.color)} />
                    </div>
                    <p className="text-[11px] font-semibold">{t.label}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode selector */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Interview Mode</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setInterviewMode("conversation")}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all",
                    interviewMode === "conversation"
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "bg-card hover:bg-secondary/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", interviewMode === "conversation" ? "bg-primary/15" : "bg-secondary")}>
                      <MessageSquare className={cn("h-4 w-4", interviewMode === "conversation" ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <p className="font-display text-sm font-semibold">Conversation</p>
                      <p className="text-[10px] text-muted-foreground">Chat interface with sidebar</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setInterviewMode("voice")}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all",
                    interviewMode === "voice"
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "bg-card hover:bg-secondary/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", interviewMode === "voice" ? "bg-primary/15" : "bg-secondary")}>
                      <Headphones className={cn("h-4 w-4", interviewMode === "voice" ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <p className="font-display text-sm font-semibold">Immersive Voice</p>
                      <p className="text-[10px] text-muted-foreground">Full-screen simulation</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Voice info */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 text-xs">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Volume2 className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Smart voice detection</p>
                <p className="text-muted-foreground mt-0.5">
                  The AI detects when you stop speaking and auto-submits after {SILENCE_THRESHOLD}s of silence. No need to manually stop.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-[11px] text-muted-foreground">12 questions · Scored per answer · Detailed analysis</p>
              <Button size="lg" className="gap-2 px-6" onClick={startInterview} disabled={loading || !role.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {loading ? "Starting..." : "Begin Interview"}
              </Button>
            </div>
          </motion.div>

          {/* ── INTERVIEW HISTORY ── */}
          <motion.div {...fade(2)}>
            <InterviewHistory
              resumeId={resume.selectedResumeId}
              onViewReport={(session) => setViewingPastSession(session)}
            />
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  // ── POST-INTERVIEW REPORT ──
  if (finished) {
    if (analyzingFinal) {
      return (
        <AppLayout title="Mock Interview" subtitle="Generating your report">
          <div className="flex items-center justify-center py-32">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <motion.div className="absolute inset-0 rounded-full border-2 border-primary/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  style={{ borderTopColor: "hsl(var(--primary))" }}
                />
                <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Analyzing your interview performance...</p>
              <p className="text-xs text-muted-foreground/50">Generating comprehensive report</p>
            </motion.div>
          </div>
        </AppLayout>
      );
    }

    if (finalAnalysis) {
      const transcriptEntries = messages.map(m => ({
        ...m,
        highlight: m.feedback
          ? (m.feedback.score >= 8 ? "excellent" as const : m.feedback.score < 5 ? "missed" as const : "needs-work" as const)
          : null,
        coachingNote: m.feedback?.weaknesses?.length
          ? `💡 ${m.feedback.weaknesses[0]}`
          : undefined,
      }));

      return (
        <AppLayout title="Mock Interview" subtitle="Interview Report">
          <InterviewReport
            analysis={finalAnalysis}
            transcript={transcriptEntries}
            voiceAnswerCount={voiceAnswerCount}
            role={role}
            company={company}
            interviewType={interviewType}
            onReset={reset}
          />
        </AppLayout>
      );
    }

    return (
      <AppLayout title="Mock Interview" subtitle="Complete">
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <p className="font-display text-2xl font-bold">Interview Complete!</p>
            <Button onClick={reset} className="gap-2"><Loader2 className="h-4 w-4" /> Start New</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── IMMERSIVE VOICE MODE (full-screen overlay — no AppLayout since it's immersive) ──
  if (interviewMode === "voice") {
    return (
      <ImmersiveVoiceMode
        questionCount={questionCount}
        elapsedTime={elapsedTime}
        currentQuestion={currentQuestionText}
        answer={answer}
        isSpeaking={isSpeaking}
        isListening={isListening}
        isPaused={isPaused}
        loading={loading}
        silenceTimer={silenceTimer}
        silenceThreshold={SILENCE_THRESHOLD}
        onToggleMic={() => isListening ? stopListening() : startListening()}
        onTogglePause={togglePause}
        onEnd={endInterview}
        onSwitchToChat={() => setInterviewMode("conversation")}
      />
    );
  }

  // ── CONVERSATION MODE (inside AppLayout for proper navigation) ──
  return (
    <AppLayout title="Mock Interview" subtitle={`${interviewType} · ${role}`}>
      <ConversationMode
        messages={messages}
        loading={loading}
        answer={answer}
        setAnswer={setAnswer}
        questionCount={questionCount}
        scores={scores}
        elapsedTime={elapsedTime}
        isListening={isListening}
        isSpeaking={isSpeaking}
        ttsEnabled={ttsEnabled}
        ttsSupported={ttsSupported}
        voiceSupported={voiceSupported}
        role={role}
        company={company}
        interviewType={interviewType}
        silenceTimer={silenceTimer}
        silenceThreshold={SILENCE_THRESHOLD}
        onSubmitAnswer={submitAnswer}
        onStartListening={startListening}
        onStopListening={stopListening}
        onToggleTts={() => { setTtsEnabled(!ttsEnabled); if (isSpeaking) stopSpeaking(); }}
        onStopSpeaking={stopSpeaking}
        onSwitchToVoice={() => setInterviewMode("voice")}
        onEnd={endInterview}
      />
    </AppLayout>
  );
}
