import { useState } from "react";
import { motion } from "@/lib/motion-stub";
import AIProgressLoader from "@/components/AIProgressLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2, Copy, CheckCircle2, Download, Sparkles, Building2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ResumeSourceSelector from "@/components/ResumeSourceSelector";
import { useResumeSource } from "@/hooks/useResumeSource";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export default function CoverLetter() {
  const resume = useResumeSource();
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState("balanced");
  const [coverLetter, setCoverLetter] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    // Get resume data from source selector
    const resumeData = resume.getResumeData();
    const resumeText = resume.getResumeText();
    if (!resumeData && !resumeText) { toast.error("Select a resume or paste your resume text."); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-cover-letter", {
        body: { resumeData: resumeData || { summary: resumeText }, jobDescription, companyName, jobTitle, tone },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.coverLetter) { setCoverLetter(data.coverLetter); toast.success("Cover letter generated!"); }
    } catch (err: any) { toast.error(err.message || "Failed to generate cover letter"); }
    finally { setGenerating(false); }
  };

  const handleCopy = () => { navigator.clipboard.writeText(coverLetter); setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success("Copied!"); };
  const handleDownload = () => { const b = new Blob([coverLetter], { type: "text/plain" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `Cover_Letter_${companyName || "Draft"}.txt`; a.click(); URL.revokeObjectURL(u); };

  const canGenerate = companyName.trim() || jobTitle.trim();
  const wordCount = coverLetter.split(/\s+/).filter(Boolean).length;

  return (
    <AppLayout title="Cover Letter">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <motion.div {...fade(0)}>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1">Cover Letter Generator</h1>
          <p className="text-sm text-muted-foreground">AI-powered cover letters tailored to your resume and target role.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input form */}
          <motion.div {...fade(1)} className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Details</h3>
            </div>

            <ResumeSourceSelector {...resume} textareaRows={4} textareaPlaceholder="Paste your resume text here..." />

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Company Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g., Google" className="pl-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Job Title</Label>
                <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g., Senior Engineer" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Job Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste JD for a more targeted letter..." rows={4} className="text-sm" />
            </div>

            <div className="flex items-center gap-3">
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleGenerate} disabled={generating || !canGenerate} className="flex-1 gap-2">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </motion.div>

          {/* Output */}
          <motion.div {...fade(2)} className="rounded-xl border bg-card overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Generated Letter</h3>
                {coverLetter && <span className="text-[10px] text-muted-foreground tabular-nums">{wordCount} words</span>}
              </div>
              {coverLetter && (
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={handleCopy}>
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={handleDownload}>
                    <Download className="h-3.5 w-3.5" /> .txt
                  </Button>
                </div>
              )}
            </div>
            <div className="p-5 flex-1 min-h-[400px]">
              {generating ? (
                <AIProgressLoader loading={generating} context="cover-letter" />
              ) : coverLetter ? (
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{coverLetter}</div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-16">
                  <FileText className="h-10 w-10 text-muted-foreground/20 mb-4" />
                  <p className="text-sm font-medium">Your cover letter will appear here</p>
                  <p className="text-xs mt-1.5 text-center max-w-xs">Fill in the details and click generate.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
