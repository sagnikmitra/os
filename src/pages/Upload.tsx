import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import { Upload as UploadIcon, FileText, X, ArrowRight, AlertCircle, RotateCcw, CheckCircle2, FileUp, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAnalysis } from "@/context/AnalysisContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { AnalysisProgress } from "@/components/upload/AnalysisProgress";
import { useActiveResume } from "@/context/ActiveResumeContext";
import { notifyResumesChanged } from "@/hooks/useResumeSource";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === "doc") return "application/msword";
  if (ext === "txt") return "text/plain";
  return "application/octet-stream";
}

export default function Upload() {
  const navigate = useNavigate();
  const { setAnalysis } = useAnalysis();
  const { user } = useAuth();
  const { setActiveResumeId, refreshResumes } = useActiveResume();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileReadProgress, setFileReadProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const startTimer = useCallback(() => {
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleFile = useCallback((f: File) => {
    const mime = getMimeType(f);
    if (!ACCEPTED_TYPES.includes(mime) && !f.name.match(/\.(pdf|docx?|txt)$/i)) {
      toast.error("Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error("File is too large. Maximum size is 10MB.");
      return;
    }
    setFile(f);
    setError(null);
    setRetryCount(0);
    setAnalysisComplete(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  // Single smart action: analyze + parse + save in one flow
  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setAnalysisComplete(false);
    setError(null);
    setCurrentStep(0);
    setFileReadProgress(0);
    startTimer();

    try {
      // Step 0: Reading file
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (e) => {
          if (e.lengthComputable) setFileReadProgress(Math.round((e.loaded / e.total) * 100));
        };
        reader.onload = () => {
          setFileReadProgress(100);
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const mimeType = getMimeType(file);
      setCurrentStep(1);

      // Step 1: AI analysis
      const { data, error: fnError } = await supabase.functions.invoke("analyze-resume", {
        body: { fileBase64, fileName: file.name, mimeType },
      });

      setCurrentStep(2);

      if (fnError) {
        let errorMsg = fnError.message || "Analysis failed";
        try { const parsed = JSON.parse(fnError.message); if (parsed.error) errorMsg = parsed.error; } catch {}
        throw new Error(errorMsg);
      }

      if (data?.error) throw new Error(data.error);
      if (!data?.analysis) throw new Error("No analysis results returned. Please try again.");

      setCurrentStep(3);
      setAnalysis(data.analysis, file.name);

      // Show completion and navigate immediately — don't block on parse
      await new Promise(r => setTimeout(r, 600));
      setAnalysisComplete(true);
      stopTimer();
      await new Promise(r => setTimeout(r, 1000));
      navigate("/reports");

      // Fire parse-resume in background AFTER navigation (non-blocking)
      if (user) {
        const bgFileBase64 = fileBase64;
        const bgFileName = file.name;
        const bgMimeType = mimeType;
        const bgAnalysis = data.analysis;
        setTimeout(async () => {
          try {
            const { data: parseResult } = await supabase.functions.invoke("parse-resume", {
              body: { fileBase64: bgFileBase64, fileName: bgFileName, mimeType: bgMimeType },
            });

            const rawResume = parseResult?.resumeData;
            const normalizeFieldNames = (r: any) => {
              if (!r) return null;
              return {
                contact: r.contact || r.contactInfo || r.personal_info || {},
                summary: r.summary || r.objective || r.professional_summary || "",
                experience: r.experience || r.work_experience || r.workExperience || r.employment || [],
                education: r.education || r.educations || [],
                skills: r.skills || r.technical_skills || r.technicalSkills || [],
                certifications: r.certifications || r.certificates || [],
                projects: r.projects || [],
                awards: r.awards || r.honors || [],
                languages: r.languages || [],
                volunteer: r.volunteer || r.volunteering || [],
                publications: r.publications || [],
              };
            };

            const resumeData = normalizeFieldNames(rawResume);
            const hasContent = resumeData && (
              (Array.isArray(resumeData.experience) && resumeData.experience.length > 0) ||
              (Array.isArray(resumeData.education) && resumeData.education.length > 0) ||
              (Array.isArray(resumeData.skills) && resumeData.skills.length > 0) ||
              (resumeData.summary && resumeData.summary.trim().length > 0)
            );

            if (hasContent) {
              sessionStorage.setItem("parsed_resume_data", JSON.stringify(resumeData));
              const { data: insertData, error: saveErr } = await supabase.from("saved_resumes").insert({
                user_id: user.id,
                title: bgFileName.replace(/\.[^.]+$/, ""),
                resume_data: resumeData,
                template: "classic",
                source: "upload",
              } as any).select("id").single();
              if (!saveErr && insertData?.id) {
                // Link the analysis record to this saved resume
                const analysisId = bgAnalysis?._id;
                if (analysisId) {
                  await supabase.from("resume_analyses")
                    .update({ 
                      resume_id: insertData.id,
                      resume_text: bgAnalysis?.full_raw_text || bgAnalysis?.resume_text || "" 
                    } as any)
                    .eq("id", analysisId);
                } else {
                  // Fallback: link by file_name match
                  await supabase.from("resume_analyses")
                    .update({ 
                      resume_id: insertData.id,
                      resume_text: bgAnalysis?.full_raw_text || bgAnalysis?.resume_text || ""
                    } as any)
                    .eq("file_name", bgFileName)
                    .is("resume_id", null);
                }
                await refreshResumes();
                setActiveResumeId(insertData.id);
                notifyResumesChanged();
                toast.success("Resume saved and ready for editing!");
              } else {
                console.error("Save error in background:", saveErr);
                await refreshResumes();
                notifyResumesChanged();
              }
            } else {
              const fallbackData = {
                contact: {
                  name: bgAnalysis?.extracted_info?.name || "",
                  email: bgAnalysis?.extracted_info?.email || "",
                  phone: bgAnalysis?.extracted_info?.phone || "",
                  linkedin: bgAnalysis?.extracted_info?.linkedin || "",
                  portfolio: bgAnalysis?.extracted_info?.portfolio || "",
                  location: bgAnalysis?.extracted_info?.location || "",
                  title: bgAnalysis?.extracted_info?.current_title || "",
                  photoUrl: "",
                },
                summary: "", experience: [], education: [], skills: [],
                certifications: [], projects: [], awards: [], languages: [],
                volunteer: [], publications: [],
              };
              sessionStorage.setItem("parsed_resume_data", JSON.stringify(fallbackData));
              
              // Even with fallback data, save a record so it persists
              const { data: fallbackInsert, error: fbErr } = await supabase.from("saved_resumes").insert({
                user_id: user.id,
                title: bgFileName.replace(/\.[^.]+$/, ""),
                resume_data: fallbackData,
                template: "classic",
                source: "upload-fallback",
              } as any).select("id").single();
              
              await refreshResumes();
              if (!fbErr && fallbackInsert?.id) {
                setActiveResumeId(fallbackInsert.id);
                toast.info("Resume saved with basic info (parsing was limited)");
              }
              notifyResumesChanged();
            }
          } catch (e) {
            console.error("Background resume parse/save error:", e);
          } finally {
            if (mounted.current) {
              setAnalyzing(false);
              setAnalysisComplete(true);
            }
          }
        }, 100);
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      stopTimer();
      setAnalysisComplete(false);
      setError(err.message || "Something went wrong. Please try again.");
      setAnalyzing(false);
      setRetryCount(prev => prev + 1);
    }
  };

  return (
    <AppLayout title="Upload Resume">
      <div className="page-container relative min-h-[calc(100vh-4rem)] py-8 sm:py-12 lg:py-16 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="grid gap-8 lg:grid-cols-[1fr_320px] items-start max-w-6xl mx-auto"
        >
          <div className="space-y-8 w-full">
            <div className="text-center lg:text-left space-y-2">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2"
              >
                <Sparkles className="h-3 w-3" />
                AI-Powered Analysis
              </motion.div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
                Perfect your <span className="text-primary italic">resume</span> in seconds.
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
                Upload your resume and let our advanced neural engine analyze 9+ professional dimensions to help you land your dream role.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!file ? (
                <motion.label
                  key="dropzone"
                  initial={{ opacity: 0, scale: 0.98 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.98 }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`
                    relative group flex flex-col items-center justify-center gap-6 p-12 sm:p-20 rounded-[2.5rem] border-2 border-dashed transition-all duration-500 cursor-pointer overflow-hidden
                    ${dragOver 
                      ? "border-primary bg-primary/5 shadow-[0_0_40px_-10px_rgba(var(--primary),0.2)] scale-[1.02]" 
                      : "border-border bg-card/40 backdrop-blur-xl hover:border-primary/50 hover:bg-card/60 hover:shadow-2xl hover:shadow-primary/5"}
                  `}
                >
                  {/* Subtle glass effect texture */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-indigo-500/5 opacity-50 pointer-events-none" />
                  
                  <div className="relative">
                    <div className={`
                      w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-primary flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3
                      ${dragOver ? "animate-bounce" : "shadow-primary/30"}
                    `}>
                      <FileUp className="h-10 w-10 text-primary-foreground" />
                    </div>
                    {/* Floating elements for visual interest */}
                    <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-indigo-500 blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
                    <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-primary blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                  </div>

                  <div className="text-center relative space-y-2">
                    <p className="text-xl font-bold tracking-tight">
                      {dragOver ? "Drop it here!" : "Select your resume file"}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                      Drag and drop your file or <span className="text-primary hover:underline underline-offset-4">browse locally</span>
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                        PDF
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                        DOCX
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                        TXT
                      </div>
                    </div>
                  </div>

                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  
                  {/* Progress indicator or decorative line */}
                  <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent w-full" />
                </motion.label>
              ) : (
                <motion.div 
                  key="preview" 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="rounded-[2rem] border-2 border-primary/20 bg-card/70 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl shadow-primary/5">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <FileText className="h-10 w-10 text-primary" />
                        </div>
                        <motion.div 
                          className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-lg"
                          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </motion.div>
                      </div>
                      
                      <div className="flex-1 text-center sm:text-left min-w-0 space-y-1">
                        <h3 className="text-xl font-bold truncate">{file.name}</h3>
                        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            {file.size < 1024 * 1024
                              ? `${(file.size / 1024).toFixed(0)} KB`
                              : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                            }
                          </span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span className="text-sm font-medium text-primary">
                            {file.name.split(".").pop()?.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {!analyzing && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => { setFile(null); setError(null); }} 
                          className="rounded-full hover:bg-destructive/10 hover:text-destructive group ml-auto shrink-0"
                        >
                          <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
                        </Button>
                      )}
                    </div>

                    {analyzing && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-8 border-t border-border/50 pt-8">
                        <AnalysisProgress
                          currentStep={currentStep}
                          fileReadProgress={fileReadProgress}
                          elapsedSeconds={elapsedSeconds}
                          isComplete={analysisComplete}
                        />
                      </motion.div>
                    )}

                    {error && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 rounded-2xl bg-destructive/5 border border-destructive/20 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-destructive">Wait, something went wrong</p>
                          <p className="text-xs text-destructive/80 mt-1">
                            {error}. {retryCount > 0 ? `(Attempt ${retryCount})` : "Please check your connectivity or try another file type."}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {!analyzing && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: 0.1 }}
                      className="flex flex-col gap-3"
                    >
                      <Button 
                        variant="premium" 
                        size="lg" 
                        className="w-full gap-3 h-14 text-base font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all" 
                        onClick={handleAnalyze}
                      >
                        {retryCount > 0 ? <RotateCcw className="h-5 w-5 animate-spin-reverse" /> : <Zap className="h-5 w-5 fill-current" />}
                        {retryCount > 0 ? "Retry Deep Analysis" : "Analyze & Save Resume"} 
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                      <p className="text-xs text-muted-foreground text-center font-medium">
                        Secure AI analysis • Zero data training • Instant results
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <aside className="lg:sticky lg:top-24 space-y-6">
            <div className="rounded-3xl border border-border/50 bg-card/30 backdrop-blur-xl p-6 shadow-xl shadow-black/5">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Pipeline Details
              </h2>
              
              <div className="space-y-5">
                {[
                  { title: "Secured Processing", desc: "Encryption for all file reads." },
                  { title: "AI Dimension Scoring", desc: "ATS, structure, and readability." },
                  { title: "Smart Field Extraction", desc: "Auto-prefills your profile." },
                  { title: "Neural Synchronization", desc: "Links analysis to active resume." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-black text-primary">{i + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-2xl bg-secondary/50 border border-border/50 space-y-3">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-tighter text-muted-foreground/60">
                  <Zap className="h-3 w-3" />
                  Instant Access
                </div>
                <ul className="space-y-2">
                  {[
                    "Interactive ATS Report",
                    "Editable AI-Parsed Draft",
                    "Resume Portfolio Entry"
                  ].map((text, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-primary/10 p-5 border border-primary/10">
              <p className="text-xs font-bold text-foreground">Pro Tip</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Use high-contrast PDF files for the most accurate AI extraction results.
              </p>
            </div>
          </aside>
        </motion.div>
      </div>
    </AppLayout>
  );
}
