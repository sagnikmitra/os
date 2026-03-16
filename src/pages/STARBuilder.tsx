import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Star, Copy, CheckCircle2, Lightbulb, HelpCircle, ChevronDown, ChevronUp, BookOpen, ArrowRight } from "lucide-react";
import AIProgressLoader from "@/components/AIProgressLoader";
import { InlineTip, AnalysisSection } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

const starColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
  situation: { bg: "bg-blue-500/5", border: "border-blue-500/20", text: "text-blue-600 dark:text-blue-400", label: "S — Situation" },
  task: { bg: "bg-purple-500/5", border: "border-purple-500/20", text: "text-purple-600 dark:text-purple-400", label: "T — Task" },
  action: { bg: "bg-emerald-500/5", border: "border-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", label: "A — Action" },
  result: { bg: "bg-amber-500/5", border: "border-amber-500/20", text: "text-amber-600 dark:text-amber-400", label: "R — Result" },
};

export default function STARBuilder() {
  const [achievement, setAchievement] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const [copied, setCopied] = useState<number | null>(null);

  const handleBuild = async () => {
    if (!achievement) { toast.error("Enter an achievement or bullet point"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("star-builder", { body: { achievement, targetRole } });
      if (error) throw error;
      setStories(data.stories || [data]);
      setExpandedIdx(0);
      toast.success("STAR stories built!");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  const copyStory = (story: any, idx: number) => {
    const text = `Question: ${story.question || "General"}\n\nSituation: ${story.situation}\n\nTask: ${story.task}\n\nAction: ${story.action}\n\nResult: ${story.result}`;
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied!");
  };

  return (
    <AppLayout title="STAR Story Builder" subtitle="Structure behavioral answers from your achievements">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {stories.length === 0 && !loading ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <motion.div {...fade(0)}>
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1">STAR Story Builder</h1>
                <p className="text-sm text-muted-foreground">Turn your resume achievements into structured behavioral interview answers.</p>
              </motion.div>

              <motion.div {...fade(1)} className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Your Achievement</h3>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Achievement or Resume Bullet <span className="text-destructive">*</span></Label>
                  <Textarea
                    placeholder="e.g., 'Led migration of 50+ microservices to Kubernetes, reducing deployment time by 60% and cutting infrastructure costs by $200K annually'"
                    value={achievement}
                    onChange={e => setAchievement(e.target.value)}
                    rows={4}
                    className="text-sm"
                  />
                  <span className="text-[10px] text-muted-foreground tabular-nums">{achievement.split(/\s+/).filter(Boolean).length} words</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Target Role <span className="text-muted-foreground font-normal">(optional — tailors the stories)</span></Label>
                  <Input placeholder="e.g., Staff Engineer, Engineering Manager" value={targetRole} onChange={e => setTargetRole(e.target.value)} />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <InlineTip className="flex-1">Paste a specific resume bullet for the best results. AI generates multiple STAR-structured stories from a single achievement.</InlineTip>
                  <Button className="gap-2 shrink-0" onClick={handleBuild} disabled={!achievement.trim()}>
                    <Star className="h-4 w-4" /> Build Stories
                  </Button>
                </div>
              </motion.div>

              <motion.div {...fade(2)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
                <BookOpen className="h-10 w-10 text-primary/40 mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">Structure Your Stories</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Turn any achievement into a complete behavioral interview answer with Situation, Task, Action, and Result — plus follow-up prep.
                </p>
                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                  {["STAR Framework", "Follow-up Questions", "Delivery Tips", "Copy & Practice"].map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full border bg-secondary/50">{tag}</span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rounded-xl border bg-card p-12">
                <AIProgressLoader loading={loading} context="interview" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">{stories.length} STAR {stories.length === 1 ? "Story" : "Stories"}</h2>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { setStories([]); }}>
                  <ArrowRight className="h-3 w-3" /> New Achievement
                </Button>
              </div>

              {stories.map((story, i) => (
                <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card overflow-hidden">
                  {/* Header */}
                  <button
                    onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                    className="w-full text-left p-4 sm:p-5 flex items-start gap-3 hover:bg-secondary/20 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold">{story.question || `Story ${i + 1}`}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{story.situation}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={(e) => { e.stopPropagation(); copyStory(story, i); }}
                      >
                        {copied === i ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied === i ? "Copied" : "Copy"}
                      </Button>
                      {expandedIdx === i ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedIdx === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 sm:px-5 pb-5 space-y-3 border-t pt-4">
                          {/* STAR Parts */}
                          <div className="grid sm:grid-cols-2 gap-3">
                            {(["situation", "task", "action", "result"] as const).map((part) => {
                              const c = starColors[part];
                              return (
                                <div key={part} className={`p-3.5 rounded-lg border ${c.bg} ${c.border}`}>
                                  <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${c.text}`}>{c.label}</h4>
                                  <p className="text-xs leading-relaxed">{story[part]}</p>
                                </div>
                              );
                            })}
                          </div>

                          {/* Tips */}
                          {story.tips && (
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                              <div className="flex items-start gap-2">
                                <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground leading-relaxed">{story.tips}</p>
                              </div>
                            </div>
                          )}

                          {/* Follow-up Questions */}
                          {story.follow_up_questions?.length > 0 && (
                            <div className="space-y-1.5">
                              <h4 className="text-xs font-semibold flex items-center gap-1.5">
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /> Possible Follow-ups
                              </h4>
                              <div className="space-y-1">
                                {story.follow_up_questions.map((q: string, j: number) => (
                                  <div key={j} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-secondary/30">
                                    <span className="text-muted-foreground font-mono shrink-0">{j + 1}.</span>
                                    <span className="text-muted-foreground leading-relaxed">{q}</span>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
