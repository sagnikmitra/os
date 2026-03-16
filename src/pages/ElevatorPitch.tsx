import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Copy, Clock, CheckCircle2, Lightbulb, Users, Zap, ArrowRight } from "lucide-react";
import ResumeSourceSelector from "@/components/ResumeSourceSelector";
import { useResumeSource } from "@/hooks/useResumeSource";
import AIProgressLoader from "@/components/AIProgressLoader";
import { InlineTip, AnalysisSection } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

const pitchMeta = [
  { key: "pitch_30", label: "30-Second Pitch", seconds: 30, icon: Zap, color: "border-score-excellent/30 bg-score-excellent/5", badgeColor: "bg-score-excellent/10 text-score-excellent", desc: "Quick intro — networking events, brief encounters" },
  { key: "pitch_60", label: "60-Second Pitch", seconds: 60, icon: Mic, color: "border-primary/30 bg-primary/5", badgeColor: "bg-primary/10 text-primary", desc: "Standard length — interviews, career fairs" },
  { key: "pitch_90", label: "90-Second Pitch", seconds: 90, icon: Users, color: "border-score-warning/30 bg-score-warning/5", badgeColor: "bg-score-warning/10 text-score-warning", desc: "Detailed version — deep conversations, presentations" },
];

export default function ElevatorPitch() {
  const resume = useResumeSource();
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    const resumeText = resume.getResumeText();
    if (!resumeText) { toast.error("Select a resume or paste text"); return; }
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("elevator-pitch", { body: { resumeText, audience } });
      if (error) throw error;
      setData(res);
      toast.success("Pitches generated!");
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
    <AppLayout title="Elevator Pitch Generator" subtitle="30/60/90 second pitches tailored to your audience">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {!data && !loading ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <motion.div {...fade(0)}>
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1">Elevator Pitch Generator</h1>
                <p className="text-sm text-muted-foreground">AI generates 30, 60, and 90-second pitches tailored to your background and audience.</p>
              </motion.div>

              <motion.div {...fade(1)} className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Mic className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Build Your Pitch</h3>
                </div>

                <ResumeSourceSelector {...resume} textareaRows={5} />

                <div className="space-y-1.5">
                  <Label className="text-xs">Target Audience <span className="text-muted-foreground font-normal">(optional — personalizes tone)</span></Label>
                  <Input placeholder="e.g., Tech recruiter, Startup founder, Investor, Conference attendee" value={audience} onChange={e => setAudience(e.target.value)} />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <InlineTip className="flex-1">Generates three pitch lengths. Specify your audience for tone-matched language and emphasis.</InlineTip>
                  <Button className="gap-2 shrink-0" onClick={handleGenerate}>
                    <Mic className="h-4 w-4" /> Generate Pitches
                  </Button>
                </div>
              </motion.div>

              <motion.div {...fade(2)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
                <Mic className="h-10 w-10 text-primary/40 mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">Nail Your Introduction</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Get three professionally crafted elevator pitches — from a quick 30-second intro to a detailed 90-second story — with delivery tips.
                </p>
                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                  {["30s Quick Intro", "60s Standard", "90s Detailed", "Delivery Tips"].map(tag => (
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
                <h2 className="text-lg font-bold tracking-tight">Your Elevator Pitches</h2>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setData(null)}>
                  <ArrowRight className="h-3 w-3" /> Generate Again
                </Button>
              </div>

              {/* Pitch Cards */}
              {pitchMeta.map((p, i) => (
                data[p.key] && (
                  <motion.div key={p.key} {...fade(i)} className={`rounded-xl border-2 overflow-hidden ${p.color}`}>
                    <div className="p-4 sm:p-5 border-b border-border/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.badgeColor}`}>
                          <p.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">{p.label}</h3>
                          <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] gap-1 font-mono">
                          <Clock className="h-2.5 w-2.5" /> ~{p.seconds}s
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] tabular-nums">
                          {wordCount(data[p.key])} words
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => copy(data[p.key], p.key)}
                        >
                          {copied === p.key ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copied === p.key ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    </div>
                    <div className="p-5 sm:p-6">
                      <p className="text-sm leading-[1.8] whitespace-pre-wrap">{data[p.key]}</p>
                    </div>
                  </motion.div>
                )
              ))}

              {/* Delivery Tips */}
              {data.tips?.length > 0 && (
                <AnalysisSection id="ep-tips" title="Delivery Tips" subtitle="How to deliver your pitch effectively" icon={<Lightbulb className="h-4 w-4" />}>
                  <div className="p-4 sm:p-5 space-y-3">
                    {data.tips.map((t: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
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
