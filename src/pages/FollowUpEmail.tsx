import { useState } from "react";
import AIProgressLoader from "@/components/AIProgressLoader";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Copy, CheckCircle2, Loader2, Mail, RefreshCw, Building2, Lightbulb, ArrowRight } from "lucide-react";
import ResumeSourceSelector from "@/components/ResumeSourceSelector";
import { useResumeSource } from "@/hooks/useResumeSource";
import { InlineTip } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

const emailTypes = [
  { value: "post-interview", label: "Post-Interview Thank You", desc: "After a phone/onsite" },
  { value: "post-application", label: "Post-Application Follow-Up", desc: "No response yet" },
  { value: "no-response", label: "No Response Follow-Up", desc: "Second nudge" },
  { value: "after-rejection", label: "After Rejection", desc: "Stay in touch" },
  { value: "referral-request", label: "Referral Request", desc: "Ask for a referral" },
];

export default function FollowUpEmail() {
  const resume = useResumeSource();
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [interviewDetails, setInterviewDetails] = useState("");
  const [emailType, setEmailType] = useState("post-interview");
  const [result, setResult] = useState<{ subject: string; email: string; tips: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!companyName || !role) { toast.error("Company and role are required"); return; }
    setLoading(true);
    try {
      const resumeData = resume.getResumeData();
      const { data, error } = await supabase.functions.invoke("generate-follow-up-email", {
        body: { companyName, role, interviewDetails, emailType, resumeData },
      });
      if (error) throw error;
      setResult(data);
      toast.success("Follow-up email generated!");
    } catch (e: any) { toast.error(e.message || "Failed to generate"); }
    finally { setLoading(false); }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied!");
  };

  return (
    <AppLayout title="Follow-Up Email Generator" subtitle="AI-crafted follow-up emails after interviews or applications">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {!result && !loading ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <motion.div {...fade(0)}>
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1">Follow-Up Email Generator</h1>
                <p className="text-sm text-muted-foreground">Create professional follow-up emails that reference your interview and keep you top of mind.</p>
              </motion.div>

              <motion.div {...fade(1)} className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Email Details</h3>
                </div>

                <ResumeSourceSelector {...resume} textareaRows={3} />

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Company <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="e.g., Google" value={companyName} onChange={e => setCompanyName(e.target.value)} className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Role <span className="text-destructive">*</span></Label>
                    <Input placeholder="e.g., Senior Engineer" value={role} onChange={e => setRole(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Email Type</Label>
                  <Select value={emailType} onValueChange={setEmailType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {emailTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">{emailTypes.find(t => t.value === emailType)?.desc}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Context <span className="text-muted-foreground font-normal">(optional — makes it personal)</span></Label>
                  <Textarea placeholder="What you discussed, interviewer name, key topics, anything memorable..." value={interviewDetails} onChange={e => setInterviewDetails(e.target.value)} rows={4} className="text-sm" />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <InlineTip className="flex-1">Include conversation details for a personalized email that references specific discussion points.</InlineTip>
                  <Button className="gap-2 shrink-0" onClick={handleGenerate} disabled={loading || !companyName.trim() || !role.trim()}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Generate Email
                  </Button>
                </div>
              </motion.div>

              {/* Empty State */}
              <motion.div {...fade(2)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
                <Mail className="h-10 w-10 text-primary/40 mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">Stay Top of Mind</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Generate professional follow-up emails that reference your specific conversations and demonstrate genuine interest.
                </p>
                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                  {["Post-Interview", "Application Follow-Up", "No Response", "Rejection Recovery"].map(tag => (
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
          ) : result && (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Your Follow-Up Email</h2>
                  <p className="text-xs text-muted-foreground">{companyName} · {role} · {emailTypes.find(t => t.value === emailType)?.label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={handleGenerate}>
                    <RefreshCw className="h-3 w-3" /> Regenerate
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setResult(null)}>
                    <ArrowRight className="h-3 w-3" /> New Email
                  </Button>
                </div>
              </div>

              {/* Subject */}
              <motion.div {...fade(0)} className="rounded-xl border bg-card p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Subject Line</p>
                  <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={() => handleCopy(result.subject, "subject")}>
                    {copied === "subject" ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied === "subject" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="text-sm font-medium px-3 py-2 rounded-lg bg-secondary/30">{result.subject}</p>
              </motion.div>

              {/* Email Body */}
              <motion.div {...fade(1)} className="rounded-xl border bg-card p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Email Body</p>
                  <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={() => handleCopy(result.email, "email")}>
                    {copied === "email" ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied === "email" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed p-4 rounded-lg bg-secondary/20">{result.email}</div>
              </motion.div>

              {/* Tips */}
              {result.tips?.length > 0 && (
                <motion.div {...fade(2)} className="rounded-xl border bg-card p-4 sm:p-5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1 mb-3">
                    <Lightbulb className="h-3 w-3 text-primary" /> Sending Tips
                  </p>
                  <div className="space-y-2">
                    {result.tips.map((t, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-primary/5">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <span className="text-xs text-muted-foreground leading-relaxed">{t}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
