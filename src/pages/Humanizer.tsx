import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { ScoreCard, SeverityBadge } from "@/components/ScoreCard";
import { motion } from "@/lib/motion-stub";
import {
  Bot, Sparkles, MessageSquare, BookOpen, AlertTriangle, Wand2,
  Copy, CheckCircle2, ChevronDown, ChevronUp, RefreshCw, Loader2,
  Lightbulb, Target, Zap, Shield,
} from "lucide-react";
import { useAnalysis } from "@/context/AnalysisContext";
import { AnalysisRequiredState } from "@/components/AnalysisRequiredState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

const toneStyles = [
  { id: "More Human", label: "More Human", desc: "Warm, authentic, personal voice" },
  { id: "Sharper", label: "Sharper", desc: "Precise, direct, no filler" },
  { id: "More Executive", label: "Executive", desc: "Strategic language, gravitas" },
  { id: "More Technical", label: "Technical", desc: "Domain-specific, credible depth" },
  { id: "More Concise", label: "Concise", desc: "Half the words, same impact" },
  { id: "Startup-Oriented", label: "Startup", desc: "Builder mindset, ownership tone" },
  { id: "Enterprise-Ready", label: "Enterprise", desc: "Process-aware, stakeholder language" },
];

const categoryLabels: Record<string, string> = {
  buzzword: "Buzzword",
  template: "Template Language",
  ai_pattern: "AI Pattern",
  cliche: "Cliché",
  over_polished: "Over-Polished",
};

