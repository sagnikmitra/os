import { useState } from "react";
import AIProgressLoader from "@/components/AIProgressLoader";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FlaskConical, Copy, CheckCircle2, Star, Building2, ArrowRight, Lightbulb } from "lucide-react";
import ResumeSourceSelector from "@/components/ResumeSourceSelector";
import { useResumeSource } from "@/hooks/useResumeSource";
import { InlineTip } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

const scoreColor = (s: number) => s >= 8 ? "bg-score-excellent/10 text-score-excellent border-score-excellent/30" : s >= 6 ? "bg-score-strong/10 text-score-strong border-score-strong/30" : "bg-score-warning/10 text-score-warning border-score-warning/30";

export default function ColdEmailTester() {
  const resume = useResumeSource();
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<any[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!targetRole || !targetCompany) { toast.error("Role and company required"); return; }
    setLoading(true);
    try {
      const resumeText = resume.getResumeText();
      const { data, error } = await supabase.functions.invoke("cold-email-ab", { body: { targetRole, targetCompany, context, resumeText } });
      if (error) throw error;
      setVariants(data.variants || []);
      toast.success("Variants generated!");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied!");
  };

  return (
    <AppLayout title="Cold Email A/B Tester" subtitle="Multiple outreach variants with effectiveness predictions">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {variants.length === 0 && !loading ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <motion.div {...fade(0)}>
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1">Cold Email A/B Tester</h1>
                <p className="text-sm text-muted-foreground">Generate multiple outreach variants with predicted open rates and effectiveness scores.</p>
              </motion.div>

              <motion.div {...fade(1)} className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <FlaskConical className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Outreach Setup</h3>
                </div>

                <ResumeSourceSelector {...resume} textareaRows={4} />

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Target Role <span className="text-destructive">*</span></Label>
                    <Input placeholder="e.g., Engineering Manager" value={targetRole} onChange={e => setTargetRole(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Target Company <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="e.g., Stripe" value={targetCompany} onChange={e => setTargetCompany(e.target.value)} className="pl-9" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Additional Context <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Textarea placeholder="What makes you a fit, mutual connections, shared interests, recent company news..." value={context} onChange={e => setContext(e.target.value)} rows={3} className="text-sm" />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <InlineTip className="flex-1">Generates 3+ variants with different tones. Each includes a predicted effectiveness score and open rate.</InlineTip>
                  <Button className="gap-2 shrink-0" onClick={handleGenerate} disabled={loading || !targetRole.trim() || !targetCompany.trim()}>
                    <FlaskConical className="h-4 w-4" /> Generate Variants
                  </Button>
                </div>
              </motion.div>

              <motion.div {...fade(2)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
                <FlaskConical className="h-10 w-10 text-primary/40 mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">Test Before You Send</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Get multiple cold email variants with different styles and predicted effectiveness so you can pick the best approach.
                </p>
                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                  {["A/B Variants", "Open Rate Prediction", "Style Labels", "Copy & Send"].map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full border bg-secondary/50">{tag}</span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rounded-xl border bg-card p-12">
                <AIProgressLoader loading={loading} context="outreach" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">{variants.length} Email Variants</h2>
                  <p className="text-xs text-muted-foreground">{targetCompany} · {targetRole}</p>
                </div>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setVariants([])}>
                  <ArrowRight className="h-3 w-3" /> New Test
                </Button>
              </div>

              {variants.map((v: any, i: number) => {
                const letter = String.fromCharCode(65 + i);
                const key = `variant-${i}`;
                return (
                  <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card overflow-hidden">
                    {/* Variant Header */}
                    <div className="p-4 sm:p-5 border-b flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">{letter}</span>
                        <div>
                          <h3 className="text-sm font-semibold">Variant {letter}</h3>
                          {v.style && <p className="text-[10px] text-muted-foreground">{v.style}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {v.predicted_score && (
                          <Badge variant="outline" className={`text-[10px] gap-1 border ${scoreColor(v.predicted_score)}`}>
                            <Star className="h-2.5 w-2.5" /> {v.predicted_score}/10
                          </Badge>
                        )}
                        {v.predicted_open_rate && (
                          <Badge variant="secondary" className="text-[10px]">{v.predicted_open_rate} open rate</Badge>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => copy(`Subject: ${v.subject}\n\n${v.email}`, key)}>
                          {copied === key ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copied === key ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    </div>

                    {/* Subject + Body */}
                    <div className="p-4 sm:p-5 space-y-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Subject</p>
                        <p className="text-sm font-medium px-3 py-2 rounded-lg bg-secondary/30">{v.subject}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Email</p>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">{v.email}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
