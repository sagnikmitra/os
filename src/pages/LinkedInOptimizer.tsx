import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Linkedin, Copy, CheckCircle2, Upload, FileText, AlertCircle, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResumeSourceSelector from "@/components/ResumeSourceSelector";
import { useResumeSource } from "@/hooks/useResumeSource";
import AIProgressLoader from "@/components/AIProgressLoader";
import { InlineTip } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export default function LinkedInOptimizer() {
  const resume = useResumeSource();
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [inputMode, setInputMode] = useState<"upload" | "paste" | "saved">("saved");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): boolean => {
    setFileError(null);
    if (file.type !== "application/pdf") { setFileError("Only PDF files are supported."); return false; }
    if (file.size > 10 * 1024 * 1024) { setFileError("File too large. Maximum size is 10MB."); return false; }
    return true;
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) setUploadedFile(file);
  }, [validateFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) setUploadedFile(file);
  }, [validateFile]);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied!");
  };

  const handleUploadAndOptimize = async () => {
    if (!uploadedFile) { toast.error("Upload a LinkedIn PDF first"); return; }
    setParsing(true); setLoading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(uploadedFile);
      });
      const { data: parseResult, error: parseError } = await supabase.functions.invoke("parse-linkedin-pdf", {
        body: { fileBase64: base64, fileName: uploadedFile.name, mimeType: "application/pdf" },
      });
      if (parseError) throw parseError;
      if (parseResult?.error) throw new Error(parseResult.error);
      setParsing(false);
      const rd = parseResult.resumeData;
      const textParts: string[] = [];
      if (rd.contact?.name) textParts.push(`Name: ${rd.contact.name}`);
      if (rd.contact?.title) textParts.push(`Title: ${rd.contact.title}`);
      if (rd.summary) textParts.push(`Summary: ${rd.summary}`);
      if (rd.experience?.length > 0) { textParts.push("Experience:"); rd.experience.forEach((exp: any) => { textParts.push(`- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate})`); exp.bullets?.forEach((b: string) => textParts.push(`  • ${b}`)); }); }
      if (rd.education?.length > 0) { textParts.push("Education:"); rd.education.forEach((edu: any) => textParts.push(`- ${edu.degree} ${edu.field} at ${edu.institution}`)); }
      if (rd.skills?.length > 0) { textParts.push("Skills:"); rd.skills.forEach((s: any) => textParts.push(`- ${s.category}: ${s.items}`)); }
      const { data: res, error } = await supabase.functions.invoke("linkedin-optimizer", { body: { resumeText: textParts.join("\n") } });
      if (error) throw error;
      setData(res);
      toast.success("LinkedIn profile optimized from PDF!");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); setParsing(false); }
  };

  const handleOptimize = async (text: string) => {
    if (!text) { toast.error("No text provided"); return; }
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("linkedin-optimizer", { body: { resumeText: text } });
      if (error) throw error;
      setData(res);
      toast.success("LinkedIn profile optimized!");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  const modes = [
    { id: "saved" as const, label: "Saved Resume", icon: FileText },
    { id: "upload" as const, label: "LinkedIn PDF", icon: Upload },
    { id: "paste" as const, label: "Paste Text", icon: FileText },
  ];

  return (
    <AppLayout title="LinkedIn Profile Optimizer" subtitle="AI-optimized headline, about, and experience sections">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {!data && !loading ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <motion.div {...fade(0)}>
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1">LinkedIn Profile Optimizer</h1>
                <p className="text-sm text-muted-foreground">Get AI-optimized headline, about section, experience bullets, and keyword recommendations.</p>
              </motion.div>

              <motion.div {...fade(1)} className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Linkedin className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Input Source</h3>
                </div>

                {/* Mode Selector */}
                <div className="flex gap-2 p-1 rounded-lg bg-secondary/50 w-fit">
                  {modes.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setInputMode(m.id); setFileError(null); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        inputMode === m.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <m.icon className="h-3 w-3" /> {m.label}
                    </button>
                  ))}
                </div>

                {inputMode === "saved" ? (
                  <div className="space-y-3">
                    <ResumeSourceSelector {...resume} sourceMode="saved" setSourceMode={() => {}} textareaRows={4} />
                    <Button className="w-full gap-2" onClick={() => handleOptimize(resume.getResumeText())} disabled={!resume.hasSavedResumes}>
                      <Linkedin className="h-4 w-4" /> Optimize for LinkedIn
                    </Button>
                  </div>
                ) : inputMode === "upload" ? (
                  <div className="space-y-3">
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleFileDrop}
                      onClick={() => fileRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                        uploadedFile ? "border-primary/50 bg-primary/5" : fileError ? "border-destructive/50 bg-destructive/5" : "border-border hover:border-primary/30 hover:bg-secondary/20"
                      }`}
                    >
                      <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
                      {uploadedFile ? (
                        <div className="space-y-1">
                          <CheckCircle2 className="h-8 w-8 mx-auto text-primary" />
                          <p className="text-sm font-medium">{uploadedFile.name}</p>
                          <p className="text-[10px] text-muted-foreground">{(uploadedFile.size / 1024).toFixed(0)} KB · Ready</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Linkedin className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-sm font-medium">Drop LinkedIn PDF here</p>
                          <p className="text-[10px] text-muted-foreground">or click to browse</p>
                        </div>
                      )}
                    </div>
                    {fileError && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                        <p className="text-xs text-destructive">{fileError}</p>
                      </div>
                    )}
                    {!uploadedFile && !fileError && (
                      <InlineTip>Go to your LinkedIn profile → Click "More" → Select "Save to PDF"</InlineTip>
                    )}
                    <Button className="w-full gap-2" onClick={handleUploadAndOptimize} disabled={!uploadedFile}>
                      <Linkedin className="h-4 w-4" /> Optimize from PDF
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Textarea placeholder="Paste your resume or LinkedIn profile text here..." value={resumeText} onChange={e => setResumeText(e.target.value)} rows={8} className="text-sm" />
                    <Button className="w-full gap-2" onClick={() => handleOptimize(resumeText)} disabled={!resumeText.trim()}>
                      <Linkedin className="h-4 w-4" /> Optimize for LinkedIn
                    </Button>
                  </div>
                )}
              </motion.div>

              <motion.div {...fade(2)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
                <Linkedin className="h-10 w-10 text-primary/40 mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">Stand Out on LinkedIn</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Get optimized headline options, a compelling About section, polished experience bullets, and strategic keywords.
                </p>
                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                  {["Headlines", "About Section", "Experience", "Keywords"].map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full border bg-secondary/50">{tag}</span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rounded-xl border bg-card p-12">
                <AIProgressLoader loading={loading} context={parsing ? "parsing" : "career"} />
              </div>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">Your Optimized LinkedIn</h2>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => { setData(null); setUploadedFile(null); }}>
                  <ArrowRight className="h-3 w-3" /> Start Over
                </Button>
              </div>

              <Tabs defaultValue="headline" className="space-y-4">
                <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
                  <TabsTrigger value="headline" className="text-xs">Headlines</TabsTrigger>
                  <TabsTrigger value="about" className="text-xs">About</TabsTrigger>
                  <TabsTrigger value="experience" className="text-xs">Experience</TabsTrigger>
                  <TabsTrigger value="keywords" className="text-xs">Keywords</TabsTrigger>
                </TabsList>

                <TabsContent value="headline" className="space-y-3">
                  {data.headlines?.map((h: string, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-4 flex items-center justify-between">
                      <p className="text-sm font-medium flex-1">{h}</p>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs shrink-0 ml-3" onClick={() => copy(h, `hl-${i}`)}>
                        {copied === `hl-${i}` ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied === `hl-${i}` ? "Copied" : "Copy"}
                      </Button>
                    </motion.div>
                  ))}
                </TabsContent>

                <TabsContent value="about" className="space-y-3">
                  <motion.div {...fade(0)} className="rounded-xl border bg-card p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">About Section</p>
                      <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={() => copy(data.about, "about")}>
                        {copied === "about" ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied === "about" ? "Copied" : "Copy"}
                      </Button>
                    </div>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{data.about}</div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="experience" className="space-y-3">
                  {data.experience?.map((exp: any, i: number) => (
                    <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{exp.title}</h4>
                        <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={() => copy(exp.description, `exp-${i}`)}>
                          {copied === `exp-${i}` ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copied === `exp-${i}` ? "Copied" : "Copy"}
                        </Button>
                      </div>
                      <div className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">{exp.description}</div>
                    </motion.div>
                  ))}
                </TabsContent>

                <TabsContent value="keywords">
                  <motion.div {...fade(0)} className="rounded-xl border bg-card p-4 sm:p-5">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Recommended Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {data.keywords?.map((k: string, i: number) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">{k}</span>
                      ))}
                    </div>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
