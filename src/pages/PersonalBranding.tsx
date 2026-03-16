import { useState } from "react";
import AIProgressLoader from "@/components/AIProgressLoader";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Fingerprint, Mic, Linkedin, Globe,
  Mail, Copy, CheckCircle2, Tag, Lightbulb,
  Star, ArrowRight,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ResumeSourceSelector from "@/components/ResumeSourceSelector";
import { useResumeSource } from "@/hooks/useResumeSource";
import { InlineTip, AnalysisSection } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export default function PersonalBranding() {
  const resume = useResumeSource();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleAnalyze = async () => {
    const resumeText = resume.getResumeText();
    if (!resumeText) { toast.error("Select a resume or paste text"); return; }
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("personal-branding", { body: { resumeText } });
      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);
      setData(result);
      toast.success("Personal branding analysis complete!");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success("Copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <AppLayout title="Personal Branding" subtitle="Brand audit, elevator pitches, LinkedIn optimization, and networking templates">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {!data && !loading ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <motion.div {...fade(0)}>
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1">Personal Branding</h1>
                <p className="text-sm text-muted-foreground">Get a full brand audit with elevator pitches, LinkedIn optimization, and networking templates.</p>
              </motion.div>

              <motion.div {...fade(1)} className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Fingerprint className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Your Profile</h3>
                </div>

                <ResumeSourceSelector {...resume} textareaRows={5} />

                <div className="flex items-center justify-between gap-4">
                  <InlineTip className="flex-1">Generates brand statement, elevator pitches, LinkedIn content, and networking templates.</InlineTip>
                  <Button className="gap-2 shrink-0" onClick={handleAnalyze}>
                    <Fingerprint className="h-4 w-4" /> Generate Brand Analysis
                  </Button>
                </div>
              </motion.div>

              <motion.div {...fade(2)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
                <Fingerprint className="h-10 w-10 text-primary/40 mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">Own Your Narrative</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Get a comprehensive brand audit with clarity, uniqueness, and consistency scores — plus actionable content for every platform.
                </p>
                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                  {["Brand Audit", "Elevator Pitches", "LinkedIn", "Networking Templates"].map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full border bg-secondary/50">{tag}</span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rounded-xl border bg-card p-12">
                <AIProgressLoader loading={loading} context="career" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">Your Brand Analysis</h2>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setData(null)}>
                  <ArrowRight className="h-3 w-3" /> Analyze Again
                </Button>
              </div>

              {/* Brand Audit */}
              {data.brand_audit && (
                <motion.div {...fade(0)} className="rounded-xl border bg-card p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">Brand Audit</h3>
                    <div className="text-center">
                      <span className="text-2xl font-bold text-primary">{data.brand_audit.overall_brand_grade}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {[
                      { label: "Clarity", value: data.brand_audit.brand_clarity_score },
                      { label: "Uniqueness", value: data.brand_audit.uniqueness_score },
                      { label: "Consistency", value: data.brand_audit.consistency_score },
                    ].map((m, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{m.label}</p>
                          <span className="text-xs font-bold tabular-nums">{m.value}</span>
                        </div>
                        <Progress value={m.value} className="h-2" />
                      </div>
                    ))}
                  </div>
                  {data.brand_audit.current_brand_perception && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-secondary/30 p-3">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Current Perception</p>
                        <p className="text-xs leading-relaxed">{data.brand_audit.current_brand_perception}</p>
                      </div>
                      <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Ideal Perception</p>
                        <p className="text-xs leading-relaxed">{data.brand_audit.ideal_brand_perception}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Brand Statement */}
              {data.brand_statement && (
                <motion.div {...fade(1)} className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary" /> Brand Statement
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => copyText(data.brand_statement, "statement")} className="h-6 gap-1 text-[10px]">
                      {copied === "statement" ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy
                    </Button>
                  </div>
                  <p className="text-sm italic leading-relaxed">"{data.brand_statement}"</p>
                  {data.taglines?.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Tagline Options</p>
                      {data.taglines.map((t: string, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-background/50">
                          <span className="text-muted-foreground">• {t}</span>
                          <Button variant="ghost" size="sm" onClick={() => copyText(t, `tag-${i}`)} className="h-5 w-5 p-0">
                            {copied === `tag-${i}` ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {data.brand_keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {data.brand_keywords.map((k: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-[10px]"><Tag className="h-2.5 w-2.5 mr-1" /> {k}</Badge>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              <Tabs defaultValue="pitches" className="space-y-4">
                <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
                  <TabsTrigger value="pitches" className="gap-1.5 text-xs"><Mic className="h-3 w-3" /> Elevator Pitches</TabsTrigger>
                  <TabsTrigger value="linkedin" className="gap-1.5 text-xs"><Linkedin className="h-3 w-3" /> LinkedIn</TabsTrigger>
                  <TabsTrigger value="presence" className="gap-1.5 text-xs"><Globe className="h-3 w-3" /> Online Presence</TabsTrigger>
                  <TabsTrigger value="templates" className="gap-1.5 text-xs"><Mail className="h-3 w-3" /> Networking</TabsTrigger>
                </TabsList>

                {/* Elevator Pitches */}
                <TabsContent value="pitches" className="space-y-3">
                  {data.elevator_pitches?.map((p: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{p.duration}</Badge>
                          <span className="text-sm font-medium">{p.context}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => copyText(p.pitch, `pitch-${i}`)} className="h-6 gap-1 text-[10px]">
                          {copied === `pitch-${i}` ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{p.pitch}</p>
                      {p.tips && (
                        <div className="flex items-start gap-2 mt-2 p-2 rounded-lg bg-primary/5">
                          <Lightbulb className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                          <p className="text-[10px] text-muted-foreground">{p.tips}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </TabsContent>

                {/* LinkedIn */}
                <TabsContent value="linkedin" className="space-y-4">
                  {data.linkedin_optimization?.headlines?.length > 0 && (
                    <AnalysisSection id="pb-headlines" title="Headlines" icon={<Linkedin className="h-4 w-4" />}>
                      <div className="p-4 sm:p-5 space-y-2">
                        {data.linkedin_optimization.headlines.map((h: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                            <div>
                              <Badge variant="outline" className="text-[10px] mb-1">{h.style}</Badge>
                              <p className="text-sm font-medium">{h.headline}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => copyText(h.headline, `hl-${i}`)} className="h-6 w-6 p-0">
                              {copied === `hl-${i}` ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </AnalysisSection>
                  )}
                  {data.linkedin_optimization?.summary_variants?.length > 0 && (
                    <AnalysisSection id="pb-about" title="About Section" icon={<Linkedin className="h-4 w-4" />}>
                      <div className="p-4 sm:p-5 space-y-3">
                        {data.linkedin_optimization.summary_variants.map((s: any, i: number) => (
                          <div key={i} className="rounded-lg border bg-secondary/10 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="text-[10px]">{s.tone}</Badge>
                              <Button variant="ghost" size="sm" onClick={() => copyText(s.summary, `sum-${i}`)} className="h-6 gap-1 text-[10px]">
                                {copied === `sum-${i}` ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{s.summary}</p>
                          </div>
                        ))}
                      </div>
                    </AnalysisSection>
                  )}
                  {data.linkedin_optimization?.profile_tips?.length > 0 && (
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-semibold flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5 text-primary" /> Profile Tips</h3>
                      {data.linkedin_optimization.profile_tips.map((t: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-secondary/30">
                          <Lightbulb className="h-3 w-3 mt-0.5 text-primary shrink-0" /> {t}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Online Presence */}
                <TabsContent value="presence" className="space-y-4">
                  {data.online_presence_strategy?.content_pillars?.length > 0 && (
                    <motion.div {...fade(0)} className="rounded-xl border bg-card p-4 sm:p-5">
                      <h3 className="text-xs font-semibold mb-3">Content Pillars</h3>
                      <div className="flex flex-wrap gap-2">
                        {data.online_presence_strategy.content_pillars.map((p: string, i: number) => (
                          <Badge key={i} variant="secondary">{p}</Badge>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {data.online_presence_strategy?.platforms?.map((p: any, i: number) => (
                    <motion.div key={i} {...fade(i + 1)} className="rounded-xl border bg-card p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{p.platform}</h4>
                        <Badge variant={p.priority === "high" ? "default" : "secondary"} className="text-[10px]">{p.priority}</Badge>
                      </div>
                      {p.posting_frequency && <p className="text-xs text-muted-foreground mb-2">📅 {p.posting_frequency}</p>}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {p.content_types?.map((c: string, ci: number) => (
                          <Badge key={ci} variant="outline" className="text-[10px]">{c}</Badge>
                        ))}
                      </div>
                      {p.sample_posts?.length > 0 && (
                        <div className="space-y-1.5 mt-3">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Sample Posts</p>
                          {p.sample_posts.map((sp: string, si: number) => (
                            <div key={si} className="rounded-lg bg-secondary/30 p-3 text-xs text-muted-foreground flex items-start justify-between gap-2">
                              <span className="leading-relaxed">{sp}</span>
                              <Button variant="ghost" size="sm" onClick={() => copyText(sp, `post-${i}-${si}`)} className="h-5 w-5 p-0 shrink-0">
                                {copied === `post-${i}-${si}` ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </TabsContent>

                {/* Networking Templates */}
                <TabsContent value="templates" className="space-y-3">
                  {data.networking_templates?.map((t: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <Badge variant="outline" className="text-[10px] mb-1">{t.type}</Badge>
                          <p className="text-sm font-medium">Subject: {t.subject}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => copyText(`Subject: ${t.subject}\n\n${t.body}`, `email-${i}`)} className="h-6 gap-1 text-[10px]">
                          {copied === `email-${i}` ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy
                        </Button>
                      </div>
                      <div className="rounded-lg bg-secondary/20 p-4 text-sm text-muted-foreground whitespace-pre-line leading-relaxed mt-2">{t.body}</div>
                      {t.context && (
                        <div className="flex items-start gap-2 mt-2 p-2 rounded-lg bg-primary/5">
                          <Lightbulb className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                          <p className="text-[10px] text-muted-foreground">{t.context}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
