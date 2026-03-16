import AppLayout from "@/components/layout/AppLayout";
import { motion } from "@/lib/motion-stub";
import { BarChart3, FileText, Upload, TrendingUp, Clock, Loader2, Radar, ArrowLeft, ChevronDown, GitCompare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar, Legend,
} from "recharts";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

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

interface Stats {
  totalResumes: number;
  totalAnalyses: number;
  avgScore: number;
  recentAnalyses: { date: string; count: number }[];
  scoreDistribution: { range: string; count: number }[];
  topScores: { name: string; score: number }[];
  radarData: { dimension: string; score: number; fullMark: number }[];
  comparisonRadar: { dimension: string; latest: number; average: number; fullMark: number }[] | null;
  // Per-analysis breakdown for individual view
  analyses: AnalysisRecord[];
}

function computeStats(analyses: AnalysisRecord[], totalResumes: number): Stats {
  let totalScore = 0;
  let scoreCount = 0;
  const scoreDist = [0, 0, 0, 0, 0];
  const topScores: { name: string; score: number }[] = [];
  const dimTotals: Record<string, number[]> = {};

  analyses.forEach((a) => {
    const scores = a.scores;
    if (!scores) return;
    const entries = Object.entries(scores);
    const vals = entries.map(([, s]) => s?.score || 0);
    if (vals.length === 0) return;
    const avg = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
    totalScore += avg;
    scoreCount++;
    if (avg <= 20) scoreDist[0]++;
    else if (avg <= 40) scoreDist[1]++;
    else if (avg <= 60) scoreDist[2]++;
    else if (avg <= 80) scoreDist[3]++;
    else scoreDist[4]++;
    topScores.push({ name: a.file_name, score: avg });

    entries.forEach(([key, val]) => {
      const label = val?.label || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      if (!dimTotals[label]) dimTotals[label] = [];
      dimTotals[label].push(val?.score || 0);
    });
  });

  const radarData = Object.entries(dimTotals).map(([dimension, values]) => ({
    dimension,
    score: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    fullMark: 100,
  }));

  let comparisonRadar = null;
  if (analyses.length >= 2) {
    const latestScores = analyses[0].scores;
    if (latestScores) {
      comparisonRadar = Object.entries(latestScores).map(([key, val]) => {
        const label = val?.label || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const avgForDim = dimTotals[label] ? Math.round(dimTotals[label].reduce((a, b) => a + b, 0) / dimTotals[label].length) : 0;
        return { dimension: label, latest: val?.score || 0, average: avgForDim, fullMark: 100 };
      });
    }
  }

  const dayMap: Record<string, number> = {};
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dayMap[d.toISOString().slice(0, 10)] = 0;
  }
  analyses.forEach((a) => {
    const day = a.created_at.slice(0, 10);
    if (dayMap[day] !== undefined) dayMap[day]++;
  });

  return {
    totalResumes,
    totalAnalyses: analyses.length,
    avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
    recentAnalyses: Object.entries(dayMap).map(([date, count]) => ({ date: date.slice(5), count })),
    scoreDistribution: [
      { range: "0-20", count: scoreDist[0] },
      { range: "21-40", count: scoreDist[1] },
      { range: "41-60", count: scoreDist[2] },
      { range: "61-80", count: scoreDist[3] },
      { range: "81-100", count: scoreDist[4] },
    ],
    topScores: topScores.sort((a, b) => b.score - a.score).slice(0, 5),
    radarData,
    comparisonRadar,
    analyses,
  };
}

