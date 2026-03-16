import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Shield, Eye, Copy, Loader2, CheckCircle2, Code, FileText, ArrowRight, Sparkles } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import JSZip from "jszip";
import { InlineTip } from "@/components/analysis/AnalysisShell";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

async function getResumeData() {
  const stored = sessionStorage.getItem("parsed_resume_data");
  if (stored) return JSON.parse(stored);
  const { data } = await supabase
    .from("saved_resumes")
    .select("resume_data")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.resume_data || null;
}

export default function ExportCenter() {
  const [latexCode, setLatexCode] = useState("");
  const [generating, setGenerating] = useState("");
  const [copied, setCopied] = useState(false);
  const [completedExports, setCompletedExports] = useState<string[]>([]);

  const handleGenerateLatex = async () => {
    const resumeData = await getResumeData();
    if (!resumeData) { toast.error("No resume data found. Save a resume first."); return; }
    setGenerating("latex");
    try {
      const { data, error } = await supabase.functions.invoke("generate-latex", { body: { resumeData } });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.latex) { setLatexCode(data.latex); setCompletedExports(p => [...p, "latex"]); toast.success("LaTeX generated!"); }
    } catch (err: any) { toast.error(err.message || "Failed to generate LaTeX"); }
    finally { setGenerating(""); }
  };

  const handleGenerateDocx = async () => {
    const resumeData = await getResumeData();
    if (!resumeData) { toast.error("No resume data found. Save a resume first."); return; }
    setGenerating("docx");
    try {
      const { data, error } = await supabase.functions.invoke("generate-docx", { body: { resumeData } });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const zip = new JSZip();
      zip.file("[Content_Types].xml", data.contentTypesXml);
      zip.folder("_rels")!.file(".rels", data.relsXml);
      const wordFolder = zip.folder("word")!;
      wordFolder.file("document.xml", data.documentXml);
      wordFolder.file("numbering.xml", data.numberingXml);
      wordFolder.folder("_rels")!.file("document.xml.rels", data.wordRelsXml);
      const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = data.fileName || "Resume.docx"; a.click();
      URL.revokeObjectURL(url);
      setCompletedExports(p => [...p, "docx"]);
      toast.success("DOCX downloaded!");
    } catch (err: any) { toast.error(err.message || "Failed to generate DOCX"); }
    finally { setGenerating(""); }
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latexCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("LaTeX copied to clipboard!");
  };

  const handleDownloadLatex = () => {
    const blob = new Blob([latexCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "resume.tex"; a.click();
    URL.revokeObjectURL(url);
  };

  const presets = [
    { title: "ATS-Safe PDF", desc: "Maximum machine readability with standard formatting", icon: Shield, type: "pdf" as const, color: "border-blue-500/20 bg-blue-500/5", iconColor: "text-blue-500 bg-blue-500/10", badge: "Most Popular" },
    { title: "DOCX (Word)", desc: "Editable Word document, ATS-friendly format", icon: FileText, type: "docx" as const, color: "border-emerald-500/20 bg-emerald-500/5", iconColor: "text-emerald-500 bg-emerald-500/10", badge: null },
    { title: "LaTeX Source", desc: "Publication-grade typographic quality", icon: Code, type: "latex" as const, color: "border-violet-500/20 bg-violet-500/5", iconColor: "text-violet-500 bg-violet-500/10", badge: null },
    { title: "Design Premium PDF", desc: "Beautiful layout with visual polish and branding", icon: Eye, type: "pdf-design" as const, color: "border-amber-500/20 bg-amber-500/5", iconColor: "text-amber-500 bg-amber-500/10", badge: null },
  ];

  return (
    <AppLayout title="Export Center" subtitle="Export your resume in multiple professional formats">
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        <motion.div {...fade(0)}>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1">Export Center</h1>
          <p className="text-sm text-muted-foreground">Choose a format and download your resume with pre-flight validation.</p>
        </motion.div>

        {/* Export presets */}
        <div className="grid sm:grid-cols-2 gap-4">
          {presets.map((preset, i) => {
            const isComplete = completedExports.includes(preset.type);
            const isGenerating = generating === preset.type;
            return (
              <motion.div key={preset.title} {...fade(i + 1)}
                className={`rounded-xl border-2 p-5 sm:p-6 transition-all relative ${preset.color} ${isComplete ? "ring-2 ring-score-excellent/20" : ""}`}
              >
                {preset.badge && (
                  <Badge className="absolute top-3 right-3 text-[9px] bg-primary/10 text-primary border-0">{preset.badge}</Badge>
                )}
                {isComplete && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="h-5 w-5 text-score-excellent" />
                  </div>
                )}
                <div className={`w-12 h-12 rounded-xl ${preset.iconColor} flex items-center justify-center mb-4`}>
                  <preset.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-sm font-bold mb-1">{preset.title}</h3>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{preset.desc}</p>
                {preset.type === "latex" ? (
                  <Button size="sm" className="gap-1.5 w-full" onClick={handleGenerateLatex} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Code className="h-3.5 w-3.5" />}
                    {isGenerating ? "Generating..." : isComplete ? "Regenerate LaTeX" : "Generate LaTeX"}
                  </Button>
                ) : preset.type === "docx" ? (
                  <Button size="sm" className="gap-1.5 w-full" onClick={handleGenerateDocx} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    {isGenerating ? "Generating..." : isComplete ? "Download Again" : "Download DOCX"}
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="gap-1.5 w-full" onClick={() => toast.info("Use the Builder's Download PDF button for this export type.")}>
                    <Download className="h-3.5 w-3.5" /> Export from Builder
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>

        <InlineTip>For PDF exports, use the Download button in the Resume Builder for the best results with your chosen template.</InlineTip>

        {/* LaTeX Output */}
        <AnimatePresence>
          {latexCode && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Generated LaTeX</h3>
                    <Badge variant="secondary" className="text-[10px]">{latexCode.split("\n").length} lines</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={handleCopyLatex}>
                      {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleDownloadLatex}>
                      <Download className="h-3.5 w-3.5" /> Download .tex
                    </Button>
                  </div>
                </div>
                <div className="p-4 max-h-[400px] overflow-auto bg-background">
                  <pre className="text-xs font-mono leading-relaxed text-foreground whitespace-pre-wrap">{latexCode}</pre>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-5">
                <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> How to compile
                </h4>
                <div className="grid sm:grid-cols-4 gap-3">
                  {[
                    { step: "1", text: "Copy or download the .tex file" },
                    { step: "2", text: "Open in Overleaf (free)" },
                    { step: "3", text: 'Click "Recompile"' },
                    { step: "4", text: "Download your PDF" },
                  ].map(s => (
                    <div key={s.step} className="flex items-start gap-2.5 p-3 rounded-lg bg-secondary/30">
                      <span className="w-6 h-6 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">{s.step}</span>
                      <p className="text-xs text-muted-foreground leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
