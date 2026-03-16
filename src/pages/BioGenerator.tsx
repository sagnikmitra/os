import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User, Copy, CheckCircle2, ArrowRight } from "lucide-react";
import ResumeSourceSelector from "@/components/ResumeSourceSelector";
import { useResumeSource } from "@/hooks/useResumeSource";
import AIProgressLoader from "@/components/AIProgressLoader";
import { InlineTip } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

const bioTypes = [
  { key: "twitter_bio", label: "Twitter / X Bio", icon: "🐦", maxChars: "160 chars", color: "border-blue-400/30 bg-blue-500/5" },
  { key: "linkedin_headline", label: "LinkedIn Headline", icon: "💼", maxChars: "120 chars", color: "border-blue-600/30 bg-blue-600/5" },
  { key: "conference_bio", label: "Conference Bio", icon: "🎤", maxChars: "~100 words", color: "border-purple-500/30 bg-purple-500/5" },
  { key: "speaker_bio", label: "Speaker Bio", icon: "📢", maxChars: "~150 words", color: "border-amber-500/30 bg-amber-500/5" },
  { key: "professional_bio", label: "Professional Bio", icon: "👔", maxChars: "~200 words", color: "border-emerald-500/30 bg-emerald-500/5" },
  { key: "casual_bio", label: "Casual / Personal Bio", icon: "😊", maxChars: "~80 words", color: "border-pink-500/30 bg-pink-500/5" },
];

export default function BioGenerator() {
  const resume = useResumeSource();
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    const resumeText = resume.getResumeText();
    if (!resumeText) { toast.error("Select a resume or paste text"); return; }
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("bio-generator", { body: { resumeText, context } });
      if (error) throw error;
      setData(res);
      toast.success("Bios generated!");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied!");
  };

  const wordCount = (text: string) => text?.split(/\s+/).filter(Boolean).length || 0;

  return (
    <AppLayout title="Bio Generator" subtitle="Conference, speaker, social, and professional bios in multiple lengths">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {!data && !loading ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <motion.div {...fade(0)}>
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1">Bio Generator</h1>
                <p className="text-sm text-muted-foreground">Generate 6 professionally written bios for every platform — from Twitter to conference programs.</p>
              </motion.div>

              <motion.div {...fade(1)} className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Your Profile</h3>
                </div>

                <ResumeSourceSelector {...resume} textareaRows={6} />

                <div className="space-y-1.5">
                  <Label className="text-xs">Context <span className="text-muted-foreground font-normal">(optional — tailors tone & focus)</span></Label>
                  <Input placeholder="e.g., Speaking at a tech conference, updating GitHub profile, new role announcement" value={context} onChange={e => setContext(e.target.value)} />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <InlineTip className="flex-1">Generates 6 bio variants optimized for different platforms and lengths.</InlineTip>
                  <Button className="gap-2 shrink-0" onClick={handleGenerate} disabled={loading}>
                    <User className="h-4 w-4" /> Generate Bios
                  </Button>
                </div>
              </motion.div>

              <motion.div {...fade(2)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
                <User className="h-10 w-10 text-primary/40 mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">One Resume, Six Bios</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Get platform-optimized bios for Twitter, LinkedIn, conferences, and more — all generated from your resume.
                </p>
                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                  {bioTypes.map(bt => (
                    <span key={bt.key} className="px-2.5 py-1 rounded-full border bg-secondary/50">{bt.icon} {bt.label}</span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rounded-xl border bg-card p-12">
                <AIProgressLoader loading={loading} context="bio" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">Your Bios</h2>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setData(null)}>
                  <ArrowRight className="h-3 w-3" /> Generate Again
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {bioTypes.map((bt, i) => (
                  data[bt.key] && (
                    <motion.div key={bt.key} {...fade(i)} className={`rounded-xl border-2 p-4 sm:p-5 ${bt.color}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{bt.icon}</span>
                          <div>
                            <h3 className="text-sm font-semibold">{bt.label}</h3>
                            <p className="text-[10px] text-muted-foreground">{bt.maxChars}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] tabular-nums">{wordCount(data[bt.key])} words</Badge>
                          <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={() => copy(data[bt.key], bt.key)}>
                            {copied === bt.key ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copied === bt.key ? "Copied" : "Copy"}
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed">{data[bt.key]}</p>
                    </motion.div>
                  )
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
