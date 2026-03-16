import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { useAnalysis } from "@/context/AnalysisContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import {
  Sparkles, Loader2, Zap, Target, BookOpen, Briefcase, DollarSign,
  Calendar, ArrowRight, CheckCircle2, Clock, AlertTriangle, TrendingUp,
  Brain, MessageSquare, Shield, Lightbulb, Rocket, GraduationCap,
  Star, ChevronRight, Users, Globe,
} from "lucide-react";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04, duration: 0.35 } });

const impactColor = (impact: string) => {
  if (impact === "critical") return "bg-score-critical/10 text-score-critical border-score-critical/20";
  if (impact === "high") return "bg-score-risk/10 text-score-risk border-score-risk/20";
  return "bg-score-warning/10 text-score-warning border-score-warning/20";
};

const categoryIcon = (cat: string) => {
  switch (cat) {
    case "content": return <MessageSquare className="h-3.5 w-3.5" />;
    case "keywords": return <Target className="h-3.5 w-3.5" />;
    case "structure": return <Shield className="h-3.5 w-3.5" />;
    case "branding": return <Star className="h-3.5 w-3.5" />;
    default: return <Zap className="h-3.5 w-3.5" />;
  }
};

const importanceColor = (imp: string) => {
  if (imp === "critical") return "text-score-critical";
  if (imp === "important") return "text-score-warning";
  return "text-muted-foreground";
};

