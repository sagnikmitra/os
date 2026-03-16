import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import AIProgressLoader from "@/components/AIProgressLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BookOpen, GraduationCap, Award, Code2,
  Calendar, Users, Globe, Clock, Target,
  CheckCircle2, ChevronRight, ArrowRight,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAnalysis } from "@/context/AnalysisContext";
import ResumeSourceSelector from "@/components/ResumeSourceSelector";
import { useResumeSource } from "@/hooks/useResumeSource";
import { InlineTip, AnalysisSection } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

const severityColor: Record<string, string> = {
  critical: "bg-score-critical/10 text-score-critical border-score-critical/20",
  important: "bg-score-warning/10 text-score-warning border-score-warning/20",
  "nice-to-have": "bg-primary/10 text-primary border-primary/20",
};

export default function LearningRoadmap() {
  const { analysis } = useAnalysis();
  const resume = useResumeSource();
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const handleAnalyze = async () => {
    const resumeText = resume.getResumeText();
    if (!resumeText && !analysis) { toast.error("Select a resume or paste text"); return; }
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("learning-roadmap", {
        body: { resumeText: resumeText || "Use analysis data", targetRole: targetRole || undefined },
      });
      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);
      setData(result);
      toast.success("Learning roadmap created!");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <AppLayout title="Learning Roadmap" subtitle="Personalized skills development plan with courses, certs, and projects">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {!data && !loading ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <motion.div {...fade(0)}>
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1">Learning Roadmap</h1>
                <p className="text-sm text-muted-foreground">AI-generated skills development plan with courses, certifications, and portfolio projects.</p>
              </motion.div>

              <motion.div {...fade(1)} className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Your Profile</h3>
                </div>

                <ResumeSourceSelector {...resume} textareaRows={4} />

                <div className="space-y-1.5">
                  <Label className="text-xs">Target Role <span className="text-muted-foreground font-normal">(optional — focuses the roadmap)</span></Label>
                  <Input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g., Senior Data Engineer, Staff Frontend Developer" />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <InlineTip className="flex-1">Includes phased plan, certifications with ROI, courses, portfolio projects, and community recommendations.</InlineTip>
                  <Button className="gap-2 shrink-0" onClick={handleAnalyze}>
                    <BookOpen className="h-4 w-4" /> Generate Roadmap
                  </Button>
                </div>
              </motion.div>

              <motion.div {...fade(2)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
                <GraduationCap className="h-10 w-10 text-primary/40 mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">Level Up Strategically</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Get a phased learning plan with skill gaps, certifications, courses, and portfolio projects — all prioritized by impact on your career.
                </p>
                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                  {["Skills Gap Analysis", "Phased Plan", "Certifications", "Portfolio Projects"].map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full border bg-secondary/50">{tag}</span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rounded-xl border bg-card p-12">
                <AIProgressLoader loading={loading} context="career" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">Your Learning Roadmap</h2>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setData(null)}>
                  <ArrowRight className="h-3 w-3" /> New Roadmap
                </Button>
              </div>

              {/* Summary */}
              {data.summary && (
                <motion.div {...fade(0)} className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
                  <p className="text-sm leading-relaxed">{data.summary}</p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {data.weekly_time_commitment && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground px-2.5 py-1 rounded-lg bg-secondary/50">
                        <Clock className="h-3 w-3" /> {data.weekly_time_commitment}/week
                      </span>
                    )}
                    {data.estimated_total_investment && (
                      <span className="text-xs text-muted-foreground px-2.5 py-1 rounded-lg bg-secondary/50">
                        💰 {data.estimated_total_investment}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

              <Tabs defaultValue="gaps" className="space-y-4">
                <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
                  <TabsTrigger value="gaps" className="gap-1.5 text-xs"><Target className="h-3 w-3" /> Skills Gap</TabsTrigger>
                  <TabsTrigger value="plan" className="gap-1.5 text-xs"><Calendar className="h-3 w-3" /> Phased Plan</TabsTrigger>
                  <TabsTrigger value="certs" className="gap-1.5 text-xs"><Award className="h-3 w-3" /> Certifications</TabsTrigger>
                  <TabsTrigger value="courses" className="gap-1.5 text-xs"><GraduationCap className="h-3 w-3" /> Courses</TabsTrigger>
                  <TabsTrigger value="projects" className="gap-1.5 text-xs"><Code2 className="h-3 w-3" /> Projects</TabsTrigger>
                  <TabsTrigger value="community" className="gap-1.5 text-xs"><Users className="h-3 w-3" /> Community</TabsTrigger>
                </TabsList>

                {/* Skills Gap */}
                <TabsContent value="gaps" className="space-y-3">
                  {data.skills_gap?.map((s: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{s.skill}</span>
                          <Badge variant="outline" className={`text-[10px] border ${severityColor[s.severity] || ""}`}>{s.severity}</Badge>
                        </div>
                        {s.time_to_learn && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {s.time_to_learn}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-secondary/50">{s.current_level}</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{s.target_level}</span>
                      </div>
                      {s.how_to_learn && <p className="text-xs text-muted-foreground leading-relaxed">{s.how_to_learn}</p>}
                    </motion.div>
                  ))}
                </TabsContent>

                {/* Phased Plan */}
                <TabsContent value="plan" className="space-y-4">
                  {data.phased_plan && Object.entries(data.phased_plan).map(([phase, actions]: [string, any], pi) => {
                    const label: Record<string, string> = { thirty_days: "30 Days", sixty_days: "60 Days", ninety_days: "90 Days", six_months: "6 Months", one_year: "1 Year" };
                    const colors = ["border-blue-500/30 bg-blue-500/5", "border-emerald-500/30 bg-emerald-500/5", "border-purple-500/30 bg-purple-500/5", "border-amber-500/30 bg-amber-500/5", "border-rose-500/30 bg-rose-500/5"];
                    return (
                      <motion.div key={phase} {...fade(pi)} className={`rounded-xl border-2 p-5 ${colors[pi % colors.length]}`}>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" /> {label[phase] || phase}
                        </h3>
                        <div className="space-y-2">
                          {actions?.map((a: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm font-medium">{a.action}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{a.goal}</p>
                                {a.metric && <p className="text-[10px] text-primary mt-0.5 font-medium">📊 {a.metric}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </TabsContent>

                {/* Certifications */}
                <TabsContent value="certs" className="space-y-3">
                  {data.certifications?.map((c: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary" /> {c.name}
                        </h4>
                        <Badge variant={c.priority === "high" ? "default" : "secondary"} className="text-[10px]">{c.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.provider}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {c.cost && <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/50">💰 {c.cost}</span>}
                        {c.duration && <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/50">⏱ {c.duration}</span>}
                        {c.salary_impact && <span className="text-[10px] px-2 py-0.5 rounded-md bg-score-excellent/10 text-score-excellent">📈 {c.salary_impact}</span>}
                      </div>
                      {c.roi_estimate && <p className="text-[10px] text-primary mt-1.5 font-medium">ROI: {c.roi_estimate}</p>}
                    </motion.div>
                  ))}
                </TabsContent>

                {/* Courses */}
                <TabsContent value="courses" className="space-y-3">
                  {data.courses?.map((c: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="font-medium text-sm">{c.title}</h4>
                        <Badge variant="outline" className="text-[10px]">{c.platform}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {c.instructor && <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/50">👤 {c.instructor}</span>}
                        {c.duration && <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/50">⏱ {c.duration}</span>}
                        {c.cost && <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/50">💰 {c.cost}</span>}
                        {c.rating && <span className="text-[10px] px-2 py-0.5 rounded-md bg-score-warning/10 text-score-warning">⭐ {c.rating}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">Covers: {c.skill_covered}</p>
                    </motion.div>
                  ))}
                </TabsContent>

                {/* Portfolio Projects */}
                <TabsContent value="projects" className="space-y-3">
                  {data.portfolio_projects?.map((p: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-5">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Code2 className="h-4 w-4 text-primary" /> {p.name}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{p.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {p.skills_demonstrated?.map((s: string, si: number) => (
                          <Badge key={si} variant="secondary" className="text-[10px]">{s}</Badge>
                        ))}
                      </div>
                      <div className="flex gap-3 mt-2">
                        {p.difficulty && <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/50">📊 {p.difficulty}</span>}
                        {p.estimated_time && <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/50">⏱ {p.estimated_time}</span>}
                      </div>
                      {p.impact_on_resume && <p className="text-[10px] text-primary mt-1.5 font-medium">Impact: {p.impact_on_resume}</p>}
                    </motion.div>
                  ))}
                </TabsContent>

                {/* Community */}
                <TabsContent value="community" className="space-y-4">
                  {data.communities?.length > 0 && (
                    <AnalysisSection id="lr-communities" title="Communities" icon={<Users className="h-4 w-4" />}>
                      <div className="p-4 sm:p-5 space-y-2">
                        {data.communities.map((c: any, i: number) => (
                          <div key={i} className="p-3 rounded-lg bg-secondary/30">
                            <h4 className="font-medium text-sm">{c.name}</h4>
                            <p className="text-xs text-muted-foreground">{c.type} — {c.why}</p>
                          </div>
                        ))}
                      </div>
                    </AnalysisSection>
                  )}
                  {data.conferences?.length > 0 && (
                    <AnalysisSection id="lr-conferences" title="Conferences" icon={<Globe className="h-4 w-4" />}>
                      <div className="p-4 sm:p-5 space-y-2">
                        {data.conferences.map((c: any, i: number) => (
                          <div key={i} className="p-3 rounded-lg bg-secondary/30">
                            <h4 className="font-medium text-sm">{c.name}</h4>
                            <p className="text-xs text-muted-foreground">{c.focus}</p>
                            {c.typical_cost && <p className="text-[10px] text-muted-foreground mt-0.5">💰 {c.typical_cost}</p>}
                          </div>
                        ))}
                      </div>
                    </AnalysisSection>
                  )}
                  {data.books?.length > 0 && (
                    <AnalysisSection id="lr-books" title="Recommended Books" icon={<BookOpen className="h-4 w-4" />}>
                      <div className="p-4 sm:p-5 space-y-2">
                        {data.books.map((b: any, i: number) => (
                          <div key={i} className="p-3 rounded-lg bg-secondary/30">
                            <h4 className="font-medium text-sm">{b.title}</h4>
                            <p className="text-xs text-muted-foreground">by {b.author} — {b.why}</p>
                          </div>
                        ))}
                      </div>
                    </AnalysisSection>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
