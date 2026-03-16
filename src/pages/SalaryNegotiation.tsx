import { useState } from "react";
import AIProgressLoader from "@/components/AIProgressLoader";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Loader2, Wand2, DollarSign, Shield, MessageSquare, AlertTriangle,
  Copy, CheckCircle2, ChevronDown, ChevronUp, HelpCircle, Zap,
  Target, ArrowRight, XCircle, Sparkles, Building2,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ResumeSourceSelector from "@/components/ResumeSourceSelector";
import { useResumeSource } from "@/hooks/useResumeSource";
import { InlineTip, AnalysisSection } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export default function SalaryNegotiation() {
  const resume = useResumeSource();
  const [currentSalary, setCurrentSalary] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [offerDetails, setOfferDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [expandedScript, setExpandedScript] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleAnalyze = async () => {
    const resumeText = resume.getResumeText();
    if (!resumeText) { toast.error("Select a resume or paste text"); return; }
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("salary-negotiation", {
        body: { resumeText, currentSalary: currentSalary || undefined, targetRole: targetRole || undefined, targetCompany: targetCompany || undefined, offerDetails: offerDetails || undefined },
      });
      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);
      setData(result);
      toast.success("Negotiation strategy ready!");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success("Copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

  return (
    <AppLayout title="Salary Negotiation" subtitle="AI-powered negotiation scripts, counter-offers, and strategy">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {!data && !loading ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <motion.div {...fade(0)}>
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1">Salary Negotiation Coach</h1>
                <p className="text-sm text-muted-foreground">Get personalized scripts, counter-offer templates, and walk-away analysis based on your resume.</p>
              </motion.div>

              <motion.div {...fade(1)} className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Your Details</h3>
                </div>

                <ResumeSourceSelector {...resume} textareaRows={4} />

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Current Salary <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input value={currentSalary} onChange={e => setCurrentSalary(e.target.value)} placeholder="e.g. $120,000" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Target Role <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Senior Engineer" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Target Company <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input value={targetCompany} onChange={e => setTargetCompany(e.target.value)} placeholder="e.g. Google" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Offer Details <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input value={offerDetails} onChange={e => setOfferDetails(e.target.value)} placeholder="e.g. $150K base + 10K RSU" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <InlineTip className="flex-1">More context = better strategy. Include offer details and target company for company-specific negotiation tactics.</InlineTip>
                  <Button onClick={handleAnalyze} disabled={loading} className="gap-2 shrink-0">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    Generate Strategy
                  </Button>
                </div>
              </motion.div>

              {/* Empty State */}
              <motion.div {...fade(2)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
                <Shield className="h-10 w-10 text-primary/40 mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">Negotiate With Confidence</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Get word-for-word scripts, counter-offer email templates, objection handlers, and a clear walk-away threshold.
                </p>
                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                  {["Negotiation Scripts", "Counter-Offers", "Red Flags", "Walk-Away Analysis"].map(tag => (
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
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">Your Negotiation Strategy</h2>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setData(null)}>
                  <Wand2 className="h-3 w-3" /> Start Over
                </Button>
              </div>

              {/* Summary */}
              {data.summary && (
                <motion.div {...fade(0)} className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
                  <p className="text-sm leading-relaxed">{data.summary}</p>
                </motion.div>
              )}

              {/* Market Value */}
              {data.market_value && (
                <motion.div {...fade(1)}>
                  <AnalysisSection id="sn-market" title="Your Market Value" icon={<DollarSign className="h-4 w-4" />}>
                    <div className="p-4 sm:p-5">
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {data.market_value.base_range && ["low", "mid", "high"].map((tier) => (
                          <div key={tier} className={`rounded-xl p-4 text-center border ${tier === "mid" ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/20"}`}>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{tier === "low" ? "Floor" : tier === "mid" ? "Target" : "Stretch"}</p>
                            <p className={`text-xl sm:text-2xl font-bold tabular-nums mt-1 ${tier === "mid" ? "text-primary" : "text-foreground"}`}>{fmt(data.market_value.base_range[tier])}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">base</p>
                          </div>
                        ))}
                      </div>
                      {data.market_value.confidence && (
                        <p className="text-xs text-muted-foreground">Confidence: <strong>{data.market_value.confidence}</strong></p>
                      )}
                    </div>
                  </AnalysisSection>
                </motion.div>
              )}

              <Tabs defaultValue="scripts" className="space-y-4">
                <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
                  <TabsTrigger value="scripts" className="gap-1.5 text-xs"><MessageSquare className="h-3 w-3" /> Scripts</TabsTrigger>
                  <TabsTrigger value="benefits" className="gap-1.5 text-xs"><Zap className="h-3 w-3" /> Benefits</TabsTrigger>
                  <TabsTrigger value="emails" className="gap-1.5 text-xs"><Target className="h-3 w-3" /> Counter-Offers</TabsTrigger>
                  <TabsTrigger value="questions" className="gap-1.5 text-xs"><HelpCircle className="h-3 w-3" /> Questions</TabsTrigger>
                  <TabsTrigger value="redflags" className="gap-1.5 text-xs"><AlertTriangle className="h-3 w-3" /> Red Flags</TabsTrigger>
                  <TabsTrigger value="walkaway" className="gap-1.5 text-xs"><Shield className="h-3 w-3" /> Walk Away</TabsTrigger>
                </TabsList>

                {/* Scripts */}
                <TabsContent value="scripts" className="space-y-3">
                  {data.negotiation_scripts?.map((s: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card overflow-hidden">
                      <button onClick={() => setExpandedScript(expandedScript === i ? null : i)} className="w-full p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                          <span className="font-medium text-sm text-left">{s.scenario}</span>
                        </div>
                        {expandedScript === i ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      <AnimatePresence>
                        {expandedScript === i && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t overflow-hidden">
                            <div className="p-4 sm:p-5 space-y-4">
                              <div className="rounded-lg bg-secondary/20 p-4">
                                <div className="flex justify-between mb-2">
                                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Script</p>
                                  <Button variant="ghost" size="sm" onClick={() => copyText(s.script, `script-${i}`)} className="h-6 gap-1 text-[10px]">
                                    {copied === `script-${i}` ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy
                                  </Button>
                                </div>
                                <p className="text-sm whitespace-pre-line leading-relaxed">{s.script}</p>
                              </div>
                              {s.tips?.length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="text-xs font-semibold">Delivery Tips</p>
                                  {s.tips.map((t: string, ti: number) => (
                                    <p key={ti} className="text-xs text-muted-foreground flex gap-2"><Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" /> {t}</p>
                                  ))}
                                </div>
                              )}
                              {s.what_if_they_say?.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-muted-foreground" /> Objection Handlers</p>
                                  {s.what_if_they_say.map((w: any, wi: number) => (
                                    <div key={wi} className="rounded-lg border bg-secondary/10 p-3 space-y-1.5">
                                      <p className="text-xs text-destructive font-medium">"{w.objection}"</p>
                                      <div className="flex items-center gap-1"><ArrowRight className="h-3 w-3 text-primary" /></div>
                                      <p className="text-xs leading-relaxed">{w.response}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </TabsContent>

                {/* Benefits */}
                <TabsContent value="benefits" className="space-y-3">
                  {data.benefits_strategy?.map((b: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-sm">{b.benefit}</span>
                        <Badge variant={b.priority === "high" ? "default" : "secondary"} className="text-[10px]">{b.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{b.negotiation_tip}</p>
                      <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
                        {b.typical_range && <span className="px-2 py-0.5 rounded-md bg-secondary/30">Range: {b.typical_range}</span>}
                        {b.monetary_value && <span className="px-2 py-0.5 rounded-md bg-secondary/30">Value: {b.monetary_value}</span>}
                      </div>
                    </motion.div>
                  ))}
                </TabsContent>

                {/* Counter-Offer Emails */}
                <TabsContent value="emails" className="space-y-3">
                  {data.counter_offer_templates?.map((t: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <Badge variant="outline" className="text-[10px] mb-1">{t.scenario}</Badge>
                          <p className="text-sm font-medium">Subject: {t.subject}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => copyText(`Subject: ${t.subject}\n\n${t.email}`, `counter-${i}`)} className="h-7 gap-1 text-xs">
                          {copied === `counter-${i}` ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy
                        </Button>
                      </div>
                      <div className="rounded-lg bg-secondary/20 p-4 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{t.email}</div>
                    </motion.div>
                  ))}
                </TabsContent>

                {/* Questions */}
                <TabsContent value="questions" className="space-y-3">
                  {data.questions_to_ask?.map((q: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-4">
                      <p className="font-medium text-sm flex items-start gap-2">
                        <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {q.question}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5 ml-6 leading-relaxed">{q.why}</p>
                      {q.when_to_ask && <p className="text-[10px] text-primary mt-1 ml-6 font-medium">📅 {q.when_to_ask}</p>}
                    </motion.div>
                  ))}
                </TabsContent>

                {/* Red Flags */}
                <TabsContent value="redflags" className="space-y-3">
                  {data.red_flags?.map((f: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                      <p className="font-medium text-sm flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> {f.flag}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5 ml-6 leading-relaxed">{f.why}</p>
                      {f.action && <p className="text-[10px] text-primary mt-1 ml-6 font-medium">→ {f.action}</p>}
                    </motion.div>
                  ))}
                  {data.power_moves?.length > 0 && (
                    <AnalysisSection id="sn-power" title="Power Moves" icon={<Zap className="h-4 w-4" />}>
                      <div className="p-4 sm:p-5 space-y-2">
                        {data.power_moves.map((m: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
                            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground leading-relaxed">{m}</span>
                          </div>
                        ))}
                      </div>
                    </AnalysisSection>
                  )}
                </TabsContent>

                {/* Walk Away */}
                <TabsContent value="walkaway" className="space-y-4">
                  {data.walk_away_analysis && (
                    <>
                      <motion.div {...fade(0)} className="rounded-xl border bg-card p-5">
                        <h3 className="font-semibold text-sm mb-2">Minimum Acceptable</h3>
                        <p className="text-2xl font-bold text-primary tabular-nums">{data.walk_away_analysis.minimum_acceptable}</p>
                        {data.walk_away_analysis.factors?.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            {data.walk_away_analysis.factors.map((f: string, i: number) => (
                              <p key={i} className="text-sm text-muted-foreground flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /> {f}</p>
                            ))}
                          </div>
                        )}
                      </motion.div>
                      {data.walk_away_analysis.signs_to_walk_away?.length > 0 && (
                        <motion.div {...fade(1)} className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><XCircle className="h-4 w-4 text-destructive" /> Signs to Walk Away</h3>
                          <div className="space-y-1.5">
                            {data.walk_away_analysis.signs_to_walk_away.map((s: string, i: number) => (
                              <p key={i} className="text-sm text-muted-foreground flex gap-2"><XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" /> {s}</p>
                            ))}
                          </div>
                        </motion.div>
                      )}
                      {data.walk_away_analysis.how_to_decline_gracefully && (
                        <motion.div {...fade(2)} className="rounded-xl border bg-card p-5">
                          <h3 className="font-semibold text-sm mb-2">How to Decline Gracefully</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{data.walk_away_analysis.how_to_decline_gracefully}</p>
                        </motion.div>
                      )}
                    </>
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
