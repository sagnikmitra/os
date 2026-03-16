import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Heart, Copy, CheckCircle2, Building2, ArrowRight, Mail, MessageSquare, Linkedin } from "lucide-react";
import AIProgressLoader from "@/components/AIProgressLoader";
import { InlineTip } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export default function ThankYouNote() {
  const [interviewerName, setInterviewerName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [topics, setTopics] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!company || !role) { toast.error("Company and role required"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("thank-you-note", { body: { interviewerName, company, role, topics } });
      if (error) throw error;
      setResult(data);
      toast.success("Thank you note generated!");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied!");
  };

  const outputs = [
    { key: "subject", label: "Subject Line", icon: Mail, content: result?.subject },
    { key: "email", label: "Thank You Email", icon: MessageSquare, content: result?.email },
    { key: "linkedin_message", label: "LinkedIn Message", icon: Linkedin, content: result?.linkedin_message },
  ];

  return (
    <AppLayout title="Thank You Note Writer" subtitle="Post-interview emails referencing specific conversation points">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {!result && !loading ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <motion.div {...fade(0)}>
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1">Thank You Note Writer</h1>
                <p className="text-sm text-muted-foreground">Create personalized post-interview thank you emails and LinkedIn messages.</p>
              </motion.div>

              <motion.div {...fade(1)} className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Interview Details</h3>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Interviewer's Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input placeholder="e.g., Sarah Chen" value={interviewerName} onChange={e => setInterviewerName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Company <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="e.g., Google" value={company} onChange={e => setCompany(e.target.value)} className="pl-9" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Role <span className="text-destructive">*</span></Label>
                  <Input placeholder="e.g., Senior Software Engineer" value={role} onChange={e => setRole(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Discussion Topics <span className="text-muted-foreground font-normal">(makes it personal)</span></Label>
                  <Textarea placeholder="What you discussed, projects mentioned, things you found interesting, team dynamics..." value={topics} onChange={e => setTopics(e.target.value)} rows={5} className="text-sm" />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <InlineTip className="flex-1">The more conversation details you include, the more personalized and genuine your note will sound.</InlineTip>
                  <Button className="gap-2 shrink-0" onClick={handleGenerate} disabled={loading || !company.trim() || !role.trim()}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                    Generate Note
                  </Button>
                </div>
              </motion.div>

              <motion.div {...fade(2)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
                <Heart className="h-10 w-10 text-primary/40 mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">Make a Lasting Impression</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Stand out with a thoughtful thank you note that references specific topics from your conversation — plus a LinkedIn version.
                </p>
                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                  {["Thank You Email", "LinkedIn Message", "Personalized", "Send Within 24h"].map(tag => (
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
                  <h2 className="text-lg font-bold tracking-tight">Your Thank You Note</h2>
                  <p className="text-xs text-muted-foreground">{company} · {role}{interviewerName ? ` · ${interviewerName}` : ""}</p>
                </div>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setResult(null)}>
                  <ArrowRight className="h-3 w-3" /> New Note
                </Button>
              </div>

              {outputs.map((o, i) => (
                o.content && (
                  <motion.div key={o.key} {...fade(i)} className="rounded-xl border bg-card p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
                        <o.icon className="h-3 w-3 text-primary" /> {o.label}
                      </p>
                      <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={() => copy(o.content!, o.key)}>
                        {copied === o.key ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied === o.key ? "Copied" : "Copy"}
                      </Button>
                    </div>
                    <div className={`text-sm whitespace-pre-wrap leading-relaxed ${o.key === "subject" ? "font-medium px-3 py-2 rounded-lg bg-secondary/30" : ""}`}>
                      {o.content}
                    </div>
                  </motion.div>
                )
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
