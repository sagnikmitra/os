import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Loader2, Wand2, ChevronDown, ChevronUp, Lightbulb, AlertTriangle,
  Clock, Target, BookOpen, Brain, Users, Briefcase, Sparkles, Star,
  CheckCircle2, XCircle, MessageSquare, Shield, Crosshair, ShieldAlert,
  Code, HelpCircle, Route, Mic, Timer, BarChart3, Zap, Send,
  Award, TrendingUp, Eye, EyeOff, Play, Pause, RotateCcw,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAnalysis } from "@/context/AnalysisContext";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

interface SampleAnswer {
  framework: string;
  keyPoints: string[];
  openingLine: string;
  pitfalls: string[];
}

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  resumeSection: string;
  whyAsked: string;
  followUps: string[];
  sampleAnswer: SampleAnswer;
  tips: string;
}

interface StoryBank {
  title: string;
  situation: string;
  versatility: string;
}

interface OverallAdvice {
  strengths: string[];
  gaps: string[];
  storyBank: StoryBank[];
}

interface PrepData {
  questions: InterviewQuestion[];
  overallAdvice: OverallAdvice;
}

interface AnswerEvaluation {
  overall_score: number;
  grade: string;
  dimensions: { name: string; score: number; feedback: string }[];
  strengths: string[];
  improvements: string[];
  rewritten_answer: string;
  missing_elements: string[];
  body_language_tips: string[];
  time_estimate: string;
}

interface StarStory {
  id: string;
  title: string;
  source: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags: string[];
  power_phrases: string[];
  estimated_duration: string;
  difficulty_to_tell: string;
}

interface StarData {
  stories: StarStory[];
  coverage_analysis: {
    covered_themes: string[];
    gap_themes: string[];
    recommendations: string[];
  };
}

const categoryIcons: Record<string, React.ReactNode> = {
  behavioral: <Users className="h-3.5 w-3.5" />,
  technical: <Brain className="h-3.5 w-3.5" />,
  experience: <Briefcase className="h-3.5 w-3.5" />,
  leadership: <Star className="h-3.5 w-3.5" />,
  culture: <MessageSquare className="h-3.5 w-3.5" />,
  problem_solving: <Target className="h-3.5 w-3.5" />,
};

const categoryColors: Record<string, string> = {
  behavioral: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  technical: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  experience: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  leadership: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  culture: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  problem_solving: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
};

const difficultyColors: Record<string, string> = {
  easy: "bg-score-excellent/10 text-score-excellent",
  medium: "bg-score-warning/10 text-score-warning",
  hard: "bg-score-critical/10 text-score-critical",
};