export default function Analytics() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedResumeId = searchParams.get("resume");
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, selectedResumeId]);

  const loadData = async () => {
    setLoading(true);
    const [resumesRes, analysesRes] = await Promise.all([
      supabase.from("saved_resumes").select("id, title").eq("user_id", user!.id).order("updated_at", { ascending: false }),
      supabase.from("resume_analyses").select("id, scores, created_at, file_name, resume_id").eq("user_id", user!.id).order("created_at", { ascending: false }),
    ]);

    const allResumes = (resumesRes.data || []) as ResumeOption[];
    const allAnalyses = (analysesRes.data || []) as AnalysisRecord[];
    setResumes(allResumes);

    // Filter analyses if a specific resume is selected
    let filtered = allAnalyses;
    if (selectedResumeId) {
      const selectedResume = allResumes.find(r => r.id === selectedResumeId);
      filtered = allAnalyses.filter(a => 
        a.resume_id === selectedResumeId || 
        (selectedResume && a.file_name === selectedResume.title && !a.resume_id)
      );
    }

    setStats(computeStats(filtered, allResumes.length));
    setLoading(false);
  };

  const selectedResumeName = selectedResumeId 
    ? resumes.find(r => r.id === selectedResumeId)?.title || "Unknown Resume"
    : null;

  if (loading) {
    return (
      <AppLayout title="Analytics">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!stats) return null;

  const statCards = [
    { icon: FileText, label: "Saved Resumes", value: stats.totalResumes },
    { icon: Upload, label: "Analyses Run", value: stats.totalAnalyses },
    { icon: TrendingUp, label: "Avg Score", value: stats.avgScore },
    { icon: Clock, label: "Last 30 Days", value: stats.recentAnalyses.reduce((s, d) => s + d.count, 0) },
  ];

  return (
    <AppLayout title="Analytics">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header with resume filter */}
        <motion.div {...fade(0)} className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              {selectedResumeId && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSearchParams({})}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Button>
              )}
              <h2 className="text-xl font-bold tracking-tight">
                {selectedResumeId ? "Resume Analytics" : "Analytics"}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedResumeId 
                ? `Viewing analytics for "${selectedResumeName}"`
                : "Track your resume improvement journey."}
            </p>
          </div>

          {/* Resume Picker + Compare */}
          <div className="flex items-center gap-2">
            <Link to="/compare-analytics">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[11px]">
                <GitCompare className="h-3 w-3" /> Compare
              </Button>
            </Link>
            <div className="relative">
              <button
                onClick={() => setPickerOpen(!pickerOpen)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-md text-[11px] font-medium border border-border bg-background hover:bg-muted/50 transition-colors"
              >
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span>{selectedResumeId ? "Change Resume" : "Filter by Resume"}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              {pickerOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setPickerOpen(false)} />
                  <div className="absolute top-full right-0 mt-1 z-30 bg-popover border border-border rounded-lg shadow-lg p-1 min-w-[220px] max-h-[300px] overflow-y-auto">
                    <button
                      onClick={() => { setSearchParams({}); setPickerOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-[11px] transition-colors",
                        !selectedResumeId ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-foreground"
                      )}
                    >
                      All Resumes (Overview)
                    </button>
                    {resumes.map(r => (
                      <button
                        key={r.id}
                        onClick={() => { setSearchParams({ resume: r.id }); setPickerOpen(false); }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-[11px] truncate transition-colors",
                          selectedResumeId === r.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-foreground"
                        )}
                      >
                        {r.title}
                      </button>
                    ))}
                    {resumes.length === 0 && (
                      <p className="text-[11px] text-muted-foreground px-3 py-2">No resumes saved yet.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <motion.div key={s.label} {...fade(i + 1)} className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="h-4 w-4 text-primary" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{s.label}</span>
              </div>
              <p className="text-2xl font-bold font-display">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Per-analysis breakdown for individual resume */}
        {selectedResumeId && stats.analyses.length > 0 && (
          <motion.div {...fade(5)} className="rounded-xl border bg-card p-5">
            <h3 className="font-display text-sm font-semibold mb-4">Analysis History</h3>
            <div className="space-y-3">
              {stats.analyses.map((a, i) => {
                const entries = Object.entries(a.scores || {});
                const vals = entries.map(([, s]) => s?.score || 0);
                const avg = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
                return (
                  <div key={a.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      <span className={cn(
                        "text-xs font-bold tabular-nums",
                        avg >= 80 ? "text-score-excellent" : avg >= 50 ? "text-score-warning" : "text-score-critical"
                      )}>{avg}/100</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {entries.map(([key, val]) => {
                        const label = val?.label || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                        const score = val?.score || 0;
                        return (
                          <div key={key} className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="text-muted-foreground truncate">{label}</span>
                            <span className={cn(
                              "font-medium tabular-nums",
                              score >= 80 ? "text-score-excellent" : score >= 50 ? "text-score-warning" : "text-score-critical"
                            )}>{score}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Activity chart */}
        <motion.div {...fade(6)} className="rounded-xl border bg-card p-5">
          <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Analysis Activity (30 days)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.recentAnalyses}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Radar Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div {...fade(7)} className="rounded-xl border bg-card p-5">
            <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2">
              <Radar className="h-4 w-4 text-primary" /> {selectedResumeId ? "Score Breakdown" : "Resume Strength Radar"}
            </h3>
            {stats.radarData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={stats.radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <RechartsRadar name="Avg Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Run an analysis to see your strength radar.</p>
            )}
          </motion.div>

          <motion.div {...fade(8)} className="rounded-xl border bg-card p-5">
            <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Latest vs Average
            </h3>
            {stats.comparisonRadar ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={stats.comparisonRadar} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <RechartsRadar name="Latest" dataKey="latest" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                    <RechartsRadar name="Average" dataKey="average" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 4" />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Run 2+ analyses to compare your latest vs average.</p>
            )}
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div {...fade(9)} className="rounded-xl border bg-card p-5">
            <h3 className="font-display text-sm font-semibold mb-4">Score Distribution</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.scoreDistribution}>
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div {...fade(10)} className="rounded-xl border bg-card p-5">
            <h3 className="font-display text-sm font-semibold mb-4">Top Scoring Resumes</h3>
            {stats.topScores.length === 0 ? (
              <p className="text-sm text-muted-foreground">No analyses yet. Upload a resume to get started.</p>
            ) : (
              <div className="space-y-3">
                {stats.topScores.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
                    <span className="text-sm truncate flex-1 mr-3">{r.name}</span>
                    <span className="text-sm font-bold font-display tabular-nums">{r.score}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
