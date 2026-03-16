import { useState } from "react";
import { motion } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Building2, Star, Users, TrendingUp, AlertTriangle, Globe, CheckCircle2, Briefcase, BookOpen, DollarSign, Lightbulb, Search, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalysisSection, InlineTip, SectionNav } from "@/components/analysis/AnalysisShell";
import AIProgressLoader from "@/components/AIProgressLoader";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export default function CompanyResearch() {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const handleResearch = async () => {
    if (!companyName) { toast.error("Enter a company name"); return; }
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("company-research", { body: { companyName } });
      if (error) throw error;
      setData(res);
      toast.success("Research complete!");
    } catch (e: any) { toast.error(e.message || "Failed to research"); }
    finally { setLoading(false); }
  };

  return (
    <AppLayout title="Company Research Hub" subtitle="AI-powered company intelligence for your job search">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Search Bar */}
        <motion.div {...fade(0)} className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Research a Company</h3>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter company name (e.g., Google, Stripe, Airbnb)..."
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="pl-10"
                onKeyDown={e => e.key === "Enter" && handleResearch()}
              />
            </div>
            <Button onClick={handleResearch} disabled={loading} className="gap-2 shrink-0">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Researching...</> : <><Building2 className="h-4 w-4" /> Research</>}
            </Button>
          </div>
          <InlineTip className="mt-3">Get AI-powered insights on company culture, interview process, salary data, and application tips — all in one place.</InlineTip>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border bg-card p-12">
            <AIProgressLoader loading={loading} context="company-research" />
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview" className="gap-1.5 text-xs"><Globe className="h-3.5 w-3.5 hidden sm:inline" /> Overview</TabsTrigger>
              <TabsTrigger value="culture" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5 hidden sm:inline" /> Culture</TabsTrigger>
              <TabsTrigger value="interview" className="gap-1.5 text-xs"><BookOpen className="h-3.5 w-3.5 hidden sm:inline" /> Interview</TabsTrigger>
              <TabsTrigger value="financials" className="gap-1.5 text-xs"><DollarSign className="h-3.5 w-3.5 hidden sm:inline" /> Salary</TabsTrigger>
              <TabsTrigger value="tips" className="gap-1.5 text-xs"><Lightbulb className="h-3.5 w-3.5 hidden sm:inline" /> Tips</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <motion.div {...fade(0)} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><Globe className="h-4 w-4 text-primary" /> Company Overview</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{data.overview?.description || "No data"}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {[
                    { label: "Industry", value: data.overview?.industry },
                    { label: "Size", value: data.overview?.size },
                    { label: "Founded", value: data.overview?.founded },
                    { label: "HQ", value: data.overview?.headquarters },
                    { label: "Revenue", value: data.overview?.revenue },
                    { label: "Stage", value: data.overview?.stage },
                  ].filter(s => s.value).map(s => (
                    <div key={s.label} className="rounded-lg bg-secondary/50 p-3 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{s.label}</p>
                      <p className="text-sm font-semibold mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
              {data.overview?.recent_news?.length > 0 && (
                <AnalysisSection id="cr-news" title="Recent News & Updates" icon={<TrendingUp className="h-4 w-4" />}>
                  <div className="p-4 sm:p-5 space-y-2">
                    {data.overview.recent_news.map((n: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground leading-relaxed">{n}</span>
                      </div>
                    ))}
                  </div>
                </AnalysisSection>
              )}
            </TabsContent>

            <TabsContent value="culture" className="space-y-4">
              <motion.div {...fade(0)} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><Users className="h-4 w-4 text-primary" /> Culture & Values</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{data.culture?.summary || "No data"}</p>
                {data.culture?.values?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {data.culture.values.map((v: string, i: number) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{v}</span>
                    ))}
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  {data.culture?.pros?.length > 0 && (
                    <div className="rounded-lg border p-4">
                      <h4 className="text-xs font-semibold flex items-center gap-1.5 text-score-excellent mb-2"><CheckCircle2 className="h-3.5 w-3.5" /> Pros</h4>
                      <div className="space-y-1.5">
                        {data.culture.pros.map((p: string, i: number) => (
                          <p key={i} className="text-xs text-muted-foreground flex items-start gap-2"><CheckCircle2 className="h-3 w-3 text-score-excellent shrink-0 mt-0.5" />{p}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.culture?.cons?.length > 0 && (
                    <div className="rounded-lg border p-4">
                      <h4 className="text-xs font-semibold flex items-center gap-1.5 text-score-warning mb-2"><AlertTriangle className="h-3.5 w-3.5" /> Cons</h4>
                      <div className="space-y-1.5">
                        {data.culture.cons.map((c: string, i: number) => (
                          <p key={i} className="text-xs text-muted-foreground flex items-start gap-2"><AlertTriangle className="h-3 w-3 text-score-warning shrink-0 mt-0.5" />{c}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="interview" className="space-y-4">
              <motion.div {...fade(0)} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><BookOpen className="h-4 w-4 text-primary" /> Interview Process</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{data.interview?.process || "No data"}</p>
                {data.interview?.common_questions?.length > 0 && (
                  <AnalysisSection id="cr-questions" title="Common Interview Questions" icon={<Briefcase className="h-4 w-4" />}>
                    <div className="p-4 space-y-2">
                      {data.interview.common_questions.map((q: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/30">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                          <span className="text-sm text-muted-foreground">{q}</span>
                        </div>
                      ))}
                    </div>
                  </AnalysisSection>
                )}
                {data.interview?.tips?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-semibold flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5 text-primary" /> Interview Tips</h4>
                    {data.interview.tips.map((t: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{t}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="financials" className="space-y-4">
              <motion.div {...fade(0)} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><DollarSign className="h-4 w-4 text-primary" /> Financial & Salary Data</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{data.financials?.summary || "No data"}</p>
                {data.financials?.salary_range && (
                  <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Typical Salary Range</p>
                    <p className="text-xl font-bold text-primary">{data.financials.salary_range}</p>
                  </div>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="tips" className="space-y-4">
              <motion.div {...fade(0)} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><Lightbulb className="h-4 w-4 text-primary" /> Application Tips</h3>
                {data.application_tips?.length > 0 ? (
                  <div className="space-y-3">
                    {data.application_tips.map((t: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <span className="text-sm text-muted-foreground leading-relaxed">{t}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No specific tips available</p>}
              </motion.div>
            </TabsContent>
          </Tabs>
        )}

        {/* Empty State */}
        {!data && !loading && (
          <motion.div {...fade(1)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
            <Building2 className="h-10 w-10 text-primary/40 mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold mb-2">Research Any Company</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Get AI-powered intelligence on company culture, interview process, salary ranges, and application tips — all before you apply.
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
              {["Culture & Values", "Interview Process", "Salary Data", "Application Tips", "Recent News"].map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-full border bg-secondary/50">{tag}</span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