const riskColors: Record<string, string> = {
  high: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  low: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const gradeColors: Record<string, string> = {
  "A+": "text-emerald-600 dark:text-emerald-400",
  "A": "text-emerald-600 dark:text-emerald-400",
  "A-": "text-emerald-600 dark:text-emerald-400",
  "B+": "text-blue-600 dark:text-blue-400",
  "B": "text-blue-600 dark:text-blue-400",
  "B-": "text-blue-600 dark:text-blue-400",
  "C+": "text-amber-600 dark:text-amber-400",
  "C": "text-amber-600 dark:text-amber-400",
  "D": "text-orange-600 dark:text-orange-400",
  "F": "text-red-600 dark:text-red-400",
};

export default function InterviewPrep() {
  const { analysis } = useAnalysis();
  const [jobDescription, setJobDescription] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("mixed");
  const [count, setCount] = useState("8");
  const [generating, setGenerating] = useState(false);
  const [prepData, setPrepData] = useState<PrepData | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [expandedZone, setExpandedZone] = useState<number | null>(null);

  // Mock Interview state
  const [mockActive, setMockActive] = useState(false);
  const [mockIndex, setMockIndex] = useState(0);
  const [mockAnswer, setMockAnswer] = useState("");
  const [mockTimer, setMockTimer] = useState(0);
  const [mockTimerRunning, setMockTimerRunning] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [showRewrite, setShowRewrite] = useState(false);
  const [mockScores, setMockScores] = useState<{ questionId: string; score: number; grade: string }[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // STAR Builder state
  const [starData, setStarData] = useState<StarData | null>(null);
  const [buildingStories, setBuildingStories] = useState(false);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);

  const vulnerability = analysis?.interview_vulnerability;
  const hasVulnerability = vulnerability && (
    vulnerability.cross_question_zones?.length ||
    vulnerability.behavioral_question_predictions?.length ||
    vulnerability.vague_claims?.length ||
    vulnerability.inflated_claims?.length ||
    vulnerability.technical_depth_probes?.length
  );

  // Timer logic
  useEffect(() => {
    if (mockTimerRunning) {
      timerRef.current = setInterval(() => setMockTimer(t => t + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mockTimerRunning]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const getResumeData = async () => {
    const stored = sessionStorage.getItem("parsed_resume_data");
    if (stored) return JSON.parse(stored);
    const { data } = await supabase.from("saved_resumes").select("resume_data").order("updated_at", { ascending: false }).limit(1).maybeSingle();
    return data?.resume_data || null;
  };

  const handleGenerate = async () => {
    const resumeData = await getResumeData();
    if (!resumeData) { toast.error("No resume found. Save a resume first."); return; }
    setGenerating(true);
    setPrepData(null);
    try {
      const { data, error } = await supabase.functions.invoke("interview-prep", {
        body: { resumeData, jobDescription, category, difficulty, count: parseInt(count) },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setPrepData(data);
      toast.success(`${data.questions?.length || 0} interview questions generated!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate questions");
    } finally {
      setGenerating(false);
    }
  };

  const evaluateAnswer = async () => {
    if (!prepData || !mockAnswer.trim()) return;
    const q = prepData.questions[mockIndex];
    const resumeData = await getResumeData();
    setEvaluating(true);
    setMockTimerRunning(false);
    try {
      const { data, error } = await supabase.functions.invoke("evaluate-answer", {
        body: { question: q.question, userAnswer: mockAnswer, resumeData, jobDescription },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setEvaluation(data);
      setMockScores(prev => [...prev.filter(s => s.questionId !== q.id), { questionId: q.id, score: data.overall_score, grade: data.grade }]);
      toast.success(`Answer scored: ${data.grade} (${data.overall_score}/100)`);
    } catch (err: any) {
      toast.error(err.message || "Failed to evaluate");
    } finally {
      setEvaluating(false);
    }
  };

  const buildStarStories = async () => {
    const resumeData = await getResumeData();
    if (!resumeData) { toast.error("No resume found."); return; }
    setBuildingStories(true);
    try {
      const { data, error } = await supabase.functions.invoke("evaluate-answer", {
        body: { resumeData, mode: "build_stories" },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setStarData(data);
      toast.success(`${data.stories?.length || 0} STAR stories extracted!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to build stories");
    } finally {
      setBuildingStories(false);
    }
  };

  const startMockInterview = () => {
    setMockActive(true);
    setMockIndex(0);
    setMockAnswer("");
    setMockTimer(0);
    setMockTimerRunning(true);
    setEvaluation(null);
    setMockScores([]);
  };

  const nextMockQuestion = () => {
    if (!prepData || mockIndex >= prepData.questions.length - 1) return;
    setMockIndex(i => i + 1);
    setMockAnswer("");
    setMockTimer(0);
    setMockTimerRunning(true);
    setEvaluation(null);
    setShowRewrite(false);
  };

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);
  const markComplete = (id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const practiceQuestion = prepData?.questions[practiceIndex];
  const completedPct = prepData ? Math.round((completedIds.size / prepData.questions.length) * 100) : 0;
  const mockAvgScore = mockScores.length ? Math.round(mockScores.reduce((a, s) => a + s.score, 0) / mockScores.length) : 0;

  return (
    <AppLayout title="Interview Prep">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <motion.div {...fade(0)}>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Interview Prep Suite</h1>
          <p className="text-sm text-muted-foreground">
            AI coaching, mock interviews with scoring, STAR story builder, and vulnerability analysis — all from your resume.
          </p>
        </motion.div>

        <Tabs defaultValue={hasVulnerability ? "vulnerability" : "generate"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vulnerability" className="gap-1.5 text-xs" disabled={!hasVulnerability}>
              <Crosshair className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Vulnerability</span>
              {hasVulnerability && (
                <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                  {vulnerability?.overall_risk_score ?? "—"}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="generate" className="gap-1.5 text-xs">
              <Wand2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Questions</span>
            </TabsTrigger>
            <TabsTrigger value="mock" className="gap-1.5 text-xs" disabled={!prepData}>
              <Mic className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mock Interview</span>
            </TabsTrigger>
            <TabsTrigger value="stories" className="gap-1.5 text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">STAR Builder</span>
            </TabsTrigger>
          </TabsList>

          {/* ─── VULNERABILITY TAB ─── */}
          <TabsContent value="vulnerability" className="space-y-6">
            {!hasVulnerability ? (
              <div className="rounded-2xl border-2 border-dashed bg-card/50 p-16 text-center">
                <ShieldAlert className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">No vulnerability data yet</h3>
                <p className="text-sm text-muted-foreground">Upload and analyze a resume first to see cross-question zones and interview risks.</p>
              </div>
            ) : (
              <>
                {/* Risk Overview */}
                <motion.div {...fade(1)} className="rounded-xl border bg-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-destructive" /> Overall Interview Risk
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold font-display">{vulnerability!.overall_risk_score}</span>
                      <span className="text-xs text-muted-foreground">/100 risk</span>
                    </div>
                  </div>
                  <Progress value={vulnerability!.overall_risk_score} className="h-2 mb-3" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="rounded-lg border p-3">
                      <div className="text-lg font-bold text-destructive">{vulnerability!.cross_question_zones?.length || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Cross-Question Zones</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{vulnerability!.vague_claims?.length || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Vague Claims</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-lg font-bold text-red-600 dark:text-red-400">{vulnerability!.inflated_claims?.length || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Inflated Claims</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{vulnerability!.technical_depth_probes?.length || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Tech Depth Probes</div>
                    </div>
                  </div>
                </motion.div>

                {/* Cross-Question Zones */}
                {vulnerability!.cross_question_zones?.length > 0 && (
                  <motion.div {...fade(2)} className="space-y-3">
                    <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                      <Crosshair className="h-4 w-4 text-destructive" /> Cross-Question Zones
                    </h3>
                    {vulnerability!.cross_question_zones.map((zone: any, i: number) => (
                      <div key={i} className="rounded-xl border bg-card overflow-hidden">
                        <button onClick={() => setExpandedZone(expandedZone === i ? null : i)} className="w-full text-left p-4 flex items-start gap-3 hover:bg-secondary/20 transition-colors">
                          <div className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold border ${riskColors[zone.risk_level?.toLowerCase()] || riskColors.medium}`}>{zone.risk_level}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground mb-0.5">{zone.section}</p>
                            <p className="text-sm font-medium">{zone.claim}</p>
                          </div>
                          {expandedZone === i ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                        </button>
                        <AnimatePresence>
                          {expandedZone === i && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="px-4 pb-5 space-y-4 border-t pt-4">
                                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-destructive mb-1">Why This Is Risky</h4>
                                  <p className="text-xs leading-relaxed">{zone.why_risky}</p>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Likely Questions</h4>
                                  {zone.likely_questions?.map((q: string, j: number) => (
                                    <div key={j} className="flex items-start gap-2 text-xs"><HelpCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" /><span>"{q}"</span></div>
                                  ))}
                                </div>
                                <div className="p-3 rounded-lg bg-primary/[0.05] border border-primary/10">
                                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Preparation Advice</h4>
                                  <p className="text-xs leading-relaxed">{zone.preparation_advice}</p>
                                </div>
                                {zone.ideal_answer_framework && (
                                  <div className="p-3 rounded-lg border bg-secondary/30">
                                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Ideal Answer Framework</h4>
                                    <p className="text-xs leading-relaxed">{zone.ideal_answer_framework}</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Behavioral Question Predictions */}
                {vulnerability!.behavioral_question_predictions?.length > 0 && (
                  <motion.div {...fade(3)} className="space-y-3">
                    <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" /> Predicted Behavioral Questions
                    </h3>
                    <div className="grid gap-3">
                      {vulnerability!.behavioral_question_predictions.map((bq: any, i: number) => (
                        <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="text-[10px] shrink-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">{bq.competency}</Badge>
                            <p className="text-sm font-medium flex-1">"{bq.question}"</p>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="p-2.5 rounded-lg bg-secondary/30">
                              <h5 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Resume Evidence</h5>
                              <p className="text-xs text-muted-foreground">{bq.resume_evidence}</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-secondary/30">
                              <h5 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Story Elements Available</h5>
                              <p className="text-xs text-muted-foreground">{bq.story_elements_available}</p>
                            </div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-primary/[0.05] border border-primary/10">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                              <p className="text-xs leading-relaxed">{bq.preparation_tip}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Vague Claims */}
                {vulnerability!.vague_claims?.length > 0 && (
                  <motion.div {...fade(4)} className="space-y-3">
                    <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" /> Vague Claims That Will Be Challenged
                    </h3>
                    {vulnerability!.vague_claims.map((vc: any, i: number) => (
                      <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
                        <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                          <p className="text-xs font-medium italic">"{vc.text}"</p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div><h5 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Problem</h5><p className="text-xs text-muted-foreground">{vc.problem}</p></div>
                          <div><h5 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Interviewer Reaction</h5><p className="text-xs text-muted-foreground">{vc.interviewer_reaction}</p></div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                          <h5 className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Better Version</h5>
                          <p className="text-xs">{vc.better_version}</p>
                        </div>
                        {vc.follow_up_questions?.length > 0 && (
                          <div className="space-y-1">
                            <h5 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Follow-Up Questions</h5>
                            {vc.follow_up_questions.map((q: string, j: number) => (
                              <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground"><MessageSquare className="h-3 w-3 shrink-0 mt-0.5" /> "{q}"</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Inflated Claims */}
                {vulnerability!.inflated_claims?.length > 0 && (
                  <motion.div {...fade(5)} className="space-y-3">
                    <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-500" /> Inflated Claims — Verification Risk
                    </h3>
                    {vulnerability!.inflated_claims.map((ic: any, i: number) => (
                      <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
                        <p className="text-xs font-medium italic text-destructive">"{ic.text}"</p>
                        <p className="text-xs text-muted-foreground"><span className="font-semibold">Suspicion:</span> {ic.suspicion}</p>
                        <div className="space-y-1">
                          <h5 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Verification Questions</h5>
                          {ic.verification_questions?.map((q: string, j: number) => (
                            <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground"><HelpCircle className="h-3 w-3 shrink-0 mt-0.5" /> "{q}"</div>
                          ))}
                        </div>
                        <div className="p-2.5 rounded-lg bg-primary/[0.05] border border-primary/10">
                          <h5 className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">How to Substantiate</h5>
                          <p className="text-xs">{ic.how_to_substantiate}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Technical Depth Probes */}
                {vulnerability!.technical_depth_probes?.length > 0 && (
                  <motion.div {...fade(6)} className="space-y-3">
                    <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                      <Code className="h-4 w-4 text-purple-500" /> Technical Depth Probes
                    </h3>
                    <div className="grid gap-3">
                      {vulnerability!.technical_depth_probes.map((tp: any, i: number) => (
                        <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">{tp.skill_or_technology}</Badge>
                            <span className="text-[10px] text-muted-foreground">Depth: {tp.depth_signal}</span>
                          </div>
                          <p className="text-xs text-muted-foreground"><span className="font-semibold">Evidence:</span> {tp.evidence_on_resume}</p>
                          <div className="space-y-1">
                            <h5 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Likely Questions</h5>
                            {tp.likely_technical_questions?.map((q: string, j: number) => (
                              <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground"><Brain className="h-3 w-3 shrink-0 mt-0.5" /> {q}</div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-[10px] font-semibold text-muted-foreground">Prep:</span>
                            {tp.preparation_topics?.map((t: string, j: number) => (<Badge key={j} variant="secondary" className="text-[10px]">{t}</Badge>))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Gap Explanations */}
                {vulnerability!.gap_explanations_needed?.length > 0 && (
                  <motion.div {...fade(7)} className="space-y-3">
                    <h3 className="font-display text-sm font-semibold flex items-center gap-2"><Route className="h-4 w-4 text-amber-500" /> Gap Explanations Needed</h3>
                    {vulnerability!.gap_explanations_needed.map((ge: any, i: number) => (
                      <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{ge.gap}</span>
                          <Badge variant="outline" className="text-[10px]">{ge.duration}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground"><span className="font-semibold">Expected:</span> "{ge.expected_question}"</p>
                        <div className="p-2.5 rounded-lg bg-primary/[0.05] border border-primary/10">
                          <h5 className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Recommended Narrative</h5>
                          <p className="text-xs">{ge.recommended_narrative}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Weakest Sections */}
                {vulnerability!.weakest_sections_for_interview?.length > 0 && (
                  <motion.div {...fade(8)} className="rounded-xl border bg-card p-5">
                    <h3 className="font-display text-sm font-semibold flex items-center gap-2 mb-4"><AlertTriangle className="h-4 w-4 text-amber-500" /> Weakest Sections</h3>
                    <div className="space-y-3">
                      {vulnerability!.weakest_sections_for_interview.map((ws: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                          <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><span className="text-xs font-bold text-amber-600 dark:text-amber-400">{i + 1}</span></div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold">{ws.section}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{ws.vulnerability}</p>
                            <p className="text-[11px] text-primary mt-1">→ {ws.improvement}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </TabsContent>

          {/* ─── GENERATE TAB ─── */}
          <TabsContent value="generate" className="space-y-6">
            <motion.div {...fade(1)} className="rounded-xl border bg-card p-5 space-y-4">
              <h3 className="font-display text-sm font-semibold flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" /> Configure Prep Session</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All (Mix)</SelectItem>
                      <SelectItem value="behavioral">Behavioral / STAR</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="experience">Experience</SelectItem>
                      <SelectItem value="leadership">Leadership</SelectItem>
                      <SelectItem value="culture">Culture</SelectItem>
                      <SelectItem value="problem_solving">Problem Solving</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Count</Label>
                  <Select value={count} onValueChange={setCount}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Target Job Description (optional)</Label>
                <Textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste job description for role-specific questions..." rows={3} className="text-xs" />
              </div>
              <Button onClick={handleGenerate} disabled={generating} className="w-full gap-2">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? "Generating..." : "Generate Questions"}
              </Button>
            </motion.div>

            {prepData && (
              <>
                {/* Strategy Brief */}
                <motion.div {...fade(2)} className="rounded-xl border bg-card overflow-hidden">
                  <div className="p-5 border-b bg-primary/[0.03]">
                    <h3 className="font-display text-sm font-semibold flex items-center gap-2 mb-3"><BookOpen className="h-4 w-4 text-primary" /> Strategy Brief</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold flex items-center gap-1.5 text-score-excellent"><CheckCircle2 className="h-3.5 w-3.5" /> Strengths</h4>
                        <ul className="space-y-1">{prepData.overallAdvice.strengths.map((s, i) => (<li key={i} className="text-xs text-muted-foreground flex items-start gap-2"><span className="text-score-excellent mt-0.5">•</span> {s}</li>))}</ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold flex items-center gap-1.5 text-score-warning"><AlertTriangle className="h-3.5 w-3.5" /> Gaps</h4>
                        <ul className="space-y-1">{prepData.overallAdvice.gaps.map((g, i) => (<li key={i} className="text-xs text-muted-foreground flex items-start gap-2"><span className="text-score-warning mt-0.5">•</span> {g}</li>))}</ul>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-primary" /> Story Bank</h4>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {prepData.overallAdvice.storyBank.map((story, i) => (
                        <div key={i} className="rounded-lg border bg-secondary/30 p-3 space-y-1.5">
                          <h5 className="text-xs font-semibold">{story.title}</h5>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{story.situation}</p>
                          <p className="text-[10px] text-primary font-medium">→ {story.versatility}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Progress */}
                <motion.div {...fade(3)} className="flex items-center gap-4 p-4 rounded-xl border bg-card">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold">Progress</span>
                      <span className="text-xs text-muted-foreground">{completedIds.size}/{prepData.questions.length}</span>
                    </div>
                    <Progress value={completedPct} className="h-1.5" />
                  </div>
                  <Button size="sm" variant={practiceMode ? "default" : "outline"} className="gap-1.5 text-xs shrink-0"
                    onClick={() => { setPracticeMode(!practiceMode); setPracticeIndex(0); setShowAnswer(false); }}>
                    <Target className="h-3.5 w-3.5" /> {practiceMode ? "Exit" : "Practice"}
                  </Button>
                </motion.div>

                {/* Practice Mode */}
                <AnimatePresence>
                  {practiceMode && practiceQuestion && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="rounded-xl border-2 border-primary/20 bg-card overflow-hidden">
                      <div className="p-6 border-b bg-primary/[0.03]">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Q{practiceIndex + 1}/{prepData.questions.length}</span>
                            <Badge className={`text-[10px] ${difficultyColors[practiceQuestion.difficulty]}`}>{practiceQuestion.difficulty}</Badge>
                            <Badge variant="outline" className={`text-[10px] gap-1 ${categoryColors[practiceQuestion.category]}`}>{categoryIcons[practiceQuestion.category]} {practiceQuestion.category.replace("_", " ")}</Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> ~{practiceQuestion.estimatedMinutes}min</span>
                        </div>
                        <h3 className="text-base font-semibold leading-relaxed">{practiceQuestion.question}</h3>
                      </div>
                      <div className="p-6">
                        {!showAnswer ? (
                          <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground mb-4">Think through your answer, then reveal the guide.</p>
                            <Button onClick={() => setShowAnswer(true)} className="gap-2"><Lightbulb className="h-4 w-4" /> Show Guide</Button>
                          </div>
                        ) : (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                            <div className="p-3 rounded-lg bg-secondary/40">
                              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Why Asked</h4>
                              <p className="text-xs leading-relaxed">{practiceQuestion.whyAsked}</p>
                            </div>
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /> {practiceQuestion.sampleAnswer.framework}</h4>
                              <div className="p-3 rounded-lg border bg-primary/[0.02]">
                                <p className="text-xs italic text-muted-foreground mb-1">Start with:</p>
                                <p className="text-sm font-medium">"{practiceQuestion.sampleAnswer.openingLine}"</p>
                              </div>
                              <div className="space-y-1.5">
                                {practiceQuestion.sampleAnswer.keyPoints.map((kp, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5 text-score-excellent shrink-0 mt-0.5" /><span>{kp}</span></div>
                                ))}
                              </div>
                              <div className="space-y-1.5">
                                <h5 className="text-[10px] font-semibold uppercase tracking-wider text-score-critical">Avoid</h5>
                                {practiceQuestion.sampleAnswer.pitfalls.map((p, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs"><XCircle className="h-3.5 w-3.5 text-score-critical shrink-0 mt-0.5" /><span className="text-muted-foreground">{p}</span></div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <h5 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Follow-Ups</h5>
                              {practiceQuestion.followUps.map((fu, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground"><MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5" />"{fu}"</div>
                              ))}
                            </div>
                            <div className="p-3 rounded-lg bg-primary/[0.05] border border-primary/10">
                              <div className="flex items-start gap-2"><Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /><p className="text-xs leading-relaxed">{practiceQuestion.tips}</p></div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                      <div className="p-4 border-t flex items-center justify-between">
                        <Button variant="outline" size="sm" disabled={practiceIndex === 0} onClick={() => { setPracticeIndex(i => i - 1); setShowAnswer(false); }}>Previous</Button>
                        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => markComplete(practiceQuestion.id)}>
                          {completedIds.has(practiceQuestion.id) ? <><CheckCircle2 className="h-3.5 w-3.5 text-score-excellent" /> Practiced</> : <><Circle className="h-3.5 w-3.5" /> Mark Practiced</>}
                        </Button>
                        <Button size="sm" disabled={practiceIndex >= prepData.questions.length - 1} onClick={() => { setPracticeIndex(i => i + 1); setShowAnswer(false); }}>Next</Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Questions List */}
                {!practiceMode && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-sm font-semibold">{prepData.questions.length} Questions</h3>
                      <div className="flex gap-1.5">
                        {Object.entries(prepData.questions.reduce<Record<string, number>>((acc, q) => { acc[q.category] = (acc[q.category] || 0) + 1; return acc; }, {})).map(([cat, n]) => (
                          <Badge key={cat} variant="outline" className={`text-[10px] gap-1 ${categoryColors[cat]}`}>{categoryIcons[cat]} {n}</Badge>
                        ))}
                      </div>
                    </div>
                    {prepData.questions.map((q, i) => (
                      <motion.div key={q.id} {...fade(i)} className="rounded-xl border bg-card overflow-hidden">
                        <button onClick={() => toggleExpand(q.id)} className="w-full text-left p-4 flex items-start gap-3 hover:bg-secondary/20 transition-colors">
                          <button onClick={(e) => { e.stopPropagation(); markComplete(q.id); }} className="shrink-0 mt-0.5">
                            {completedIds.has(q.id) ? <CheckCircle2 className="h-4 w-4 text-score-excellent" /> : <Circle className="h-4 w-4 text-muted-foreground/30" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <Badge variant="outline" className={`text-[10px] gap-1 ${categoryColors[q.category]}`}>{categoryIcons[q.category]} {q.category.replace("_", " ")}</Badge>
                              <Badge className={`text-[10px] ${difficultyColors[q.difficulty]}`}>{q.difficulty}</Badge>
                              <span className="text-[10px] text-muted-foreground">→ {q.resumeSection}</span>
                            </div>
                            <p className={`text-sm font-medium leading-relaxed ${completedIds.has(q.id) ? "line-through text-muted-foreground" : ""}`}>{q.question}</p>
                          </div>
                          {expandedId === q.id ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                        </button>
                        <AnimatePresence>
                          {expandedId === q.id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="px-4 pb-5 ml-9 space-y-4 border-t pt-4">
                                <div className="p-3 rounded-lg bg-secondary/40">
                                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Why Asked</h4>
                                  <p className="text-xs leading-relaxed">{q.whyAsked}</p>
                                </div>
                                <div className="space-y-3">
                                  <h4 className="text-xs font-semibold flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /> {q.sampleAnswer.framework}</h4>
                                  <div className="p-3 rounded-lg border bg-primary/[0.02]">
                                    <p className="text-[10px] text-muted-foreground mb-1">Opening:</p>
                                    <p className="text-xs font-medium italic">"{q.sampleAnswer.openingLine}"</p>
                                  </div>
                                  <div className="space-y-1">{q.sampleAnswer.keyPoints.map((kp, j) => (<div key={j} className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5 text-score-excellent shrink-0 mt-0.5" />{kp}</div>))}</div>
                                  <div className="space-y-1">
                                    <h5 className="text-[10px] font-semibold uppercase tracking-wider text-score-critical">Avoid</h5>
                                    {q.sampleAnswer.pitfalls.map((p, j) => (<div key={j} className="flex items-start gap-2 text-xs text-muted-foreground"><XCircle className="h-3.5 w-3.5 text-score-critical shrink-0 mt-0.5" /> {p}</div>))}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <h5 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Follow-Ups</h5>
                                  {q.followUps.map((fu, j) => (<div key={j} className="flex items-start gap-2 text-xs text-muted-foreground"><MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5" />"{fu}"</div>))}
                                </div>
                                <div className="p-3 rounded-lg bg-primary/[0.05] border border-primary/10">
                                  <div className="flex items-start gap-2"><Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /><p className="text-xs leading-relaxed">{q.tips}</p></div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {!prepData && !generating && (
              <motion.div {...fade(2)} className="rounded-2xl border-2 border-dashed bg-card/50 p-16 text-center">
                <Brain className="h-7 w-7 text-primary mx-auto mb-5" />
                <h3 className="font-display text-lg font-bold mb-2">Prepare for your next interview</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">Generate personalized questions from your resume with coaching tips and answer frameworks.</p>
              </motion.div>
            )}
          </TabsContent>

          {/* ─── MOCK INTERVIEW TAB ─── */}
          <TabsContent value="mock" className="space-y-6">
            {!prepData ? (
              <Card className="p-16 text-center">
                <Mic className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">Generate questions first</h3>
                <p className="text-sm text-muted-foreground">Go to the Questions tab to generate interview questions, then come back here for mock practice.</p>
              </Card>
            ) : !mockActive ? (
              <Card className="p-12 text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Mic className="h-9 w-9 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold">Mock Interview Simulator</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Practice answering {prepData.questions.length} questions with a timer. Get AI-scored feedback on each answer across 6 dimensions.
                </p>
                <Button size="lg" onClick={startMockInterview} className="gap-2">
                  <Play className="h-5 w-5" /> Start Mock Interview
                </Button>
              </Card>
            ) : (
              <>
                {/* Mock Interview Scoreboard */}
                {mockScores.length > 0 && (
                  <motion.div {...fade(0)} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Session Scorecard</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{mockScores.length}/{prepData.questions.length} answered</span>
                        <Badge variant="outline" className="text-xs font-bold">Avg: {mockAvgScore}/100</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {prepData.questions.map((q, i) => {
                        const score = mockScores.find(s => s.questionId === q.id);
                        return (
                          <div key={q.id}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-colors cursor-pointer ${
                              score ? score.score >= 80 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" :
                                score.score >= 60 ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" :
                                  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                : i === mockIndex ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/50 text-muted-foreground border-border"
                            }`}
                            onClick={() => { setMockIndex(i); setMockAnswer(""); setEvaluation(null); setMockTimer(0); setMockTimerRunning(true); setShowRewrite(false); }}
                          >
                            {score ? score.grade : i + 1}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Current Question */}
                <motion.div {...fade(1)} className="rounded-xl border-2 border-primary/20 bg-card overflow-hidden">
                  <div className="p-5 border-b bg-primary/[0.03]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Q{mockIndex + 1}/{prepData.questions.length}</Badge>
                        <Badge className={`text-[10px] ${difficultyColors[prepData.questions[mockIndex].difficulty]}`}>{prepData.questions[mockIndex].difficulty}</Badge>
                        <Badge variant="outline" className={`text-[10px] gap-1 ${categoryColors[prepData.questions[mockIndex].category]}`}>
                          {categoryIcons[prepData.questions[mockIndex].category]} {prepData.questions[mockIndex].category.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={mockTimerRunning ? "default" : "secondary"} className="gap-1 font-mono text-xs">
                          <Timer className="h-3 w-3" /> {formatTime(mockTimer)}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => setMockTimerRunning(!mockTimerRunning)}>
                          {mockTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <h3 className="text-base font-semibold leading-relaxed">{prepData.questions[mockIndex].question}</h3>
                    <p className="text-[11px] text-muted-foreground mt-2">→ {prepData.questions[mockIndex].resumeSection}</p>
                  </div>

                  <div className="p-5 space-y-4">
                    {!evaluation ? (
                      <>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">Your Answer</Label>
                          <Textarea
                            value={mockAnswer}
                            onChange={(e) => setMockAnswer(e.target.value)}
                            placeholder="Type your answer as if you were in a real interview..."
                            rows={6}
                            className="text-sm"
                          />
                          <p className="text-[10px] text-muted-foreground">{mockAnswer.split(/\s+/).filter(Boolean).length} words</p>
                        </div>
                        <Button onClick={evaluateAnswer} disabled={evaluating || !mockAnswer.trim()} className="w-full gap-2">
                          {evaluating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          {evaluating ? "AI is scoring your answer..." : "Submit for AI Scoring"}
                        </Button>
                      </>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                        {/* Score Header */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className={`text-3xl font-bold font-display ${gradeColors[evaluation.grade]}`}>{evaluation.grade}</div>
                              <div className="text-[10px] text-muted-foreground">Grade</div>
                            </div>
                            <div className="text-center">
                              <div className="text-3xl font-bold font-display">{evaluation.overall_score}</div>
                              <div className="text-[10px] text-muted-foreground">/100</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Delivery time</div>
                            <div className="text-sm font-semibold">{evaluation.time_estimate}</div>
                          </div>
                        </div>

                        {/* Dimension Scores */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {evaluation.dimensions.map((d, i) => (
                            <div key={i} className="rounded-lg border p-3 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold">{d.name}</span>
                                <span className={`text-xs font-bold ${d.score >= 8 ? "text-emerald-600 dark:text-emerald-400" : d.score >= 6 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>{d.score}/10</span>
                              </div>
                              <Progress value={d.score * 10} className="h-1" />
                              <p className="text-[10px] text-muted-foreground leading-snug">{d.feedback}</p>
                            </div>
                          ))}
                        </div>

                        {/* Strengths & Improvements */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> What You Did Well</h4>
                            {evaluation.strengths.map((s, i) => (<p key={i} className="text-xs text-muted-foreground flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span>{s}</p>))}
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400"><TrendingUp className="h-3.5 w-3.5" /> Improve</h4>
                            {evaluation.improvements.map((s, i) => (<p key={i} className="text-xs text-muted-foreground flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span>{s}</p>))}
                          </div>
                        </div>

                        {/* Missing Elements */}
                        {evaluation.missing_elements.length > 0 && (
                          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10 space-y-1.5">
                            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-destructive">Missing Elements</h4>
                            {evaluation.missing_elements.map((m, i) => (<p key={i} className="text-xs text-muted-foreground flex items-start gap-2"><XCircle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />{m}</p>))}
                          </div>
                        )}

                        {/* Rewritten Answer */}
                        <div className="space-y-2">
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowRewrite(!showRewrite)}>
                            {showRewrite ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            {showRewrite ? "Hide" : "Show"} Polished Answer
                          </Button>
                          <AnimatePresence>
                            {showRewrite && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="p-4 rounded-lg bg-primary/[0.03] border border-primary/10">
                                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5"><Award className="h-3.5 w-3.5" /> A+ Answer</h4>
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{evaluation.rewritten_answer}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Body Language Tips */}
                        <div className="p-3 rounded-lg bg-secondary/30 space-y-1.5">
                          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Delivery Tips</h4>
                          {evaluation.body_language_tips.map((t, i) => (<p key={i} className="text-xs text-muted-foreground flex items-start gap-2"><Zap className="h-3 w-3 text-primary shrink-0 mt-0.5" />{t}</p>))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="p-4 border-t flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={() => { setMockActive(false); setEvaluation(null); }}>
                      End Interview
                    </Button>
                    {evaluation && (
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setMockAnswer(""); setEvaluation(null); setMockTimer(0); setMockTimerRunning(true); setShowRewrite(false); }}>
                        <RotateCcw className="h-3.5 w-3.5" /> Retry
                      </Button>
                    )}
                    <Button size="sm" onClick={nextMockQuestion} disabled={mockIndex >= prepData.questions.length - 1}>
                      Next Question
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </TabsContent>

          {/* ─── STAR BUILDER TAB ─── */}
          <TabsContent value="stories" className="space-y-6">
            {!starData ? (
              <Card className="p-12 text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <BookOpen className="h-9 w-9 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold">STAR Story Builder</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Extract powerful STAR stories from your resume. Each story comes with Situation, Task, Action, Result breakdowns plus power phrases.
                </p>
                <Button size="lg" onClick={buildStarStories} disabled={buildingStories} className="gap-2">
                  {buildingStories ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  {buildingStories ? "Extracting Stories..." : "Build My Story Bank"}
                </Button>
              </Card>
            ) : (
              <>
                {/* Coverage Analysis */}
                <motion.div {...fade(0)} className="rounded-xl border bg-card p-5">
                  <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Coverage Analysis</h3>
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Covered Themes</h4>
                      <div className="flex flex-wrap gap-1.5">{starData.coverage_analysis.covered_themes.map((t, i) => (<Badge key={i} variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">{t}</Badge>))}</div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Gap Themes</h4>
                      <div className="flex flex-wrap gap-1.5">{starData.coverage_analysis.gap_themes.map((t, i) => (<Badge key={i} variant="outline" className="text-[10px] bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20">{t}</Badge>))}</div>
                    </div>
                  </div>
                  {starData.coverage_analysis.recommendations.length > 0 && (
                    <div className="p-3 rounded-lg bg-primary/[0.03] border border-primary/10 space-y-1">
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-primary">Recommendations</h4>
                      {starData.coverage_analysis.recommendations.map((r, i) => (<p key={i} className="text-xs text-muted-foreground flex items-start gap-2"><Lightbulb className="h-3 w-3 text-primary shrink-0 mt-0.5" />{r}</p>))}
                    </div>
                  )}
                </motion.div>

                {/* Stories */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-semibold">{starData.stories.length} STAR Stories</h3>
                    <Button variant="outline" size="sm" onClick={buildStarStories} disabled={buildingStories} className="gap-1.5 text-xs">
                      <RotateCcw className="h-3.5 w-3.5" /> Regenerate
                    </Button>
                  </div>
                  {starData.stories.map((story, i) => (
                    <motion.div key={story.id} {...fade(i)} className="rounded-xl border bg-card overflow-hidden">
                      <button onClick={() => setExpandedStory(expandedStory === story.id ? null : story.id)} className="w-full text-left p-4 flex items-start gap-3 hover:bg-secondary/20 transition-colors">
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold">{story.title}</h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{story.source}</p>
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {story.tags.map((tag, j) => (<Badge key={j} variant="secondary" className="text-[10px]">{tag}</Badge>))}
                            <Badge variant="outline" className="text-[10px]">{story.estimated_duration}</Badge>
                            <Badge className={`text-[10px] ${difficultyColors[story.difficulty_to_tell]}`}>{story.difficulty_to_tell}</Badge>
                          </div>
                        </div>
                        {expandedStory === story.id ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </button>
                      <AnimatePresence>
                        {expandedStory === story.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-5 space-y-4 border-t pt-4">
                              <div className="grid sm:grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                  <h5 className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Situation</h5>
                                  <p className="text-xs leading-relaxed">{story.situation}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                                  <h5 className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">Task</h5>
                                  <p className="text-xs leading-relaxed">{story.task}</p>
                                </div>
                              </div>
                              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                <h5 className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Action</h5>
                                <p className="text-xs leading-relaxed">{story.action}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                <h5 className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Result</h5>
                                <p className="text-xs leading-relaxed">{story.result}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-primary/[0.03] border border-primary/10">
                                <h5 className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-2">Power Phrases</h5>
                                <div className="flex flex-wrap gap-2">
                                  {story.power_phrases.map((phrase, j) => (
                                    <span key={j} className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">"{phrase}"</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function Circle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
