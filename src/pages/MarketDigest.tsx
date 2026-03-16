import { useState } from "react";
import { motion } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Newspaper, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Search, Flame, ArrowRight } from "lucide-react";
import AIProgressLoader from "@/components/AIProgressLoader";
import { InlineTip, AnalysisSection } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export default function MarketDigest() {
  const [industry, setIndustry] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const handleGenerate = async () => {
    if (!industry && !role) { toast.error("Enter an industry or role"); return; }
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("market-digest", { body: { industry, role } });
      if (error) throw error;
      setData(res);
      toast.success("Digest generated!");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <AppLayout title="Job Market Digest" subtitle="AI-curated industry trends and hiring signals">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Search */}
        <motion.div {...fade(0)} className="rounded-xl border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Generate Market Digest</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Industry <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="e.g., Tech, Finance, Healthcare" value={industry} onChange={e => setIndustry(e.target.value)} className="pl-9" onKeyDown={e => e.key === "Enter" && handleGenerate()} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role Focus <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="e.g., Software Engineer, PM, Designer" value={role} onChange={e => setRole(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 gap-4">
            <InlineTip className="flex-1">Get hiring trends, in-demand skills, and market opportunities for your target industry.</InlineTip>
            <Button onClick={handleGenerate} disabled={loading} className="gap-2 shrink-0">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Newspaper className="h-4 w-4" /> Generate</>}
            </Button>
          </div>
        </motion.div>

        {loading && (
          <div className="rounded-xl border bg-card p-12">
            <AIProgressLoader loading={loading} context="market" />
          </div>
        )}

        {/* Empty State */}
        {!data && !loading && (
          <motion.div {...fade(1)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
            <TrendingUp className="h-10 w-10 text-primary/40 mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold mb-2">Stay Market-Informed</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Get AI-curated market intelligence with hiring trends, hot skills, emerging opportunities, and risk signals for your industry.
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
              {["Hiring Trends", "Hot Skills", "Market Opportunities", "Risk Warnings"].map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-full border bg-secondary/50">{tag}</span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Results */}
        {data && !loading && (
          <div className="space-y-4">
            {/* Headline */}
            {data.headline && (
              <motion.div {...fade(0)} className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold">{data.headline}</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{data.summary}</p>
              </motion.div>
            )}

            {/* Hiring Trends */}
            {data.trends?.length > 0 && (
              <AnalysisSection id="md-trends" title="Hiring Trends" subtitle={`${data.trends.length} trends detected`} icon={<TrendingUp className="h-4 w-4" />}>
                <div className="divide-y">
                  {data.trends.map((t: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-4 hover:bg-secondary/20 transition-colors">
                      {t.direction === "up" ? <TrendingUp className="h-4 w-4 text-score-excellent mt-0.5 shrink-0" /> : <TrendingDown className="h-4 w-4 text-score-critical mt-0.5 shrink-0" />}
                      <div>
                        <p className="text-sm font-medium">{t.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </AnalysisSection>
            )}

            {/* Hot Skills */}
            {data.hot_skills?.length > 0 && (
              <motion.div {...fade(2)} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><Flame className="h-4 w-4 text-score-risk" /> Hot Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {data.hot_skills.map((s: string, i: number) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{s}</span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Opportunities */}
            {data.opportunities?.length > 0 && (
              <AnalysisSection id="md-opps" title="Opportunities" icon={<Lightbulb className="h-4 w-4" />}>
                <div className="p-4 sm:p-5 space-y-2">
                  {data.opportunities.map((o: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground leading-relaxed">{o}</span>
                    </div>
                  ))}
                </div>
              </AnalysisSection>
            )}

            {/* Warnings */}
            {data.warnings?.length > 0 && (
              <AnalysisSection id="md-warn" title="Watch Out" icon={<AlertTriangle className="h-4 w-4" />}>
                <div className="p-4 sm:p-5 space-y-2">
                  {data.warnings.map((w: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 text-sm p-2.5 rounded-lg bg-destructive/5">
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                      <span className="text-muted-foreground leading-relaxed">{w}</span>
                    </div>
                  ))}
                </div>
              </AnalysisSection>
            )}

            <Button variant="outline" onClick={() => setData(null)} className="gap-2">
              <Newspaper className="h-4 w-4" /> New Digest
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
