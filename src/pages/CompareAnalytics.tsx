import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, GitCompare, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar, Legend,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

interface AnalysisRecord {
  id: string;
  scores: Record<string, { score: number; label?: string; summary?: string }>;
  created_at: string;
  file_name: string;
  resume_id: string | null;
}

interface ResumeOption {
  id: string;
  title: string;
}

export default function CompareAnalytics() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [leftId, setLeftId] = useState(searchParams.get("left") || "");
  const [rightId, setRightId] = useState(searchParams.get("right") || "");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [resumesRes, analysesRes] = await Promise.all([
        supabase.from("saved_resumes").select("id, title").eq("user_id", user.id).order("updated_at", { ascending: false }),
        supabase.from("resume_analyses").select("id, scores, created_at, file_name, resume_id").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setResumes((resumesRes.data || []) as ResumeOption[]);
      setAnalyses((analysesRes.data || []) as AnalysisRecord[]);
      const r = resumesRes.data || [];
      if (!leftId && r.length > 0) setLeftId(r[0].id);
      if (!rightId && r.length > 1) setRightId(r[1].id);
      setLoading(false);
    };
    load();
  }, [user]);

  const getLatestAnalysis = (resumeId: string) => {
    const resume = resumes.find(r => r.id === resumeId);
    return analyses.find(a =>
      a.resume_id === resumeId ||
      (resume && a.file_name === resume.title && !a.resume_id)
    );
  };

  const leftAnalysis = leftId ? getLatestAnalysis(leftId) : null;
  const rightAnalysis = rightId ? getLatestAnalysis(rightId) : null;
  const leftResume = resumes.find(r => r.id === leftId);
  const rightResume = resumes.find(r => r.id === rightId);

  const getScoreEntries = (analysis: AnalysisRecord | null) => {
    if (!analysis?.scores) return [];
    return Object.entries(analysis.scores).map(([key, val]) => ({
      key,
      label: val?.label || key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      score: val?.score || 0,
    }));
  };

  const leftEntries = getScoreEntries(leftAnalysis);
  const rightEntries = getScoreEntries(rightAnalysis);

  // Build radar comparison data
  const allDimensions = new Set([...leftEntries.map(e => e.label), ...rightEntries.map(e => e.label)]);
  const radarData = Array.from(allDimensions).map(dim => ({
    dimension: dim,
    resumeA: leftEntries.find(e => e.label === dim)?.score || 0,
    resumeB: rightEntries.find(e => e.label === dim)?.score || 0,
    fullMark: 100,
  }));

  // Bar chart comparison
  const barData = Array.from(allDimensions).map(dim => ({
    name: dim.length > 12 ? dim.slice(0, 12) + "…" : dim,
    "Resume A": leftEntries.find(e => e.label === dim)?.score || 0,
    "Resume B": rightEntries.find(e => e.label === dim)?.score || 0,
  }));

  const avgScore = (entries: typeof leftEntries) =>
    entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.score, 0) / entries.length) : 0;

  if (loading) {
    return (
      <AppLayout title="Compare Analytics">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Compare Analytics">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/analytics">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" /> Analytics
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-bold">Compare Resume Analytics</h2>
          </div>
        </div>

        {/* Resume selectors */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Resume A</label>
            <Select value={leftId} onValueChange={setLeftId}>
              <SelectTrigger><SelectValue placeholder="Select resume" /></SelectTrigger>
              <SelectContent>
                {resumes.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Resume B</label>
            <Select value={rightId} onValueChange={setRightId}>
              <SelectTrigger><SelectValue placeholder="Select resume" /></SelectTrigger>
              <SelectContent>
                {resumes.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overall score cards */}
        {(leftAnalysis || rightAnalysis) && (
          <div className="grid grid-cols-2 gap-6">
            <div className={cn("rounded-xl border p-5 text-center", leftAnalysis ? "bg-card" : "bg-muted/30")}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                {leftResume?.title || "Resume A"}
              </p>
              {leftAnalysis ? (
                <p className={cn(
                  "text-4xl font-bold font-display tabular-nums",
                  avgScore(leftEntries) >= 80 ? "text-score-excellent" : avgScore(leftEntries) >= 50 ? "text-score-warning" : "text-score-critical"
                )}>{avgScore(leftEntries)}<span className="text-lg text-muted-foreground">/100</span></p>
              ) : (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Upload className="h-3.5 w-3.5" /> No analysis yet
                </p>
              )}
            </div>
            <div className={cn("rounded-xl border p-5 text-center", rightAnalysis ? "bg-card" : "bg-muted/30")}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                {rightResume?.title || "Resume B"}
              </p>
              {rightAnalysis ? (
                <p className={cn(
                  "text-4xl font-bold font-display tabular-nums",
                  avgScore(rightEntries) >= 80 ? "text-score-excellent" : avgScore(rightEntries) >= 50 ? "text-score-warning" : "text-score-critical"
                )}>{avgScore(rightEntries)}<span className="text-lg text-muted-foreground">/100</span></p>
              ) : (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Upload className="h-3.5 w-3.5" /> No analysis yet
                </p>
              )}
            </div>
          </div>
        )}

        {/* Detailed comparison */}
        {leftAnalysis && rightAnalysis && (
          <>
            {/* Dimension-by-dimension comparison */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="grid grid-cols-[1fr_100px_100px_1fr] gap-0 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground border-b bg-secondary/40 px-4 py-2.5">
                <span>Dimension</span>
                <span className="text-center">Resume A</span>
                <span className="text-center">Resume B</span>
                <span className="text-right">Difference</span>
              </div>
              {Array.from(allDimensions).map(dim => {
                const aScore = leftEntries.find(e => e.label === dim)?.score || 0;
                const bScore = rightEntries.find(e => e.label === dim)?.score || 0;
                const diff = bScore - aScore;
                return (
                  <div key={dim} className="grid grid-cols-[1fr_100px_100px_1fr] gap-0 px-4 py-2.5 border-b last:border-0 text-xs items-center">
                    <span className="font-medium">{dim}</span>
                    <span className={cn("text-center font-bold tabular-nums", aScore >= 80 ? "text-score-excellent" : aScore >= 50 ? "text-score-warning" : "text-score-critical")}>{aScore}</span>
                    <span className={cn("text-center font-bold tabular-nums", bScore >= 80 ? "text-score-excellent" : bScore >= 50 ? "text-score-warning" : "text-score-critical")}>{bScore}</span>
                    <span className={cn("text-right font-medium tabular-nums", diff > 0 ? "text-score-excellent" : diff < 0 ? "text-score-critical" : "text-muted-foreground")}>
                      {diff > 0 ? `+${diff}` : diff === 0 ? "—" : diff}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-display text-sm font-semibold mb-4">Radar Comparison</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <RechartsRadar name={leftResume?.title || "Resume A"} dataKey="resumeA" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                      <RechartsRadar name={rightResume?.title || "Resume B"} dataKey="resumeB" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.1} strokeWidth={2} strokeDasharray="4 4" />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-display text-sm font-semibold mb-4">Score Comparison</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="Resume A" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Resume B" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {resumes.length < 2 && (
          <div className="py-20 text-center text-sm text-muted-foreground">
            Save at least 2 resumes and run analyses to compare them side by side.
          </div>
        )}
      </div>
    </AppLayout>
  );
}
