import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, DollarSign, TrendingUp, BarChart3, Lightbulb, ArrowRight, Search, Copy, CheckCircle2 } from "lucide-react";
import { InlineTip, AnalysisSection } from "@/components/analysis/AnalysisShell";
import AIProgressLoader from "@/components/AIProgressLoader";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export default function SalaryBenchmark() {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("mid");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleBenchmark = async () => {
    if (!role) { toast.error("Enter a role"); return; }
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("salary-benchmark", { body: { role, location, experience } });
      if (error) throw error;
      setData(res);
      toast.success("Benchmark data ready!");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  const copySummary = () => {
    const parts = [`Salary Benchmark: ${role}`, location && `Location: ${location}`, `Experience: ${experience}`, `25th: ${data.percentile_25}`, `Median: ${data.median}`, `90th: ${data.percentile_90}`].filter(Boolean);
    navigator.clipboard.writeText(parts.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied!");
  };

  return (
    <AppLayout title="Salary Benchmarker" subtitle="Real-time market data by role, location, and experience">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {!data && !loading ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <motion.div {...fade(0)}>
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1">Salary Benchmarker</h1>
                <p className="text-sm text-muted-foreground">Get AI-powered salary data across percentiles with negotiation tips.</p>
              </motion.div>

              {/* Input Card */}
              <motion.div {...fade(1)} className="rounded-xl border bg-card p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Benchmark Your Salary</h3>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Job Title <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="e.g., Software Engineer" value={role} onChange={e => setRole(e.target.value)} className="pl-9" onKeyDown={e => e.key === "Enter" && handleBenchmark()} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Location <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input placeholder="e.g., San Francisco, Remote" value={location} onChange={e => setLocation(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Experience Level</Label>
                    <Select value={experience} onValueChange={setExperience}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level (0-2 yrs)</SelectItem>
                        <SelectItem value="mid">Mid Level (3-5 yrs)</SelectItem>
                        <SelectItem value="senior">Senior (6-10 yrs)</SelectItem>
                        <SelectItem value="staff">Staff / Lead (10+ yrs)</SelectItem>
                        <SelectItem value="executive">Executive / Director</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 gap-4">
                  <InlineTip className="flex-1">Results include base salary, total comp, and negotiation tips across market percentiles.</InlineTip>
                  <Button className="gap-2 shrink-0" onClick={handleBenchmark} disabled={loading || !role.trim()}>
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Benchmarking...</> : <><BarChart3 className="h-4 w-4" /> Get Salary Data</>}
                  </Button>
                </div>
              </motion.div>

              {/* Empty State */}
              <motion.div {...fade(2)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
                <DollarSign className="h-10 w-10 text-primary/40 mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">Know Your Worth</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Get AI-powered salary benchmarks with percentile data, total compensation breakdowns, and negotiation leverage points.
                </p>
                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                  {["Percentile Data", "Total Comp", "Location Adjustments", "Negotiation Tips"].map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full border bg-secondary/50">{tag}</span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rounded-xl border bg-card p-12">
                <AIProgressLoader loading={loading} context="salary" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">{role}</h2>
                  <p className="text-xs text-muted-foreground">{[location, experience.charAt(0).toUpperCase() + experience.slice(1) + " level"].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={copySummary}>
                    {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setData(null)}>
                    <BarChart3 className="h-3 w-3" /> New Search
                  </Button>
                </div>
              </div>

              {/* Percentile Cards */}
              <motion.div {...fade(0)} className="grid grid-cols-3 gap-3 sm:gap-4">
                {[
                  { label: "25th Percentile", value: data.percentile_25, sub: "Below average", border: "border-border" },
                  { label: "Median", value: data.median, sub: "Market rate", border: "border-primary/30" },
                  { label: "90th Percentile", value: data.percentile_90, sub: "Top earners", border: "border-border" },
                ].map((item) => (
                  <div key={item.label} className={`p-4 sm:p-5 rounded-xl text-center border-2 ${item.border} ${item.label === "Median" ? "bg-primary/5" : "bg-card"}`}>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{item.label}</p>
                    <p className={`mt-2 text-xl sm:text-2xl font-bold tabular-nums ${item.label === "Median" ? "text-primary" : "text-foreground"}`}>{item.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{item.sub}</p>
                  </div>
                ))}
              </motion.div>

              {/* Visual Range Bar */}
              <motion.div {...fade(1)} className="rounded-xl border bg-card p-4 sm:p-5">
                <p className="text-xs font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" /> Salary Range Overview
                </p>
                <div className="relative h-8 rounded-full bg-secondary/50 overflow-hidden">
                  <div className="absolute inset-y-0 left-[10%] right-[10%] bg-primary/15 rounded-full" />
                  <div className="absolute inset-y-0 left-[40%] w-1 bg-primary rounded-full" />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground tabular-nums">
                  <span>{data.percentile_25}</span>
                  <span className="text-primary font-semibold">{data.median}</span>
                  <span>{data.percentile_90}</span>
                </div>
              </motion.div>

              {/* Total Comp */}
              {data.total_comp && (
                <AnalysisSection id="sb-comp" title="Total Compensation Breakdown" icon={<DollarSign className="h-4 w-4" />}>
                  <div className="p-4 sm:p-5">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {Object.entries(data.total_comp).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                          <span className="text-sm text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                          <span className="text-sm font-semibold tabular-nums">{v as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </AnalysisSection>
              )}

              {/* Key Factors */}
              {data.factors?.length > 0 && (
                <AnalysisSection id="sb-factors" title="Key Market Factors" icon={<TrendingUp className="h-4 w-4" />}>
                  <div className="p-4 sm:p-5 space-y-2">
                    {data.factors.map((f: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground leading-relaxed">{f}</span>
                      </div>
                    ))}
                  </div>
                </AnalysisSection>
              )}

              {/* Negotiation Tips */}
              {data.negotiation_tips?.length > 0 && (
                <AnalysisSection id="sb-tips" title="Negotiation Tips" icon={<Lightbulb className="h-4 w-4" />}>
                  <div className="p-4 sm:p-5 space-y-3">
                    {data.negotiation_tips.map((t: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <span className="text-sm text-muted-foreground leading-relaxed">{t}</span>
                      </div>
                    ))}
                  </div>
                </AnalysisSection>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
