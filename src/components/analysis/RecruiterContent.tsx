import { ScoreCard, SeverityBadge } from "@/components/ScoreCard";
import { motion } from "@/lib/motion-stub";
import {
  Eye, Clock, CheckCircle2, AlertTriangle, MessageSquare, User, Crosshair,
  Zap, ArrowRight, PenTool, Brain, Gauge, XCircle, Briefcase, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/AnalysisContext";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

const heatmapZones = [
  { label: "Name & Title", y: 0, h: 8, attention: "high" as const },
  { label: "Contact Info", y: 8, h: 5, attention: "medium" as const },
  { label: "Summary", y: 13, h: 10, attention: "high" as const },
  { label: "Experience Header", y: 23, h: 5, attention: "high" as const },
  { label: "First Job Bullets", y: 28, h: 15, attention: "high" as const },
  { label: "Second Job", y: 43, h: 12, attention: "medium" as const },
  { label: "Earlier Experience", y: 55, h: 10, attention: "low" as const },
  { label: "Education", y: 65, h: 8, attention: "medium" as const },
  { label: "Skills", y: 73, h: 10, attention: "medium" as const },
  { label: "Certifications/Other", y: 83, h: 8, attention: "low" as const },
  { label: "Bottom of Page", y: 91, h: 9, attention: "low" as const },
];

const attentionColor = {
  high: "bg-score-excellent/30 border-score-excellent/50",
  medium: "bg-score-warning/20 border-score-warning/40",
  low: "bg-score-critical/15 border-score-critical/30",
};

const attentionLabel = {
  high: { text: "High Attention", class: "text-score-excellent" },
  medium: { text: "Scanned", class: "text-score-warning" },
  low: { text: "Often Skipped", class: "text-score-critical" },
};

function MiniGauge({ value, size = 56, stroke = 5, color }: { value: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-secondary" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${(value / 100) * circ} ${circ}`} className={color} />
    </svg>
  );
}

export function RecruiterContent() {
  const { analysis } = useAnalysis();
  if (!analysis) return null;

  const r = analysis.recruiter_analysis;
  const score = analysis.scores.recruiter_readability;
  const scan = r.six_second_scan;

  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div {...fade(0)} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">Recruiter Readability</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">What a recruiter sees in the first 6 seconds — and what they miss.</p>
        </div>
        <ScoreCard title="Readability" score={score.score} icon={<Eye className="h-4 w-4" />} compact />
      </motion.div>

      {/* Key perception metrics */}
      <motion.div {...fade(1)} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Perceived Role", value: r.perceived_role, icon: <Briefcase className="h-5 w-5 text-primary" />, bg: "bg-primary/10" },
          { label: "Level", value: r.perceived_level, icon: <Layers className="h-5 w-5 text-primary" />, bg: "bg-primary/10" },
          { label: "Strength", value: r.perceived_strength, icon: <Zap className="h-5 w-5 text-score-excellent" />, bg: "bg-score-excellent/10" },
          { label: "Industry", value: r.perceived_industry || "N/A", icon: <Brain className="h-5 w-5 text-primary" />, bg: "bg-primary/10" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", item.bg)}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{item.label}</p>
                <p className="text-xs font-bold truncate">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* 6-Second Scan */}
      {scan && (
        <motion.div {...fade(2)} className="rounded-xl border bg-card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-sm">6-Second Scan Simulation</h3>
          </div>

          {/* Scan metrics gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {scan.f_pattern_score !== undefined && (
              <div className="text-center">
                <div className="relative w-14 h-14 mx-auto mb-2">
                  <MiniGauge value={scan.f_pattern_score} color={scan.f_pattern_score >= 70 ? "stroke-score-excellent" : scan.f_pattern_score >= 50 ? "stroke-score-warning" : "stroke-score-critical"} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold tabular-nums">{scan.f_pattern_score}</span>
                  </div>
                </div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">F-Pattern</p>
              </div>
            )}
            <div className="text-center">
              <div className={cn("w-14 h-14 mx-auto mb-2 rounded-xl flex items-center justify-center",
                scan.cognitive_load === "Low" ? "bg-score-excellent/10" : scan.cognitive_load === "High" ? "bg-score-critical/10" : "bg-score-warning/10"
              )}>
                <Gauge className={cn("h-6 w-6",
                  scan.cognitive_load === "Low" ? "text-score-excellent" : scan.cognitive_load === "High" ? "text-score-critical" : "text-score-warning"
                )} />
              </div>
              <p className="text-xs font-bold">{scan.cognitive_load || "N/A"}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Cognitive Load</p>
            </div>
            <div className="text-center">
              <div className={cn("w-14 h-14 mx-auto mb-2 rounded-xl flex items-center justify-center",
                scan.clarity_of_role === "clear" ? "bg-score-excellent/10" : "bg-score-warning/10"
              )}>
                <Eye className={cn("h-6 w-6",
                  scan.clarity_of_role === "clear" ? "text-score-excellent" : "text-score-warning"
                )} />
              </div>
              <p className="text-xs font-bold capitalize">{scan.clarity_of_role}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Role Clarity</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-2 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <p className="text-xs font-bold">{scan.seniority_read}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Seniority</p>
            </div>
          </div>

          {/* Verdict */}
          <div className="rounded-xl bg-secondary/50 p-4 mb-5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Immediate Verdict</p>
            <p className="text-sm font-semibold">{scan.immediate_verdict}</p>
          </div>

          {/* Eye Path */}
          {scan.eye_path?.length > 0 && (
            <div className="mb-5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Eye Path Trajectory</p>
              <div className="flex flex-wrap items-center gap-2">
                {scan.eye_path.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="text-xs font-medium">{item}</span>
                    </div>
                    {i < scan.eye_path.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/40" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Noticed vs Missed */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-score-excellent" /> What Was Noticed
              </p>
              <div className="space-y-1.5">
                {(r.noticed || []).map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-score-excellent/5 border border-score-excellent/10">
                    <CheckCircle2 className="h-3.5 w-3.5 text-score-excellent mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-1">
                <XCircle className="h-3 w-3 text-score-warning" /> What Was Missed
              </p>
              <div className="space-y-1.5">
                {(r.missed || []).map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-score-warning/5 border border-score-warning/10">
                    <AlertTriangle className="h-3.5 w-3.5 text-score-warning mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* First Impression + Emotional Response */}
      <motion.div {...fade(3)} className="rounded-xl border bg-card p-4 sm:p-6">
        <h3 className="font-semibold text-sm mb-4">First Impression</h3>
        <div className="rounded-lg bg-secondary/40 p-4 mb-4">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic">"{r.first_impression}"</p>
        </div>
        {r.emotional_response && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <MessageSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Emotional Response</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{r.emotional_response}</p>
            </div>
          </div>
        )}
        {r.comparison_to_ideal && (
          <div className="flex items-start gap-3 p-3 mt-2 rounded-lg bg-secondary/40">
            <Crosshair className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">vs. Ideal Candidate</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{r.comparison_to_ideal}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Attention Heatmap */}
      <motion.div {...fade(4)} className="rounded-xl border bg-card p-4 sm:p-6">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> Attention Heatmap
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Where recruiters spend time on a typical resume layout.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="relative rounded-lg border overflow-hidden bg-white dark:bg-slate-100" style={{ minHeight: 320 }}>
            {heatmapZones.map(zone => (
              <div key={zone.label} className={`absolute left-0 right-0 border-l-4 px-3 flex items-center ${attentionColor[zone.attention]}`} style={{ top: `${zone.y}%`, height: `${zone.h}%` }}>
                <span className="text-[10px] font-medium text-slate-800">{zone.label}</span>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Legend</p>
              {(["high", "medium", "low"] as const).map(level => (
                <div key={level} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${attentionColor[level]}`} />
                  <span className={`text-xs font-medium ${attentionLabel[level].class}`}>{attentionLabel[level].text}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-secondary/40 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Key Insight</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Recruiters spend 80% of their time on the top third of your resume. Make your name, title, summary, and first job bullets count.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hiring Manager Notes */}
      {r.hiring_manager_notes && r.hiring_manager_notes.length > 0 && (
        <motion.div {...fade(5)} className="rounded-xl border bg-card p-4 sm:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Hiring Manager Notes
          </h3>
          <div className="space-y-2">
            {r.hiring_manager_notes.map((note, i) => (
              <div key={i} className="rounded-lg bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground leading-relaxed italic">"{note}"</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Issues with fixes */}
      {r.issues?.length > 0 && (
        <motion.div {...fade(6)} className="rounded-xl border bg-card p-4 sm:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-score-warning" /> Readability Issues ({r.issues.length})
          </h3>
          <div className="space-y-2.5">
            {r.issues.map((item, i) => (
              <div key={i} className={cn("p-3 rounded-xl border",
                item.severity === "risk" ? "bg-score-risk/5 border-score-risk/15" : "bg-score-warning/5 border-score-warning/15"
              )}>
                <div className="flex items-start gap-3">
                  {item.severity === "risk"
                    ? <XCircle className="h-4 w-4 text-score-risk mt-0.5 shrink-0" />
                    : <AlertTriangle className="h-4 w-4 text-score-warning mt-0.5 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-semibold">{item.issue}</p>
                      <SeverityBadge level={item.severity === "risk" ? "risk" : "warning"} label={item.severity} />
                    </div>
                    {item.fix && (
                      <p className="text-[11px] text-score-excellent mt-1">
                        <span className="font-semibold">Fix:</span> {item.fix}
                      </p>
                    )}
                  </div>
                  <Link to="/builder">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 shrink-0">
                      <PenTool className="h-3 w-3" /> Fix
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