export default function SmartRecommendations() {
  const { analysis } = useAnalysis();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);

  const generateRecommendations = async () => {
    if (!analysis) { toast.error("Upload and analyze a resume first"); return; }
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("smart-recommendations", {
        body: { analysis },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.recommendations) throw new Error("No recommendations returned");

      setRecommendations(data.recommendations);
      toast.success("Recommendations generated!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (!analysis) {
    return (
      <AppLayout title="Smart Recommendations">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold mb-2">Smart Recommendations</h2>
            <p className="text-sm text-muted-foreground mb-6">Upload and analyze a resume to get personalized career recommendations.</p>
            <Link to="/upload"><Button variant="premium" className="gap-2">Upload Resume <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const r = recommendations;
  const strategy = r?.overall_strategy;

  return (
    <AppLayout title="Smart Recommendations">
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div {...fade(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" /> Smart Recommendations
            </h1>
            <p className="text-sm text-muted-foreground">AI-powered career strategy based on your resume analysis.</p>
          </div>
          <Button onClick={generateRecommendations} disabled={loading} variant="premium" className="gap-2 shrink-0">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> {r ? "Regenerate" : "Generate Recommendations"}</>}
          </Button>
        </motion.div>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border bg-card p-8 text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold mb-1">Analyzing your profile and generating recommendations…</p>
            <p className="text-xs text-muted-foreground">This typically takes 15-30 seconds.</p>
          </motion.div>
        )}

        {r && !loading && (
          <>
            {/* Strategy Overview */}
            {strategy && (
              <motion.div {...fade(1)}>
                <div className="rounded-2xl border bg-card p-5 sm:p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 brand-gradient opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <h3 className="font-display text-sm font-semibold mb-3 flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> Strategy Overview</h3>
                  <p className="text-sm text-muted-foreground mb-4">{strategy.positioning_statement}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/40 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Readiness</p>
                      <Badge variant={strategy.market_readiness === "ready" ? "default" : "secondary"} className="text-xs capitalize">
                        {strategy.market_readiness?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/40 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Weeks to Ready</p>
                      <p className="text-lg font-bold text-primary">{strategy.estimated_weeks_to_ready || "?"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/40 text-center col-span-2">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Target Roles</p>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {strategy.target_roles?.slice(0, 4).map((role: string) => (
                          <span key={role} className="px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary border border-primary/20">{role}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {strategy.competitive_advantage && (
                    <div className="mt-4 p-3 rounded-lg bg-score-excellent/5 border border-score-excellent/10">
                      <p className="text-[10px] uppercase tracking-widest text-score-excellent font-semibold mb-1">Competitive Advantage</p>
                      <p className="text-xs text-foreground">{strategy.competitive_advantage}</p>
                    </div>
                  )}
                  {strategy.biggest_gap && (
                    <div className="mt-2 p-3 rounded-lg bg-score-warning/5 border border-score-warning/10">
                      <p className="text-[10px] uppercase tracking-widest text-score-warning font-semibold mb-1">Biggest Gap</p>
                      <p className="text-xs text-foreground">{strategy.biggest_gap}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Tabbed Content */}
            <Tabs defaultValue="quick-wins" className="space-y-4">
              <TabsList className="flex flex-wrap h-auto gap-1">
                <TabsTrigger value="quick-wins" className="gap-1 text-xs"><Zap className="h-3 w-3" /> Quick Wins</TabsTrigger>
                <TabsTrigger value="skills" className="gap-1 text-xs"><BookOpen className="h-3 w-3" /> Skills</TabsTrigger>
                <TabsTrigger value="strategy" className="gap-1 text-xs"><Target className="h-3 w-3" /> Strategy</TabsTrigger>
                <TabsTrigger value="interview" className="gap-1 text-xs"><GraduationCap className="h-3 w-3" /> Interview</TabsTrigger>
                <TabsTrigger value="plan" className="gap-1 text-xs"><Calendar className="h-3 w-3" /> Action Plan</TabsTrigger>
                <TabsTrigger value="salary" className="gap-1 text-xs"><DollarSign className="h-3 w-3" /> Salary</TabsTrigger>
              </TabsList>

              {/* Quick Wins */}
              <TabsContent value="quick-wins">
                <div className="space-y-3">
                  {r.quick_wins?.map((qw: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {categoryIcon(qw.category)}
                          <span className="text-sm font-semibold">{qw.action}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`text-[10px] ${impactColor(qw.impact)}`}>{qw.impact}</Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {qw.time_minutes}m</span>
                        </div>
                      </div>
                      {qw.current_text && (
                        <div className="p-2 rounded-lg bg-score-critical/5 border border-score-critical/10 text-xs">
                          <span className="text-[10px] uppercase text-score-critical font-semibold">Current: </span>
                          <span className="text-muted-foreground">{qw.current_text}</span>
                        </div>
                      )}
                      {qw.improved_text && (
                        <div className="p-2 rounded-lg bg-score-excellent/5 border border-score-excellent/10 text-xs">
                          <span className="text-[10px] uppercase text-score-excellent font-semibold">Improved: </span>
                          <span className="text-foreground">{qw.improved_text}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Skills */}
              <TabsContent value="skills">
                <div className="space-y-3">
                  {r.skill_development?.map((skill: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="text-sm font-semibold">{skill.skill}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] capitalize">{skill.current_level}</Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <Badge className="text-[10px] capitalize">{skill.target_level}</Badge>
                          </div>
                        </div>
                        <span className={`text-[10px] uppercase font-semibold ${importanceColor(skill.importance)}`}>{skill.importance}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{skill.learning_path}</p>
                      {skill.free_resources?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {skill.free_resources.map((r: string, j: number) => (
                            <span key={j} className="px-2 py-0.5 rounded-md text-[10px] bg-secondary text-secondary-foreground border border-border">{r}</span>
                          ))}
                        </div>
                      )}
                      {skill.timeline_weeks && (
                        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1"><Clock className="h-3 w-3" /> {skill.timeline_weeks} weeks</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Application Strategy */}
              <TabsContent value="strategy">
                <div className="space-y-4">
                  {r.application_strategy && (
                    <div className="rounded-xl border bg-card p-5 space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-secondary/40">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Daily Target</p>
                          <p className="text-2xl font-bold text-primary">{r.application_strategy.daily_target}</p>
                          <p className="text-xs text-muted-foreground">applications per day</p>
                        </div>
                        <div className="p-3 rounded-lg bg-secondary/40">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Best Channels</p>
                          <div className="space-y-1">
                            {r.application_strategy.best_channels?.map((ch: string, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <Globe className="h-3 w-3 text-primary shrink-0" />
                                <span>{ch}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {r.application_strategy.networking_tips?.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Networking Tips</p>
                          <div className="space-y-1.5">
                            {r.application_strategy.networking_tips.map((tip: string, i: number) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <Users className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                                <span className="text-muted-foreground">{tip}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {r.application_strategy.cold_outreach_template && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Cold Outreach Template</p>
                          <div className="p-3 rounded-lg bg-secondary/60 text-xs whitespace-pre-wrap font-mono">{r.application_strategy.cold_outreach_template}</div>
                        </div>
                      )}

                      {r.application_strategy.linkedin_optimization?.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">LinkedIn Optimization</p>
                          <div className="space-y-1.5">
                            {r.application_strategy.linkedin_optimization.map((tip: string, i: number) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <Lightbulb className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                                <span className="text-muted-foreground">{tip}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Interview Prep */}
              <TabsContent value="interview">
                <div className="space-y-3">
                  {r.interview_preparation?.map((q: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-4 space-y-2">
                      <p className="text-sm font-semibold">"{q.question}"</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{q.why_asked}</p>
                      <div className="p-2 rounded-lg bg-score-excellent/5 border border-score-excellent/10">
                        <p className="text-[10px] uppercase text-score-excellent font-semibold mb-1">Strong Answer Framework</p>
                        <p className="text-xs text-foreground">{q.strong_answer_framework}</p>
                      </div>
                      {q.weak_answer_red_flags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {q.weak_answer_red_flags.map((flag: string, j: number) => (
                            <span key={j} className="px-2 py-0.5 rounded-md text-[10px] bg-score-critical/10 text-score-critical border border-score-critical/20">{flag}</span>
                          ))}
                        </div>
                      )}
                      {q.practice_tip && (
                        <p className="text-xs text-primary/80 italic flex items-center gap-1"><Lightbulb className="h-3 w-3 shrink-0" /> {q.practice_tip}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Weekly Action Plan */}
              <TabsContent value="plan">
                <div className="space-y-3">
                  {r.weekly_action_plan?.map((week: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">W{week.week}</div>
                        <div>
                          <p className="text-sm font-semibold">{week.theme}</p>
                          {week.milestone && <p className="text-[10px] text-muted-foreground">{week.milestone}</p>}
                        </div>
                      </div>
                      <div className="space-y-1.5 pl-11">
                        {week.tasks?.map((task: string, j: number) => (
                          <div key={j} className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="h-3 w-3 text-muted-foreground/40 mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">{task}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Salary */}
              <TabsContent value="salary">
                {r.salary_insights && (
                  <div className="rounded-xl border bg-card p-5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-secondary/40 text-center">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Estimated Range</p>
                        <p className="text-xl font-bold text-primary">{r.salary_insights.estimated_range}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/40 text-center">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Market Position</p>
                        <p className="text-lg font-semibold capitalize">{r.salary_insights.market_position}</p>
                      </div>
                    </div>
                    {r.salary_insights.negotiation_leverage?.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Negotiation Leverage</p>
                        <div className="space-y-1.5">
                          {r.salary_insights.negotiation_leverage.map((l: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <TrendingUp className="h-3 w-3 text-score-excellent mt-0.5 shrink-0" />
                              <span className="text-muted-foreground">{l}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {r.salary_insights.tips?.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Tips</p>
                        <div className="space-y-1.5">
                          {r.salary_insights.tips.map((t: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <Lightbulb className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                              <span className="text-muted-foreground">{t}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
}
