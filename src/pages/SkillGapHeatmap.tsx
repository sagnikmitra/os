import { useState } from "react";
import AIProgressLoader from "@/components/AIProgressLoader";
import { motion } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Grid3X3, TrendingUp, ArrowRight, Target, Lightbulb } from "lucide-react";
import ResumeSourceSelector from "@/components/ResumeSourceSelector";
import { useResumeSource } from "@/hooks/useResumeSource";
import { InlineTip, AnalysisSection } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

const heatColor = (level: number) => {
  if (level >= 80) return "bg-score-excellent/15 border-score-excellent/30 text-score-excellent";
  if (level >= 60) return "bg-score-strong/15 border-score-strong/30 text-score-strong";
  if (level >= 40) return "bg-score-warning/15 border-score-warning/30 text-score-warning";
  if (level >= 20) return "bg-score-risk/15 border-score-risk/30 text-score-risk";
  return "bg-score-critical/15 border-score-critical/30 text-score-critical";
};

const heatLabel = (level: number) => {
  if (level >= 80) return "Strong";
  if (level >= 60) return "Good";
  if (level >= 40) return "Moderate";
  if (level >= 20) return "Weak";
  return "Critical Gap";
};

export default function SkillGapHeatmap() {
  const resume = useResumeSource();
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!targetRole) { toast.error("Enter a target role"); return; }
    setLoading(true);
    try {
      const resumeText = resume.getResumeText();
      const { data: res, error } = await supabase.functions.invoke("skill-gap-heatmap", { body: { targetRole, resumeText } });
      if (error) throw error;
      setData(res);
      toast.success("Heatmap ready!");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  const sorted = data?.skills ? [...data.skills].sort((a: any, b: any) => (a.level || 0) - (b.level || 0)) : [];

  return (
    <AppLayout title="Skill Gap Heatmap" subtitle="Visual map of your skills vs market demand">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {!loading && !data && (
          <>
            <motion.div {...fade(0)} className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Grid3X3 className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Analyze Your Skill Gaps</h3>
              </div>
              <ResumeSourceSelector {...resume} textareaRows={4} />
              <div className="space-y-1.5">
                <Label className="text-xs">Target Role <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g., Staff Engineer, Product Manager, Data Scientist" value={targetRole} onChange={e => setTargetRole(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAnalyze()} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <InlineTip className="flex-1">Your skills will be scored against market requirements for the target role.</InlineTip>
                <Button onClick={handleAnalyze} className="gap-2 shrink-0">
                  <Grid3X3 className="h-4 w-4" /> Generate Heatmap
                </Button>
              </div>
            </motion.div>

            <motion.div {...fade(1)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
              <Target className="h-10 w-10 text-primary/40 mx-auto mb-4" />
              <h3 className="font-display text-lg font-bold mb-2">Visualize Your Gaps</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                See exactly which skills you need to develop for your target role, with a color-coded heatmap and priority recommendations.
              </p>
              <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                {["Skill Scoring", "Gap Analysis", "Priority Actions", "Learning Paths"].map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-full border bg-secondary/50">{tag}</span>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {loading && (
          <div className="rounded-xl border bg-card p-12">
            <AIProgressLoader loading={loading} context="analysis" />
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            {/* Summary */}
            {data.summary && (
              <motion.div {...fade(0)} className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
                <p className="text-sm leading-relaxed">{data.summary}</p>
              </motion.div>
            )}

            {/* Heatmap Grid */}
            {sorted.length > 0 && (
              <motion.div {...fade(1)}>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-primary" /> Skill Heatmap ({sorted.length} skills)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {sorted.map((skill: any, i: number) => (
                    <div key={i} className={`p-3.5 rounded-xl border text-center transition-transform hover:scale-[1.02] ${heatColor(skill.level || 0)}`}>
                      <p className="text-xs font-semibold truncate">{skill.name}</p>
                      <p className="text-2xl font-bold tabular-nums mt-1">{skill.level}%</p>
                      <p className="text-[10px] font-medium opacity-80 mt-0.5">{heatLabel(skill.level || 0)}</p>
                      {skill.gap && <p className="text-[10px] opacity-70 mt-1 line-clamp-2">{skill.gap}</p>}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-2 mt-4 text-[10px] text-muted-foreground flex-wrap">
                  <span className="font-semibold">Legend:</span>
                  {[
                    { range: "0-20%", label: "Critical", cls: "bg-score-critical/15 text-score-critical border-score-critical/30" },
                    { range: "20-40%", label: "Weak", cls: "bg-score-risk/15 text-score-risk border-score-risk/30" },
                    { range: "40-60%", label: "Moderate", cls: "bg-score-warning/15 text-score-warning border-score-warning/30" },
                    { range: "60-80%", label: "Good", cls: "bg-score-strong/15 text-score-strong border-score-strong/30" },
                    { range: "80-100%", label: "Strong", cls: "bg-score-excellent/15 text-score-excellent border-score-excellent/30" },
                  ].map(l => (
                    <span key={l.range} className={`px-2 py-0.5 rounded border font-medium ${l.cls}`}>{l.range} {l.label}</span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recommendations */}
            {data.recommendations?.length > 0 && (
              <AnalysisSection id="sgh-recs" title="Priority Recommendations" subtitle={`${data.recommendations.length} actions to close your gaps`} icon={<Lightbulb className="h-4 w-4" />}>
                <div className="p-4 sm:p-5 space-y-3">
                  {data.recommendations.map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="text-sm text-muted-foreground leading-relaxed">{r}</span>
                    </div>
                  ))}
                </div>
              </AnalysisSection>
            )}

            <Button variant="outline" onClick={() => setData(null)} className="gap-2">
              <Grid3X3 className="h-4 w-4" /> New Analysis
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
