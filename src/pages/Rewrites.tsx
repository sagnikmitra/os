import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { SeverityBadge } from "@/components/ScoreCard";
import { motion } from "@/lib/motion-stub";
import { CheckCircle2, Copy, Loader2, Wand2, Sparkles, Shield, Eye, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAnalysis } from "@/context/AnalysisContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

const styles = [
  { id: "executive", label: "Executive", desc: "C-suite strategic language" },
  { id: "metrics", label: "Metrics-Driven", desc: "Maximize quantifiable impact" },
  { id: "strategic", label: "Strategic", desc: "Business-aligned framing" },
  { id: "ats", label: "ATS-Friendly", desc: "Optimized for parsers" },
  { id: "concise", label: "Concise", desc: "Punchy and scannable" },
  { id: "star", label: "STAR Method", desc: "Situation→Action→Result" },
  { id: "technical", label: "Technical", desc: "Engineering depth" },
  { id: "humanize", label: "Humanize", desc: "Remove AI-sounding language" },
];

interface Rewrite { original: string; rewritten: string; }
interface MultiVariantRewrite {
  original: string;
  ats_optimized: string;
  recruiter_friendly: string;
  concise_impact: string;
  diagnosis: string;
}

export default function Rewrites() {
  const { analysis } = useAnalysis();
  const [customBullets, setCustomBullets] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("concise");
  const [rewrites, setRewrites] = useState<Rewrite[]>([]);
  const [multiRewrites, setMultiRewrites] = useState<MultiVariantRewrite[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"single" | "multi">("multi");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const analysisRewrites = analysis ? [
    ...(analysis.content_analysis?.bullets?.filter((b: any) => b.strength === "weak" && b.fix) || []).map((b: any) => ({
      original: b.text, rewritten: b.fix,
    })),
    ...(analysis.humanizer_analysis?.detections || []).map((d: any) => ({
      original: d.original, rewritten: d.humanized,
    })),
  ] : [];

  const handleRewrite = async () => {
    const bullets = customBullets.split("\n").map(b => b.trim()).filter(b => b.length > 0);
    if (bullets.length === 0) { toast.error("Enter at least one bullet point"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("rewrite-bullets", {
        body: { bullets, style: selectedStyle, multiVariant: mode === "multi" },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (mode === "multi" && data?.rewrites) {
        setMultiRewrites(data.rewrites);
        setRewrites([]);
      } else if (data?.rewrites) {
        setRewrites(data.rewrites);
        setMultiRewrites([]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to rewrite bullets");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 shrink-0" onClick={() => handleCopy(text, id)}>
      {copiedKey === id ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copiedKey === id ? "Copied" : "Copy"}
    </Button>
  );

  return (
    <AppLayout title="Rewrites">
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <motion.div {...fade(0)}>
          <h2 className="text-xl font-bold tracking-tight">AI Rewrite Engine</h2>
          <p className="text-sm text-muted-foreground mt-1">Get multiple rewrite variants for every bullet — ATS-optimized, recruiter-friendly, and high-impact concise.</p>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div {...fade(0.5)} className="flex items-center gap-3">
          <Button variant={mode === "multi" ? "default" : "outline"} size="sm" className="gap-1.5 text-xs" onClick={() => setMode("multi")}>
            <Sparkles className="h-3 w-3" /> 3 Variants per Bullet
          </Button>
          <Button variant={mode === "single" ? "default" : "outline"} size="sm" className="gap-1.5 text-xs" onClick={() => setMode("single")}>
            <Wand2 className="h-3 w-3" /> Single Style
          </Button>
        </motion.div>

        {/* Input */}
        <motion.div {...fade(1)} className="rounded-xl border bg-card p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Your Bullets (one per line)</label>
            <Textarea value={customBullets} onChange={e => setCustomBullets(e.target.value)} placeholder={"Managed a team of developers\nWorked on various projects\nResponsible for customer satisfaction"} rows={5} className="text-sm" />
          </div>

          {mode === "single" && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Rewrite Style</label>
              <div className="flex flex-wrap gap-2">
                {styles.map(s => (
                  <button key={s.id} onClick={() => setSelectedStyle(s.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedStyle === s.id ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/40"}`} title={s.desc}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleRewrite} disabled={loading || !customBullets.trim()} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {loading ? "Rewriting..." : mode === "multi" ? "Generate 3 Variants" : "Rewrite Bullets"}
          </Button>
        </motion.div>

        {/* Multi-Variant Results */}
        {multiRewrites.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{multiRewrites.length} Bullets × 3 Variants</h3>
            {multiRewrites.map((r, i) => (
              <motion.div key={i} {...fade(i + 2)} className="rounded-xl border bg-card overflow-hidden">
                {/* Original + Diagnosis */}
                <div className="p-4 border-b bg-secondary/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Original</p>
                      <p className="text-sm leading-relaxed">{r.original}</p>
                    </div>
                  </div>
                  {r.diagnosis && (
                    <div className="flex items-start gap-2 mt-2 p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                      <AlertTriangle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                      <p className="text-[11px] text-destructive/80">{r.diagnosis}</p>
                    </div>
                  )}
                </div>

                {/* 3 Variants */}
                <div className="divide-y">
                  {[
                    { key: "ats", label: "ATS-Optimized", icon: <Shield className="h-3.5 w-3.5" />, text: r.ats_optimized, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/5 border-blue-500/10" },
                    { key: "recruiter", label: "Recruiter-Friendly", icon: <Eye className="h-3.5 w-3.5" />, text: r.recruiter_friendly, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/5 border-purple-500/10" },
                    { key: "concise", label: "Concise High-Impact", icon: <Zap className="h-3.5 w-3.5" />, text: r.concise_impact, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/10" },
                  ].map(variant => (
                    <div key={variant.key} className="p-4 flex items-start gap-3">
                      <div className={`flex items-center gap-1.5 shrink-0 w-40 ${variant.color}`}>
                        {variant.icon}
                        <span className="text-[11px] font-semibold">{variant.label}</span>
                      </div>
                      <p className={`text-sm leading-relaxed flex-1 p-2.5 rounded-lg border ${variant.bg}`}>{variant.text}</p>
                      <CopyBtn text={variant.text} id={`${i}-${variant.key}`} />
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Single Style Results */}
        {rewrites.length > 0 && multiRewrites.length === 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{rewrites.length} AI Rewrites</h3>
            {rewrites.map((r, i) => (
              <motion.div key={i} {...fade(i + 3)} className="rounded-xl border bg-card overflow-hidden">
                <div className="p-5 grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Before</p>
                    <p className="text-sm leading-relaxed p-3 rounded-lg bg-destructive/5 border border-destructive/10">{r.original}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">After</p>
                    <p className="text-sm leading-relaxed p-3 rounded-lg bg-primary/5 border border-primary/10">{r.rewritten}</p>
                  </div>
                </div>
                <div className="px-5 py-3 border-t flex justify-end">
                  <CopyBtn text={r.rewritten} id={`single-${i}`} />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Analysis-based rewrites */}
        {multiRewrites.length === 0 && rewrites.length === 0 && analysisRewrites.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{analysisRewrites.length} Analysis-Based Rewrites</h3>
            {analysisRewrites.map((r: any, i: number) => (
              <motion.div key={i} {...fade(i + 3)} className="rounded-xl border bg-card overflow-hidden">
                <div className="p-5 grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Before</p>
                    <p className="text-sm leading-relaxed p-3 rounded-lg bg-destructive/5 border border-destructive/10">{r.original}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">After</p>
                    <p className="text-sm leading-relaxed p-3 rounded-lg bg-primary/5 border border-primary/10">{r.rewritten}</p>
                  </div>
                </div>
                <div className="px-5 py-3 border-t flex justify-end">
                  <CopyBtn text={r.rewritten} id={`analysis-${i}`} />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {multiRewrites.length === 0 && rewrites.length === 0 && analysisRewrites.length === 0 && (
          <motion.div {...fade(2)} className="rounded-xl border border-dashed bg-card p-12 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Enter your bullets and get AI rewrites in 3 variants.</p>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
