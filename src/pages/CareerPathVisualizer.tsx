import { useState } from "react";
import { motion } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Route, ArrowRight, Clock, DollarSign, Sparkles, Search } from "lucide-react";
import ResumeSourceSelector from "@/components/ResumeSourceSelector";
import { useResumeSource } from "@/hooks/useResumeSource";
import AIProgressLoader from "@/components/AIProgressLoader";
import { InlineTip, AnalysisSection } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

const pathColors = [
  "border-primary/30 bg-primary/5",
  "border-score-excellent/30 bg-score-excellent/5",
  "border-score-warning/30 bg-score-warning/5",
  "border-score-risk/30 bg-score-risk/5",
];

export default function CareerPathVisualizer() {
  const resume = useResumeSource();
  const [currentRole, setCurrentRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const handleVisualize = async () => {
    if (!currentRole) { toast.error("Enter your current role"); return; }
    setLoading(true);
    try {
      const resumeText = resume.getResumeText();
      const { data: res, error } = await supabase.functions.invoke("career-path-visualizer", { body: { currentRole, resumeText } });
      if (error) throw error;
      setData(res);
      toast.success("Career paths mapped!");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <AppLayout title="Career Path Visualizer" subtitle="Explore possible career trajectories from your current role">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {!data && !loading && (
          <>
            <motion.div {...fade(0)} className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Route className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Map Your Career Paths</h3>
              </div>
              <ResumeSourceSelector {...resume} textareaRows={4} />
              <div className="space-y-1.5">
                <Label className="text-xs">Current Role <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="e.g., Senior Software Engineer" value={currentRole} onChange={e => setCurrentRole(e.target.value)} className="pl-9" onKeyDown={e => e.key === "Enter" && handleVisualize()} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <InlineTip className="flex-1">AI maps multiple career trajectories with timelines, salary growth, and skill requirements.</InlineTip>
                <Button onClick={handleVisualize} className="gap-2 shrink-0">
                  <Route className="h-4 w-4" /> Visualize Paths
                </Button>
              </div>
            </motion.div>

            <motion.div {...fade(1)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
              <Route className="h-10 w-10 text-primary/40 mx-auto mb-4" />
              <h3 className="font-display text-lg font-bold mb-2">See Where You Could Go</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Discover multiple career trajectories from your current role — with step-by-step timelines, salary projections, and required skills.
              </p>
              <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                {["Multiple Paths", "Timelines", "Salary Growth", "Skill Requirements"].map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-full border bg-secondary/50">{tag}</span>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {loading && (
          <div className="rounded-xl border bg-card p-12">
            <AIProgressLoader loading={loading} context="career" />
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            {/* Career Paths */}
            {data.paths?.map((path: any, pi: number) => (
              <motion.div key={pi} {...fade(pi)} className={`rounded-xl border-2 p-5 sm:p-6 ${pathColors[pi % pathColors.length]}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">{pi + 1}</span>
                  <div>
                    <h3 className="font-semibold text-sm">{path.name}</h3>
                    <p className="text-xs text-muted-foreground">{path.description}</p>
                  </div>
                </div>

                {/* Steps Timeline */}
                {path.steps?.length > 0 && (
                  <div className="flex items-stretch gap-0 overflow-x-auto pb-2 ml-11">
                    {path.steps.map((step: any, si: number) => (
                      <div key={si} className="flex items-center">
                        <div className="p-3 border rounded-xl bg-card text-center min-w-[140px] hover:shadow-sm transition-shadow">
                          <p className="text-xs font-semibold">{step.title}</p>
                          {step.timeline && (
                            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5 mt-1">
                              <Clock className="h-2.5 w-2.5" />{step.timeline}
                            </p>
                          )}
                          {step.salary && (
                            <p className="text-[10px] text-score-excellent flex items-center justify-center gap-0.5 mt-0.5 font-medium">
                              <DollarSign className="h-2.5 w-2.5" />{step.salary}
                            </p>
                          )}
                        </div>
                        {si < (path.steps?.length || 0) - 1 && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground mx-2 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Skills */}
                {path.skills_needed?.length > 0 && (
                  <div className="mt-3 ml-11">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Skills Needed</p>
                    <div className="flex flex-wrap gap-1.5">
                      {path.skills_needed.map((s: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            <Button variant="outline" onClick={() => setData(null)} className="gap-2">
              <Route className="h-4 w-4" /> Visualize Again
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
