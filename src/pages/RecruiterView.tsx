import AppLayout from "@/components/layout/AppLayout";
import { SeverityBadge } from "@/components/ScoreCard";
import { motion } from "@/lib/motion-stub";
import { Eye, Clock, CheckCircle2, AlertTriangle, MessageSquare, User, Crosshair, Zap, ArrowRight, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/AnalysisContext";
import { Link } from "react-router-dom";
import { AnalysisRequiredState } from "@/components/AnalysisRequiredState";
import { useState } from "react";
import { ScoreRing, SectionNav, AnalysisSection, InlineTip } from "@/components/analysis/AnalysisShell";

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

export default function RecruiterView() {
  const { analysis } = useAnalysis();
  const [showHeatmap, setShowHeatmap] = useState(true);

  if (!analysis) return (
    <AppLayout title="Recruiter View">
      <AnalysisRequiredState
        pageTitle="Recruiter View Simulation"
        description="Upload your resume to see how recruiters perceive it in their 6-second scan — first impressions, eye path, and more."
      />
    </AppLayout>
  );

  const r = analysis.recruiter_analysis;
  const score = analysis.scores.recruiter_readability;
  const scan = r.six_second_scan;

  const sections = [
    ...(scan ? [{ id: "rv-scan", label: "6-Second Scan" }] : []),
    { id: "rv-heatmap", label: "Attention Map" },
    { id: "rv-impression", label: "First Impression" },
    ...(r.emotional_response || r.comparison_to_ideal ? [{ id: "rv-perception", label: "Perception" }] : []),
    ...(r.hiring_manager_notes?.length ? [{ id: "rv-notes", label: "HM Notes", count: r.hiring_manager_notes.length }] : []),
    ...(r.issues?.length ? [{ id: "rv-issues", label: "Issues", count: r.issues.length }] : []),
  ];

  return (
    <AppLayout title="Recruiter View">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2 pb-3 bg-background/80 backdrop-blur-lg border-b border-border/50 mb-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <ScoreRing score={score.score} size={52} strokeWidth={5} />
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight">Recruiter Readability</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">What recruiters see in their 6-second scan</p>
              </div>
            </div>
            <Link to="/builder"><Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"><PenTool className="h-3 w-3" /> Fix in Builder</Button></Link>
          </div>
          <SectionNav sections={sections} />
        </div>

        {/* 6-Second Scan */}
        {scan && (
          <AnalysisSection id="rv-scan" title="6-Second Scan Simulation" subtitle={scan.immediate_verdict} icon={<Clock className="h-4 w-4" />}>
            <div className="p-4 sm:p-5">
              <div className="grid sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Eye Path (in order)</p>
                  <div className="space-y-2">
                    {scan.eye_path?.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Immediate Verdict</p>
                    <p className="text-sm font-semibold">{scan.immediate_verdict}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/50 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Role Clarity</p>
                      <SeverityBadge level={scan.clarity_of_role === "clear" ? "excellent" : scan.clarity_of_role === "vague" ? "warning" : "critical"} label={scan.clarity_of_role} />
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Seniority Read</p>
                      <p className="text-sm font-semibold">{scan.seniority_read}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">What Gets Noticed</p>
                  <div className="space-y-2">
                    {(r.noticed || []).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-score-excellent shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">What Gets Missed</p>
                  <div className="space-y-2">
                    {(r.missed || []).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-3.5 w-3.5 text-score-warning shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <InlineTip className="mt-4">Recruiters spend an average of 6 seconds on initial screening. Make sure your name, title, and top 2 bullets deliver your value proposition immediately.</InlineTip>
            </div>
          </AnalysisSection>
        )}

        {/* Attention Heatmap */}
        <AnalysisSection id="rv-heatmap" title="Attention Heatmap" subtitle="Where recruiters spend time on your resume" icon={<Zap className="h-4 w-4" />}>
          <div className="p-4 sm:p-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="relative rounded-lg border bg-card overflow-hidden" style={{ minHeight: 380 }}>
                {heatmapZones.map(zone => (
                  <div
                    key={zone.label}
                    className={`absolute left-0 right-0 border-l-4 px-3 flex items-center ${attentionColor[zone.attention]}`}
                    style={{ top: `${zone.y}%`, height: `${zone.h}%` }}
                  >
                    <span className="text-[10px] font-medium text-foreground/70">{zone.label}</span>
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
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Key Insights</p>
                  <div className="space-y-2">
                    {[
                      "80% of scan time is on the top third",
                      "Your name, title, and first 2 bullets get most attention",
                      "Content below the fold is often skipped initially",
                      "Summary section is your 3-second pitch",
                    ].map((insight, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <ArrowRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnalysisSection>

        {/* First Impression */}
        <AnalysisSection id="rv-impression" title="First Impression Verdict" icon={<Eye className="h-4 w-4" />}>
          <div className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{r.first_impression}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Perceived Role", value: r.perceived_role },
                { label: "Perceived Level", value: r.perceived_level },
                { label: "Perceived Strength", value: r.perceived_strength },
                { label: "Perceived Industry", value: r.perceived_industry || "N/A" },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-lg bg-secondary/50 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">{item.label}</p>
                  <p className="text-sm font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </AnalysisSection>

        {/* Emotional + Comparison */}
        {(r.emotional_response || r.comparison_to_ideal) && (
          <div id="rv-perception" className="scroll-mt-36 grid sm:grid-cols-2 gap-4">
            {r.emotional_response && (
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-accent" /> Emotional Response
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.emotional_response}</p>
              </div>
            )}
            {r.comparison_to_ideal && (
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Crosshair className="h-4 w-4 text-primary" /> vs. Ideal Candidate
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.comparison_to_ideal}</p>
              </div>
            )}
          </div>
        )}

        {/* Hiring Manager Notes */}
        {r.hiring_manager_notes && r.hiring_manager_notes.length > 0 && (
          <AnalysisSection id="rv-notes" title="Hiring Manager Notes" subtitle={`${r.hiring_manager_notes.length} observations`} icon={<User className="h-4 w-4" />}>
            <div className="p-4 sm:p-5 space-y-2">
              {r.hiring_manager_notes.map((note, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{note}</p>
                </div>
              ))}
            </div>
          </AnalysisSection>
        )}

        {/* Issues */}
        {r.issues?.length > 0 && (
          <AnalysisSection id="rv-issues" title="Readability Issues" subtitle={`${r.issues.length} issues to fix`} icon={<AlertTriangle className="h-4 w-4" />}>
            <div className="p-4 sm:p-5 space-y-3">
              {r.issues.map((item, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-start gap-3">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      item.severity === "risk" ? "bg-score-risk" : "bg-score-warning"
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm">{item.issue}</p>
                      {item.fix && <p className="text-xs score-excellent mt-1">Fix: {item.fix}</p>}
                    </div>
                    <Link to="/builder">
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 shrink-0">
                        <PenTool className="h-3 w-3" /> Fix
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </AnalysisSection>
        )}
      </div>
    </AppLayout>
  );
}
