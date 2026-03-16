import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Clock, FileText, ChevronRight, Trash2, Download, Eye,
  TrendingUp, Target, Brain, Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InterviewSession {
  id: string;
  resume_id: string | null;
  role: string;
  company: string | null;
  interview_type: string;
  job_description: string | null;
  transcript: any[];
  analysis: any;
  scores: number[];
  overall_score: number | null;
  verdict: string | null;
  voice_metrics: any;
  duration_seconds: number;
  question_count: number;
  created_at: string;
}

interface InterviewHistoryProps {
  resumeId: string;
  onViewReport: (session: InterviewSession) => void;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function getScoreColor(score: number | null) {
  if (!score) return "text-muted-foreground";
  if (score >= 80) return "text-score-excellent";
  if (score >= 60) return "text-score-warning";
  return "text-score-critical";
}

function getScoreBg(score: number | null) {
  if (!score) return "bg-muted";
  if (score >= 80) return "bg-score-excellent/10";
  if (score >= 60) return "bg-score-warning/10";
  return "bg-score-critical/10";
}

export function InterviewHistory({ resumeId, onViewReport }: InterviewHistoryProps) {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("mock_interview_sessions" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (resumeId) {
        query = query.eq("resume_id", resumeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSessions((data || []) as unknown as InterviewSession[]);
    } catch (e: any) {
      console.error("Failed to fetch history:", e);
    } finally {
      setLoading(false);
    }
  }, [resumeId]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const deleteSession = async (id: string) => {
    try {
      const { error } = await supabase
        .from("mock_interview_sessions" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success("Interview session deleted");
    } catch (e: any) {
      toast.error("Failed to delete session");
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold">Past Interviews</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-lg bg-secondary/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold">Past Interviews</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          No interview history {resumeId ? "for this resume" : ""} yet. Complete an interview to see your history here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold">Past Interviews</h3>
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{sessions.length}</span>
        </div>
      </div>

      <div className="space-y-2.5 max-h-[400px] overflow-y-auto scrollbar-thin pr-1">
        <AnimatePresence>
          {sessions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ delay: i * 0.03 }}
              className="group rounded-lg border bg-background hover:bg-secondary/30 transition-all cursor-pointer"
              onClick={() => onViewReport(s)}
            >
              <div className="flex items-center gap-3 p-3">
                {/* Score badge */}
                <div className={cn(
                  "h-11 w-11 rounded-lg flex flex-col items-center justify-center shrink-0",
                  getScoreBg(s.overall_score)
                )}>
                  <span className={cn("text-base font-bold tabular-nums", getScoreColor(s.overall_score))}>
                    {s.overall_score ?? "–"}
                  </span>
                  <span className="text-[8px] text-muted-foreground">/100</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate">
                      {capitalize(s.interview_type)} — {s.role}
                    </p>
                    {s.verdict && (
                      <span className={cn(
                        "text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0",
                        s.verdict === "Exceptional" || s.verdict === "Strong"
                          ? "bg-score-excellent/10 text-score-excellent"
                          : s.verdict === "Promising"
                          ? "bg-score-warning/10 text-score-warning"
                          : "bg-score-critical/10 text-score-critical"
                      )}>
                        {s.verdict}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                    <span>{formatDate(s.created_at)} at {formatTime(s.created_at)}</span>
                    {s.company && <span>• {s.company}</span>}
                    <span>• {s.question_count} Qs</span>
                    {s.duration_seconds > 0 && <span>• {formatDuration(s.duration_seconds)}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
