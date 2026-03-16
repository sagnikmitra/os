import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DollarSign, TrendingUp, MapPin, Briefcase,
  Target, BarChart3, Building2, Zap, ArrowUpRight, ArrowDownRight,
  Star, ChevronDown, ChevronUp, Globe, Users, Sparkles, ArrowRight,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAnalysis } from "@/context/AnalysisContext";
import ResumeSourceSelector from "@/components/ResumeSourceSelector";
import { useResumeSource } from "@/hooks/useResumeSource";
import AIProgressLoader from "@/components/AIProgressLoader";
import { InlineTip, AnalysisSection } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export default function CareerIntelligence() {
  const { analysis } = useAnalysis();
  const resume = useResumeSource();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [expandedPath, setExpandedPath] = useState<number | null>(null);

  const handleAnalyze = async () => {
    const resumeText = resume.getResumeText();
    if (!resumeText && !analysis) { toast.error("Select a resume or paste text"); return; }
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("career-intelligence", {
        body: { resumeText: resumeText || "Use analysis data", analysisData: analysis || null },
      });
      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);
      setData(result);
      toast.success("Career intelligence generated!");
    } catch (e: any) { toast.error(e.message || "Failed to analyze"); }
    finally { setLoading(false); }
  };

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

  return (
    <AppLayout title="Career Intelligence" subtitle="Deep market analysis, salary insights, and career path predictions">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {!data && !loading ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <motion.div {...fade(0)}>
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1">Career Intelligence</h1>
                <p className="text-sm text-muted-foreground">AI-powered market analysis with salary insights, career paths, and demand forecasting.</p>
              </motion.div>

              <motion.div {...fade(1)} className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Your Profile</h3>
                </div>

                <ResumeSourceSelector {...resume} textareaRows={4} />

                {analysis && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground">Analysis data detected — will be used for enhanced insights</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4">
                  <InlineTip className="flex-1">Generates salary data, career paths, market demand, role fit scores, and geographic insights.</InlineTip>
                  <Button className="gap-2 shrink-0" onClick={handleAnalyze}>
                    <BarChart3 className="h-4 w-4" /> Generate Intelligence
                  </Button>
                </div>
              </motion.div>

              <motion.div {...fade(2)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
                <TrendingUp className="h-10 w-10 text-primary/40 mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">Know Your Market</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Get comprehensive career intelligence including salary benchmarks, career trajectories, and market demand — all personalized to your profile.
                </p>
                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                  {["Salary Intelligence", "Career Paths", "Market Demand", "Role Fit", "Geography"].map(tag => (
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
                <h2 className="text-lg font-bold tracking-tight">Career Intelligence Report</h2>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setData(null)}>
                  <ArrowRight className="h-3 w-3" /> Analyze Again
                </Button>
              </div>

              {/* Overall Assessment */}
              {data.overall_assessment && (
                <motion.div {...fade(0)} className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-sm mb-1">Market Assessment</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{data.overall_assessment.one_liner}</p>
                    </div>
                    <div className="text-center shrink-0 ml-4">
                      <p className="text-3xl font-bold text-primary tabular-nums">{data.overall_assessment.market_readiness}</p>
                      <p className="text-[10px] text-muted-foreground">/100</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Strongest Signal", value: data.overall_assessment.strongest_signal, color: "border-primary/20 bg-primary/5" },
                      { label: "Biggest Opportunity", value: data.overall_assessment.biggest_opportunity, color: "border-score-excellent/20 bg-score-excellent/5" },
                      { label: "Biggest Risk", value: data.overall_assessment.biggest_risk, color: "border-destructive/20 bg-destructive/5" },
                    ].map((item, i) => (
                      <div key={i} className={`rounded-lg p-3 border ${item.color}`}>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">{item.label}</p>
                        <p className="text-xs leading-relaxed">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <Tabs defaultValue="salary" className="space-y-4">
                <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
                  <TabsTrigger value="salary" className="gap-1.5 text-xs"><DollarSign className="h-3 w-3" /> Salary</TabsTrigger>
                  <TabsTrigger value="paths" className="gap-1.5 text-xs"><TrendingUp className="h-3 w-3" /> Career Paths</TabsTrigger>
                  <TabsTrigger value="demand" className="gap-1.5 text-xs"><Target className="h-3 w-3" /> Market Demand</TabsTrigger>
                  <TabsTrigger value="roles" className="gap-1.5 text-xs"><Briefcase className="h-3 w-3" /> Role Fit</TabsTrigger>
                  <TabsTrigger value="geo" className="gap-1.5 text-xs"><MapPin className="h-3 w-3" /> Geography</TabsTrigger>
                </TabsList>

                {/* Salary Tab */}
                <TabsContent value="salary" className="space-y-4">
                  {data.salary_intelligence && (
                    <>
                      {data.salary_intelligence.estimated_base_range && (
                        <motion.div {...fade(0)} className="grid grid-cols-3 gap-3">
                          {["low", "mid", "high"].map((tier) => (
                            <div key={tier} className={`rounded-xl p-4 text-center border-2 ${tier === "mid" ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{tier === "low" ? "Conservative" : tier === "mid" ? "Market Rate" : "Top End"}</p>
                              <p className={`text-xl sm:text-2xl font-bold tabular-nums mt-1 ${tier === "mid" ? "text-primary" : "text-foreground"}`}>
                                {fmt(data.salary_intelligence.estimated_base_range[tier])}
                              </p>
                              <p className="text-[10px] text-muted-foreground">base salary</p>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {data.salary_intelligence.by_company_tier?.length > 0 && (
                        <AnalysisSection id="ci-tiers" title="By Company Tier" icon={<Building2 className="h-4 w-4" />}>
                          <div className="p-4 sm:p-5 space-y-2">
                            {data.salary_intelligence.by_company_tier.map((t: any, i: number) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-sm font-medium">{t.tier}</span>
                                </div>
                                <div className="flex gap-4 text-xs text-muted-foreground tabular-nums">
                                  <span>Base: {t.base}</span>
                                  <span>Total: {t.total_comp}</span>
                                  {t.equity && <span>Equity: {t.equity}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </AnalysisSection>
                      )}

                      <div className="grid sm:grid-cols-2 gap-4">
                        <motion.div {...fade(1)} className="rounded-xl border bg-card p-4 sm:p-5">
                          <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                            <ArrowUpRight className="h-3.5 w-3.5 text-score-excellent" /> Factors Increasing Pay
                          </h4>
                          <div className="space-y-1.5">
                            {data.salary_intelligence.factors_increasing_pay?.map((f: string, i: number) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <Zap className="h-3 w-3 mt-0.5 text-score-excellent shrink-0" />
                                <span className="text-muted-foreground leading-relaxed">{f}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                        <motion.div {...fade(2)} className="rounded-xl border bg-card p-4 sm:p-5">
                          <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                            <ArrowDownRight className="h-3.5 w-3.5 text-destructive" /> Factors Limiting Pay
                          </h4>
                          <div className="space-y-1.5">
                            {data.salary_intelligence.factors_limiting_pay?.map((f: string, i: number) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <span className="text-destructive mt-0.5 shrink-0">•</span>
                                <span className="text-muted-foreground leading-relaxed">{f}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* Career Paths Tab */}
                <TabsContent value="paths" className="space-y-3">
                  {data.career_paths?.map((path: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card overflow-hidden">
                      <button
                        onClick={() => setExpandedPath(expandedPath === i ? null : i)}
                        className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-secondary/20 transition-colors"
                      >
                        <div className="flex items-center gap-3 text-left">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            i === 0 ? "bg-primary/10 text-primary" : i === 1 ? "bg-score-excellent/10 text-score-excellent" : "bg-score-warning/10 text-score-warning"
                          }`}>{i + 1}</span>
                          <div>
                            <p className="font-semibold text-sm">{path.trajectory}</p>
                            <p className="text-xs text-muted-foreground">{path.next_role} → {path.five_year_role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {path.probability && <Badge variant="outline" className="text-[10px] tabular-nums">{path.probability}% likely</Badge>}
                          {expandedPath === i ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </button>
                      <AnimatePresence>
                        {expandedPath === i && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t overflow-hidden">
                            <div className="p-4 sm:p-5 space-y-3">
                              <p className="text-sm text-muted-foreground leading-relaxed">{path.description}</p>
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                {path.timeline && <span className="px-2.5 py-1 rounded-lg bg-secondary/50">📅 {path.timeline}</span>}
                                {path.salary_growth && <span className="px-2.5 py-1 rounded-lg bg-score-excellent/10 text-score-excellent">📈 {path.salary_growth}</span>}
                              </div>
                              {path.required_skills?.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold mb-1.5">Required Skills</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {path.required_skills.map((s: string, si: number) => (
                                      <Badge key={si} variant="secondary" className="text-[10px]">{s}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {path.key_actions?.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold mb-1.5">Key Actions</p>
                                  <div className="space-y-1">
                                    {path.key_actions.map((a: string, ai: number) => (
                                      <div key={ai} className="flex items-start gap-2 text-xs">
                                        <Star className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                                        <span className="text-muted-foreground leading-relaxed">{a}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </TabsContent>

                {/* Market Demand Tab */}
                <TabsContent value="demand" className="space-y-4">
                  {data.market_demand && (
                    <>
                      <motion.div {...fade(0)} className="rounded-xl border bg-card p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-sm">Overall Market Demand</h3>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-primary tabular-nums">{data.market_demand.demand_score}</p>
                            <p className="text-[10px] text-muted-foreground">/100</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{data.market_demand.overall_demand}</p>
                        {data.market_demand.supply_demand_ratio && (
                          <p className="text-xs text-muted-foreground mt-2 px-2.5 py-1 rounded-lg bg-secondary/50 w-fit">Supply/Demand: {data.market_demand.supply_demand_ratio}</p>
                        )}
                      </motion.div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <motion.div {...fade(1)} className="rounded-xl border bg-card p-4 sm:p-5">
                          <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-score-excellent" /> Trending Up
                          </h4>
                          <div className="space-y-2">
                            {data.market_demand.trending_up_skills?.map((s: any, i: number) => (
                              <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-secondary/30">
                                <span className="font-medium">{s.skill}</span>
                                <span className="text-score-excellent">{s.demand_level || s.trend}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                        <motion.div {...fade(2)} className="rounded-xl border bg-card p-4 sm:p-5">
                          <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-score-warning" /> Emerging Skills to Learn
                          </h4>
                          <div className="space-y-2">
                            {data.market_demand.emerging_skills_to_learn?.map((s: any, i: number) => (
                              <div key={i} className="p-2.5 rounded-lg bg-secondary/30">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">{s.skill}</span>
                                  <Badge variant={s.urgency === "high" ? "destructive" : "secondary"} className="text-[10px]">{s.urgency}</Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">{s.why}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* Role Fit Tab */}
                <TabsContent value="roles" className="space-y-3">
                  {data.role_fit_analysis?.map((role: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" /> {role.role}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Progress value={role.fit_score} className="w-20 h-2" />
                          <span className="text-xs font-bold tabular-nums">{role.fit_score}%</span>
                        </div>
                      </div>
                      {role.why_good_fit && <p className="text-xs text-muted-foreground leading-relaxed">{role.why_good_fit}</p>}
                      {role.gaps?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {role.gaps.map((g: string, gi: number) => (
                            <Badge key={gi} variant="outline" className="text-[10px] border-destructive/30 text-destructive">{g}</Badge>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </TabsContent>

                {/* Geography Tab */}
                <TabsContent value="geo" className="space-y-3">
                  {data.geographic_insights?.map((geo: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" /> {geo.location}
                        </h4>
                        {geo.demand_level && <Badge variant="outline" className="text-[10px]">{geo.demand_level}</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {geo.salary_range && <span className="px-2.5 py-1 rounded-lg bg-secondary/50 tabular-nums">{geo.salary_range}</span>}
                        {geo.cost_of_living && <span className="px-2.5 py-1 rounded-lg bg-secondary/50">COL: {geo.cost_of_living}</span>}
                        {geo.remote_friendly !== undefined && (
                          <span className={`px-2.5 py-1 rounded-lg ${geo.remote_friendly ? "bg-score-excellent/10 text-score-excellent" : "bg-secondary/50"}`}>
                            {geo.remote_friendly ? "Remote Friendly" : "On-site preferred"}
                          </span>
                        )}
                      </div>
                      {geo.top_employers?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {geo.top_employers.map((e: string, ei: number) => (
                            <Badge key={ei} variant="secondary" className="text-[10px]">{e}</Badge>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
