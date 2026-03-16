import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Loader2, Scale, Trophy, CheckCircle2, XCircle, Building2, ArrowRight, Copy } from "lucide-react";
import AIProgressLoader from "@/components/AIProgressLoader";
import { InlineTip } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

interface Offer { id: string; company: string; role: string; baseSalary: string; equity: string; bonus: string; benefits: string; pto: string; remote: string; growth: string; notes: string; }

const emptyOffer = (): Offer => ({ id: crypto.randomUUID(), company: "", role: "", baseSalary: "", equity: "", bonus: "", benefits: "", pto: "", remote: "", growth: "", notes: "" });

const fields: { key: keyof Offer; label: string; placeholder: string; required?: boolean; icon?: string }[] = [
  { key: "company", label: "Company", placeholder: "Company name", required: true },
  { key: "role", label: "Role", placeholder: "Position title" },
  { key: "baseSalary", label: "Base Salary", placeholder: "$120,000", required: true },
  { key: "equity", label: "Equity / Stock", placeholder: "$50K RSU / 4yr vest" },
  { key: "bonus", label: "Bonus", placeholder: "15% target" },
  { key: "benefits", label: "Benefits", placeholder: "Health, 401k match..." },
  { key: "pto", label: "PTO / Leave", placeholder: "Unlimited / 20 days" },
  { key: "remote", label: "Remote Policy", placeholder: "Hybrid / Remote" },
  { key: "growth", label: "Growth Potential", placeholder: "Fast-track to Staff" },
];

export default function OfferComparison() {
  const [offers, setOffers] = useState<Offer[]>([emptyOffer(), emptyOffer()]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const updateOffer = (id: string, field: keyof Offer, value: string) => setOffers(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  const addOffer = () => { if (offers.length >= 5) { toast.error("Max 5 offers"); return; } setOffers([...offers, emptyOffer()]); };
  const removeOffer = (id: string) => { if (offers.length <= 2) { toast.error("Minimum 2 offers"); return; } setOffers(offers.filter(o => o.id !== id)); };

  const handleCompare = async () => {
    const valid = offers.filter(o => o.company && o.baseSalary);
    if (valid.length < 2) { toast.error("At least 2 offers with company and salary needed"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("compare-offers", { body: { offers: valid } });
      if (error) throw error;
      setAnalysis(data);
      toast.success("Comparison ready!");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  const copyRecommendation = () => {
    if (!analysis?.recommendation) return;
    navigator.clipboard.writeText(analysis.recommendation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied!");
  };

  const filledCount = offers.filter(o => o.company && o.baseSalary).length;

  return (
    <AppLayout title="Offer Comparison" subtitle="Compare multiple job offers side-by-side">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {!analysis && !loading ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <motion.div {...fade(0)}>
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1">Offer Comparison</h1>
                <p className="text-sm text-muted-foreground">Add 2-5 offers to get an AI-powered side-by-side analysis with a clear recommendation.</p>
              </motion.div>

              {/* Progress indicator */}
              <motion.div {...fade(0)} className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs font-mono">{filledCount}/5 offers ready</Badge>
                {filledCount >= 2 && <span className="text-[10px] text-score-excellent">✓ Ready to compare</span>}
              </motion.div>

              {/* Offer Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {offers.map((offer, i) => (
                  <motion.div key={offer.id} {...fade(i)} className="rounded-xl border bg-card p-4 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${offer.company && offer.baseSalary ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>{i + 1}</span>
                        <div>
                          <h4 className="text-sm font-semibold">Offer {i + 1}</h4>
                          {offer.company && <p className="text-[10px] text-muted-foreground">{offer.company}</p>}
                        </div>
                      </div>
                      {offers.length > 2 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeOffer(offer.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    {fields.map(f => (
                      <div key={f.key} className="space-y-0.5">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label} {f.required && <span className="text-destructive">*</span>}</Label>
                        <Input placeholder={f.placeholder} value={offer[f.key]} onChange={e => updateOffer(offer.id, f.key, e.target.value)} className="h-8 text-sm" />
                      </div>
                    ))}
                    <div className="space-y-0.5">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Notes</Label>
                      <Textarea placeholder="Any other details..." value={offer.notes} onChange={e => updateOffer(offer.id, "notes", e.target.value)} rows={2} className="text-sm" />
                    </div>
                  </motion.div>
                ))}

                {/* Add Offer Card */}
                {offers.length < 5 && (
                  <motion.button {...fade(offers.length)} onClick={addOffer} className="rounded-xl border-2 border-dashed bg-card/50 p-8 flex flex-col items-center justify-center gap-2 hover:bg-secondary/30 transition-colors min-h-[200px]">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-medium">Add Offer</span>
                    <span className="text-[10px] text-muted-foreground">Up to {5 - offers.length} more</span>
                  </motion.button>
                )}
              </div>

              <div className="flex items-center justify-between gap-4">
                <InlineTip className="flex-1">AI analyzes total compensation, growth potential, work-life balance, and culture signals.</InlineTip>
                <Button className="gap-2 shrink-0" onClick={handleCompare} disabled={loading || filledCount < 2}>
                  <Scale className="h-4 w-4" /> Compare Offers
                </Button>
              </div>
            </motion.div>
          ) : loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rounded-xl border bg-card p-12">
                <AIProgressLoader loading={loading} context="analysis" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">Comparison Results</h2>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setAnalysis(null)}>
                  <Scale className="h-3 w-3" /> Compare Again
                </Button>
              </div>

              {/* Recommendation */}
              {analysis.recommendation && (
                <motion.div {...fade(0)} className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Trophy className="h-5 w-5 text-score-warning shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-sm mb-1">AI Recommendation</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{analysis.recommendation}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs shrink-0" onClick={copyRecommendation}>
                      {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Ranked Offers */}
              {analysis.comparison?.map((item: any, i: number) => (
                <motion.div key={i} {...fade(i + 1)} className={`rounded-xl border bg-card overflow-hidden ${item.rank === 1 ? "border-primary/30" : ""}`}>
                  {/* Offer Header */}
                  <div className={`p-4 sm:p-5 flex items-start justify-between gap-4 ${item.rank === 1 ? "bg-primary/5" : ""}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${item.rank === 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>#{item.rank}</span>
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" /> {item.company}
                        </h3>
                        <p className="text-xs text-muted-foreground tabular-nums">{item.total_comp}</p>
                      </div>
                    </div>
                    {item.rank === 1 && <Badge className="bg-primary text-primary-foreground text-[10px]">Best Overall</Badge>}
                  </div>

                  {/* Pros & Cons */}
                  <div className="grid sm:grid-cols-2 gap-0 border-t">
                    {item.pros?.length > 0 && (
                      <div className="p-4 sm:p-5 space-y-2 sm:border-r border-b sm:border-b-0">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-score-excellent" /> Pros</p>
                        {item.pros.map((p: string, j: number) => (
                          <p key={j} className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed"><CheckCircle2 className="h-3 w-3 text-score-excellent shrink-0 mt-0.5" />{p}</p>
                        ))}
                      </div>
                    )}
                    {item.cons?.length > 0 && (
                      <div className="p-4 sm:p-5 space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1"><XCircle className="h-3 w-3 text-score-critical" /> Cons</p>
                        {item.cons.map((c: string, j: number) => (
                          <p key={j} className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed"><XCircle className="h-3 w-3 text-score-critical shrink-0 mt-0.5" />{c}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
