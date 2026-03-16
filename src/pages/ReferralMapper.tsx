import { useState } from "react";
import AIProgressLoader from "@/components/AIProgressLoader";
import { motion } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Network, Users, Copy, Lightbulb, ArrowRight, Building2 } from "lucide-react";
import ResumeSourceSelector from "@/components/ResumeSourceSelector";
import { useResumeSource } from "@/hooks/useResumeSource";
import { InlineTip, AnalysisSection } from "@/components/analysis/AnalysisShell";
import { SeverityBadge } from "@/components/ScoreCard";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export default function ReferralMapper() {
  const resume = useResumeSource();
  const [targetCompany, setTargetCompany] = useState("");
  const [yourNetwork, setYourNetwork] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const handleMap = async () => {
    if (!targetCompany) { toast.error("Enter a company"); return; }
    setLoading(true);
    try {
      const resumeText = resume.getResumeText();
      const { data: res, error } = await supabase.functions.invoke("referral-mapper", { body: { targetCompany, yourNetwork, resumeText } });
      if (error) throw error;
      setData(res);
      toast.success("Referral strategy generated!");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  const diffLevel = (d: string) => {
    const lower = d?.toLowerCase() || "";
    if (lower.includes("easy") || lower.includes("low")) return "excellent" as const;
    if (lower.includes("medium") || lower.includes("moderate")) return "warning" as const;
    return "risk" as const;
  };

  return (
    <AppLayout title="Referral Network Mapper" subtitle="Find warm paths into target companies">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="rounded-xl border bg-card p-12">
            <AIProgressLoader loading={loading} context="outreach" />
          </div>
        ) : !data ? (
          <>
            <motion.div {...fade(0)} className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Network className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Map Your Referral Network</h3>
              </div>
              <ResumeSourceSelector {...resume} textareaRows={4} textareaPlaceholder="Paste your resume text..." />
              <div className="space-y-1.5">
                <Label className="text-xs">Target Company <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="e.g., Google, Stripe, Airbnb" value={targetCompany} onChange={e => setTargetCompany(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Your Network <span className="text-muted-foreground font-normal">(optional — improves results)</span></Label>
                <Textarea placeholder="Describe your network: industries, past companies, alumni groups, conferences, LinkedIn connections..." value={yourNetwork} onChange={e => setYourNetwork(e.target.value)} rows={3} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <InlineTip className="flex-1">Describe your professional network for more personalized referral paths and outreach templates.</InlineTip>
                <Button className="gap-2 shrink-0" onClick={handleMap}>
                  <Network className="h-4 w-4" /> Map Referral Paths
                </Button>
              </div>
            </motion.div>

            <motion.div {...fade(1)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
              <Users className="h-10 w-10 text-primary/40 mx-auto mb-4" />
              <h3 className="font-display text-lg font-bold mb-2">Find Warm Introductions</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                AI maps the best referral paths into your target company based on your background and network, with ready-to-use outreach messages.
              </p>
              <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                {["Referral Paths", "Outreach Templates", "Difficulty Rating", "Networking Tips"].map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-full border bg-secondary/50">{tag}</span>
                ))}
              </div>
            </motion.div>
          </>
        ) : (
          <div className="space-y-6">
            {/* Strategy */}
            {data.strategy && (
              <motion.div {...fade(0)} className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-primary" /> Overall Strategy</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{data.strategy}</p>
              </motion.div>
            )}

            {/* Paths */}
            {data.paths?.map((path: any, i: number) => (
              <motion.div key={i} {...fade(i + 1)} className="rounded-xl border bg-card overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <h3 className="font-semibold text-sm truncate">{path.approach}</h3>
                    </div>
                    {path.difficulty && <SeverityBadge level={diffLevel(path.difficulty)} label={path.difficulty} />}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed ml-10">{path.description}</p>

                  {path.message_template && (
                    <div className="mt-3 ml-10 relative group">
                      <div className="rounded-lg bg-secondary/40 p-4 text-sm leading-relaxed whitespace-pre-wrap">{path.message_template}</div>
                      <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-7 gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copy(path.message_template)}>
                        <Copy className="h-3 w-3" /> Copy
                      </Button>
                    </div>
                  )}

                  {path.tips?.length > 0 && (
                    <div className="mt-3 ml-10 space-y-1.5">
                      {path.tips.map((t: string, ti: number) => (
                        <div key={ti} className="flex items-start gap-2 text-xs">
                          <Lightbulb className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{t}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            <Button variant="outline" onClick={() => setData(null)} className="gap-2">
              <Network className="h-4 w-4" /> New Company
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