export function HumanizerContent({ embedded = false }: { embedded?: boolean }) {
  const { analysis } = useAnalysis();
  const [selectedStyle, setSelectedStyle] = useState("More Human");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [rewrites, setRewrites] = useState<Record<number, string>>({});
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [customResult, setCustomResult] = useState("");
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [activeTab, setActiveTab] = useState<"analysis" | "custom">("analysis");

  if (!analysis) return (
    <AppLayout title="AI Detection">
      <AnalysisRequiredState
        pageTitle="AI Detection & Humanizer"
        description="Upload your resume to detect AI-generated content, assess authenticity, and get humanized rewrites."
      />
    </AppLayout>
  );

  const h = analysis.humanizer_analysis;
  const score = analysis.scores.human_authenticity;
  const tone = h.tone_analysis;
  const vocab = h.vocabulary_analysis;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied!");
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const humanizeDetection = async (idx: number, original: string) => {
    setLoadingIdx(idx);
    try {
      const { data, error } = await supabase.functions.invoke("humanize-text", {
        body: { text: original, style: selectedStyle },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      setRewrites(prev => ({ ...prev, [idx]: data.humanized }));
    } catch (err: any) {
      toast.error(err.message || "Failed to humanize");
    } finally {
      setLoadingIdx(null);
    }
  };

  const humanizeCustom = async () => {
    if (!customText.trim()) return;
    setLoadingCustom(true);
    try {
      const { data, error } = await supabase.functions.invoke("humanize-text", {
        body: { text: customText, style: selectedStyle },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      setCustomResult(data.humanized);
    } catch (err: any) {
      toast.error(err.message || "Failed to humanize");
    } finally {
      setLoadingCustom(false);
    }
  };

  const aiProbColor = (p: number) =>
    p >= 80 ? "text-rose-600 dark:text-rose-400" :
    p >= 50 ? "text-amber-600 dark:text-amber-400" :
    "text-emerald-600 dark:text-emerald-400";

  const aiProbBg = (p: number) =>
    p >= 80 ? "bg-rose-500/10 border-rose-500/20" :
    p >= 50 ? "bg-amber-500/10 border-amber-500/20" :
    "bg-emerald-500/10 border-emerald-500/20";

  return (
    <div className={cn(
      "space-y-8",
      !embedded && "p-6 max-w-5xl mx-auto"
    )}>

      {/* Header */}
        <motion.div {...fade(0)} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" /> AI Humanizer
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Detect robotic, generic, AI-generated language and rewrite it as authentic human writing.
            </p>
          </div>
          <ScoreCard title="Human Authenticity" score={score.score} icon={<Bot className="h-4 w-4" />} compact />
        </motion.div>

        {/* Verdict + AI Probability */}
        <motion.div {...fade(1)} className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${score.score < 50 ? "score-bg-risk" : score.score < 70 ? "score-bg-warning" : "score-bg-excellent"}`}>
              <Bot className={`h-5 w-5 ${score.score < 50 ? "score-risk" : score.score < 70 ? "score-warning" : "score-excellent"}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Verdict: {h.verdict}</h3>
              <p className="text-xs text-muted-foreground">{score.summary}</p>
            </div>
            {h.ai_probability !== undefined && (
              <div className={`text-center p-3 rounded-lg border ${aiProbBg(h.ai_probability)}`}>
                <div className={`text-2xl font-bold tabular-nums ${aiProbColor(h.ai_probability)}`}>{h.ai_probability}%</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Detected</div>
              </div>
            )}
          </div>

          {/* AI Risk Scale */}
          {h.ai_probability !== undefined && (
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Human</span><span>Likely AI</span><span>AI Generated</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${h.ai_probability >= 80 ? "bg-rose-500" : h.ai_probability >= 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${h.ai_probability}%` }}
                />
              </div>
            </div>
          )}

          {h.flags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {h.flags.map((flag) => (
                <span key={flag} className="px-2.5 py-1 rounded-md text-xs font-medium score-bg-risk score-risk border score-border-risk">{flag}</span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Tone & Vocabulary */}
        {(tone || vocab) && (
          <motion.div {...fade(2)} className="grid sm:grid-cols-2 gap-6">
            {tone && (
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" /> Tone Analysis
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overall Tone</span>
                    <span className="font-medium">{tone.overall_tone}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Consistency</span>
                    <SeverityBadge level={tone.consistency === "consistent" ? "excellent" : "warning"} label={tone.consistency} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Personality Score</span>
                    <span className="font-bold tabular-nums">{tone.personality_score}/100</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Voice Uniqueness</span>
                    <SeverityBadge
                      level={tone.voice_uniqueness === "unique" ? "excellent" : tone.voice_uniqueness === "generic" ? "warning" : "risk"}
                      label={tone.voice_uniqueness}
                    />
                  </div>
                </div>
                {/* Personality score bar */}
                <div className="mt-4">
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${tone.personality_score}%` }} />
                  </div>
                </div>
              </div>
            )}
            {vocab && (
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-accent" /> Vocabulary Analysis
                </h3>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Diversity Score</span>
                    <span className="font-bold tabular-nums">{vocab.diversity_score}/100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${vocab.diversity_score}%` }} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Jargon Level</span>
                    <SeverityBadge
                      level={vocab.jargon_level === "appropriate" ? "excellent" : vocab.jargon_level === "excessive" ? "risk" : "warning"}
                      label={vocab.jargon_level}
                    />
                  </div>
                </div>
                {vocab.overused_buzzwords?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Overused Buzzwords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {vocab.overused_buzzwords.map((w) => (
                        <span key={w} className="px-2 py-0.5 rounded-md text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400">{w}</span>
                      ))}
                    </div>
                  </div>
                )}
                {vocab.cliche_phrases?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Clichés Found</p>
                    <div className="flex flex-wrap gap-1.5">
                      {vocab.cliche_phrases.map((p) => (
                        <span key={p} className="px-2 py-0.5 rounded-md text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Rewrite Style Selector */}
        <motion.div {...fade(3)} className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-accent" /> Rewrite Style
          </h3>
          <p className="text-xs text-muted-foreground mb-3">Select a voice style for AI-powered humanization below.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {toneStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  selectedStyle === style.id
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-secondary/30 border-border hover:border-primary/20"
                }`}
              >
                <div className="font-medium text-xs">{style.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{style.desc}</div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tabs: Analysis Detections vs Custom */}
        <motion.div {...fade(4)}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="analysis" className="gap-1.5 text-xs">
                <Shield className="h-3 w-3" /> Resume Detections ({h.detections?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="custom" className="gap-1.5 text-xs">
                <Wand2 className="h-3 w-3" /> Humanize Any Text
              </TabsTrigger>
            </TabsList>

            {/* Analysis Detections Tab */}
            <TabsContent value="analysis">
              {h.detections?.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {h.detections.filter(d => d.severity === "critical").length} critical ·{" "}
                      {h.detections.filter(d => d.severity === "risk").length} risk ·{" "}
                      {h.detections.filter(d => d.severity === "warning").length} warning
                    </p>
                  </div>
                  {h.detections.map((d, i) => (
                    <div key={i} className="rounded-xl border bg-card overflow-hidden">
                      {/* Header */}
                      <button
                        className="w-full p-4 text-left hover:bg-secondary/30 transition-colors"
                        onClick={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <SeverityBadge level={d.severity as any} />
                            {d.category && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase tracking-wider font-medium">
                                {categoryLabels[d.category] || d.category}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{d.original}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                            {expanded[i] ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                          </div>
                        </div>
                      </button>

                      {/* Expanded content */}
                      {expanded[i] && (
                        <div className="px-4 pb-4 border-t space-y-3 pt-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Original</p>
                            <p className="text-sm leading-relaxed p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">{d.original}</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> {d.issue}
                            </p>
                          </div>

                          {/* AI-generated humanized (from analysis) */}
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-accent" /> Analysis Suggestion
                            </p>
                            <div className="flex items-start gap-2">
                              <p className="text-sm leading-relaxed p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex-1">{d.humanized}</p>
                              <button
                                onClick={() => handleCopy(d.humanized, `orig-${i}`)}
                                className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors shrink-0"
                              >
                                {copiedKey === `orig-${i}` ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                              </button>
                            </div>
                          </div>

                          {/* Custom AI rewrite button */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1.5 flex-1"
                              onClick={() => humanizeDetection(i, d.original)}
                              disabled={loadingIdx === i}
                            >
                              {loadingIdx === i ? (
                                <><Loader2 className="h-3 w-3 animate-spin" /> Rewriting as "{selectedStyle}"...</>
                              ) : (
                                <><Wand2 className="h-3 w-3 text-accent" /> Rewrite as "{selectedStyle}"</>
                              )}
                            </Button>
                          </div>

                          {/* Custom AI rewrite result */}
                          {rewrites[i] && (
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                                <Wand2 className="h-3 w-3 text-primary" /> "{selectedStyle}" Rewrite
                              </p>
                              <div className="flex items-start gap-2">
                                <p className="text-sm leading-relaxed p-3 rounded-lg bg-primary/5 border border-primary/10 flex-1">{rewrites[i]}</p>
                                <button
                                  onClick={() => handleCopy(rewrites[i], `ai-${i}`)}
                                  className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors shrink-0"
                                >
                                  {copiedKey === `ai-${i}` ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Bot className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No AI patterns detected — your resume reads as authentic.</p>
                </div>
              )}
            </TabsContent>

            {/* Custom Text Tab */}
            <TabsContent value="custom">
              <div className="rounded-xl border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <p className="text-xs text-muted-foreground">Paste any text — bullet, summary, cover letter paragraph — and humanize it with the selected style.</p>
                </div>
                <Textarea
                  placeholder="Paste the text you want to humanize here..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="min-h-[120px] resize-none text-sm"
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={humanizeCustom}
                    disabled={loadingCustom || !customText.trim()}
                    className="gap-2"
                  >
                    {loadingCustom ? <><Loader2 className="h-4 w-4 animate-spin" /> Humanizing...</> : <><Wand2 className="h-4 w-4" /> Humanize as "{selectedStyle}"</>}
                  </Button>
                  {customText && (
                    <Button variant="ghost" size="sm" onClick={() => { setCustomText(""); setCustomResult(""); }}>
                      Clear
                    </Button>
                  )}
                </div>

                {customResult && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-accent" /> Humanized Result
                      </p>
                      <button
                        onClick={() => handleCopy(customResult, "custom")}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copiedKey === "custom" ? <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                      </button>
                    </div>
                    <div className="text-sm leading-relaxed p-4 rounded-lg bg-primary/5 border border-primary/10 whitespace-pre-wrap">
                      {customResult}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={humanizeCustom} disabled={loadingCustom}>
                        <RefreshCw className="h-3 w-3" /> Regenerate
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Tips */}
        <motion.div {...fade(5)} className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> How to Use This Tool Effectively
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: Zap, tip: "Fix the most critical detections first — they have the most impact on recruiter trust" },
              { icon: Target, tip: "Use 'Executive' style for leadership roles, 'Technical' for engineering/IC roles" },
              { icon: Lightbulb, tip: "The best rewrites blend AI suggestions with your own authentic details and metrics" },
              { icon: Bot, tip: "AI patterns like 'passionate about' and 'results-driven' are filtered by ATS and ignored by recruiters" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/30">
                <item.icon className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span className="text-xs text-muted-foreground leading-relaxed">{item.tip}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
  );
}

export default function Humanizer({ embedded = false }: { embedded?: boolean }) {
  const content = <HumanizerContent embedded={embedded} />;
  return embedded ? content : <AppLayout title="AI Humanizer">{content}</AppLayout>;
}
