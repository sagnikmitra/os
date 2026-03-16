import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ResumeData, defaultResume, TemplateName } from "@/types/resume";
import { ResumeForm } from "@/components/builder/ResumeForm";
import { ResumePreview } from "@/components/builder/ResumePreview";
import { LiveScoring } from "@/components/builder/LiveScoring";
import { AnalysisFixDimension, AnalysisFixFocus, ResumeReadinessPanel } from "@/components/builder/ResumeReadinessPanel";
import { TemplatePickerDialog } from "@/components/builder/TemplatePickerDialog";
import { KeyboardShortcutsDialog } from "@/components/builder/KeyboardShortcutsDialog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download, PenLine, Eye, Columns2, Save, Wand2, Loader2,
  Sparkles, ChevronRight, LayoutGrid,
  Undo2, Redo2, ZoomIn, ZoomOut, Check, Keyboard, FileDown, Copy, MoreHorizontal, BarChart3,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAnalysis } from "@/context/AnalysisContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { notifyResumesChanged } from "@/hooks/useResumeSource";
import { runResumeAudit, TEMPLATE_META } from "@/lib/resume-audit";
import "@/styles/print.css";

type EditorMode = "edit" | "preview" | "split";

interface SavedResumeOption {
  id: string;
  title: string;
  resume_data: any;
  template: string;
  updated_at: string;
}

const MAX_UNDO = 30;
const MAX_EXPORT_BYTES = 2 * 1024 * 1024;

export default function ResumeBuilder() {
  const isMobile = useIsMobile();
  const [data, setData] = useState<ResumeData>(defaultResume);
  const [template, setTemplate] = useState<TemplateName>("modern");
  const [exporting, setExporting] = useState(false);
  const [mode, setMode] = useState<EditorMode>(isMobile ? "edit" : "split");
  const [showScoring, setShowScoring] = useState(!isMobile);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const exportRenderRef = useRef<HTMLDivElement>(null);
  const [renderExportMirror, setRenderExportMirror] = useState(false);
  const { analysis, setAnalysis } = useAnalysis();
  const { user } = useAuth();
  const hasAnalysisFixes = !!(
    analysis?.improvement_roadmap ||
    analysis?.ats_analysis ||
    analysis?.parsing_analysis ||
    analysis?.recruiter_analysis ||
    analysis?.content_analysis ||
    analysis?.structure_analysis ||
    analysis?.humanizer_analysis
  );

  const [savedResumes, setSavedResumes] = useState<SavedResumeOption[]>([]);
  const [activeResumeId, setActiveResumeId] = useState<string>(() => sessionStorage.getItem("activeResumeId") || "new");

  // Undo/Redo
  const [undoStack, setUndoStack] = useState<ResumeData[]>([]);
  const [redoStack, setRedoStack] = useState<ResumeData[]>([]);
  const lastDataRef = useRef<string>(JSON.stringify(defaultResume));

  // Auto-save
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Zoom
  const [zoomLevel, setZoomLevel] = useState(100);

  // Track data changes for undo
  const setDataWithUndo = useCallback((updater: React.SetStateAction<ResumeData>) => {
    setData(prev => {
      const currentJson = JSON.stringify(prev);
      if (currentJson !== lastDataRef.current) {
        setUndoStack(stack => [...stack.slice(-MAX_UNDO), prev]);
        setRedoStack([]);
        lastDataRef.current = currentJson;
      }
      const next = typeof updater === "function" ? updater(prev) : updater;
      setHasUnsavedChanges(true);
      return next;
    });
  }, []);

  const handleUndo = useCallback(() => {
    setUndoStack(stack => {
      if (stack.length === 0) return stack;
      const prev = stack[stack.length - 1];
      setRedoStack(rs => [...rs, data]);
      setData(prev);
      lastDataRef.current = JSON.stringify(prev);
      return stack.slice(0, -1);
    });
  }, [data]);

  const handleRedo = useCallback(() => {
    setRedoStack(stack => {
      if (stack.length === 0) return stack;
      const next = stack[stack.length - 1];
      setUndoStack(us => [...us, data]);
      setData(next);
      lastDataRef.current = JSON.stringify(next);
      return stack.slice(0, -1);
    });
  }, [data]);

  useEffect(() => {
    if (isMobile && mode === "split") setMode("edit");
  }, [isMobile, mode]);

  useEffect(() => {
    if (isMobile) setShowScoring(false);
  }, [isMobile]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: resumes, error } = await supabase
        .from("saved_resumes")
        .select("id, title, resume_data, template, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (!error && resumes) {
        setSavedResumes(resumes as any);
        const sessionData = sessionStorage.getItem("parsed_resume_data");
        if (sessionData) {
          try {
            const parsed = JSON.parse(sessionData);
            setData(normalizeResumeData(parsed));
            sessionStorage.removeItem("parsed_resume_data");
          } catch {}
        } else if (resumes.length > 0) {
          const selected = (resumes as any[]).find((r: any) => r.id === activeResumeId);
          const withContent = (resumes as any[]).find((r: any) => {
            const rd = r.resume_data;
            return (Array.isArray(rd?.experience) && rd.experience.length > 0) ||
                   (Array.isArray(rd?.education) && rd.education.length > 0) ||
                   (Array.isArray(rd?.skills) && rd.skills.length > 0) ||
                   (rd?.summary && rd.summary.trim().length > 0);
          });
          const preferred = selected || withContent;
          if (preferred) {
            setActiveResumeId(preferred.id);
            setData(normalizeResumeData(preferred.resume_data));
            setTemplate((preferred.template || "modern") as TemplateName);
          }
        }
      }
    })();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save (debounced 30s after last change)
  useEffect(() => {
    if (!user || activeResumeId === "new" || !hasUnsavedChanges) return;
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const timer = setTimeout(async () => {
      const title = data.contact.name ? `${data.contact.name} Resume` : "Untitled Resume";
      const { error } = await supabase.from("saved_resumes").update({
        title, resume_data: data as any, template, updated_at: new Date().toISOString(),
      } as any).eq("id", activeResumeId);
      if (!error) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    }, 30000);
    setAutoSaveTimer(timer);
    return () => clearTimeout(timer);
  }, [data, template, user, activeResumeId, hasUnsavedChanges]);

  const normalizeResumeData = useCallback((raw: any): ResumeData => {
    const uid = () => crypto.randomUUID();
    const ensureIds = <T extends { id?: string }>(arr: any[], fallback: () => T): T[] =>
      Array.isArray(arr) ? arr.map(item => ({ ...fallback(), ...item, id: item.id || uid() })) : [];

    const contact = raw?.contact || raw?.contactInfo || raw?.personal_info || {};
    const expArr = raw?.experience || raw?.work_experience || raw?.workExperience || raw?.employment || [];
    const eduArr = raw?.education || raw?.educations || [];
    const skillsArr = raw?.skills || raw?.technical_skills || raw?.technicalSkills || [];
    const certsArr = raw?.certifications || raw?.certificates || [];
    const projArr = raw?.projects || [];
    const awardsArr = raw?.awards || raw?.honors || [];
    const langsArr = raw?.languages || [];
    const volArr = raw?.volunteer || raw?.volunteering || [];
    const pubsArr = raw?.publications || [];
    const summary = raw?.summary || raw?.objective || raw?.professional_summary || "";

    return {
      contact: {
        name: contact?.name || contact?.full_name || contact?.fullName || "",
        email: contact?.email || contact?.email_address || "",
        phone: contact?.phone || contact?.phone_number || contact?.mobile || "",
        linkedin: contact?.linkedin || contact?.linkedin_url || contact?.linkedIn || "",
        portfolio: contact?.portfolio || contact?.website || contact?.portfolio_url || "",
        location: contact?.location || contact?.address || contact?.city || "",
        title: contact?.title || contact?.job_title || contact?.current_title || contact?.designation || "",
        photoUrl: contact?.photoUrl || contact?.photo_url || contact?.avatar || contact?.image || "",
      },
      summary,
      experience: ensureIds(expArr, () => ({ id: "", company: "", title: "", location: "", startDate: "", endDate: "", current: false, bullets: [""] }))
        .map((e: any) => ({
          id: e.id,
          company: e.company || "",
          title: e.title || "",
          location: e.location || "",
          url: e.url || e.link || e.company_url || e.website || "",
          startDate: e.startDate || e.start_date || e.from || "",
          endDate: e.endDate || e.end_date || e.to || "",
          current: e.current || false,
          bullets: Array.isArray(e.bullets) && e.bullets.length > 0 ? e.bullets
            : Array.isArray(e.responsibilities) && e.responsibilities.length > 0 ? e.responsibilities
            : Array.isArray(e.description) ? e.description
            : typeof e.description === "string" && e.description ? [e.description]
            : [""],
        })),
      education: ensureIds(eduArr, () => ({ id: "", institution: "", degree: "", field: "", startDate: "", endDate: "", gpa: "", honors: "" }))
        .map((e: any) => ({
          id: e.id,
          institution: e.institution || e.school || e.university || e.college || "",
          degree: e.degree || "",
          field: e.field || e.major || e.field_of_study || "",
          url: e.url || e.link || e.verification_url || "",
          startDate: e.startDate || e.start_date || e.from || "",
          endDate: e.endDate || e.end_date || e.to || "",
          gpa: e.gpa || "",
          honors: e.honors || "",
        })),
      skills: ensureIds(skillsArr, () => ({ id: "", category: "", items: "" }))
        .map((s: any) => ({
          id: s.id,
          category: s.category || "",
          items: typeof s.items === "string" ? s.items
            : Array.isArray(s.items) ? s.items.join(", ")
            : Array.isArray(s.skills) ? s.skills.join(", ")
            : "",
        })),
      certifications: ensureIds(certsArr, () => ({ id: "", name: "", issuer: "", date: "" }))
        .map((c: any) => ({
          ...c,
          url: c.url || c.link || c.credential_url || "",
        })),
      projects: ensureIds(projArr, () => ({ id: "", name: "", description: "", url: "", technologies: "", bullets: [""] }))
        .map((p: any) => ({
          id: p.id,
          name: p.name || "",
          description: p.description || "",
          url: p.url || p.link || p.github_url || p.project_url || "",
          technologies: typeof p.technologies === "string" ? p.technologies
            : Array.isArray(p.technologies) ? p.technologies.join(", ")
            : p.tech_stack || "",
          bullets: Array.isArray(p.bullets) && p.bullets.length > 0 ? p.bullets : [""],
        })),
      awards: ensureIds(awardsArr, () => ({ id: "", title: "", issuer: "", date: "", description: "" }))
        .map((a: any) => ({
          ...a,
          url: a.url || a.link || "",
        })),
      languages: ensureIds(langsArr, () => ({ id: "", language: "", proficiency: "" })),
      volunteer: ensureIds(volArr, () => ({ id: "", organization: "", role: "", startDate: "", endDate: "", description: "" }))
        .map((v: any) => ({
          ...v,
          url: v.url || v.link || v.organization_url || "",
        })),
      publications: ensureIds(pubsArr, () => ({ id: "", title: "", publisher: "", date: "", url: "" }))
        .map((p: any) => ({
          ...p,
          url: p.url || p.link || p.doi_url || "",
        })),
    };
  }, []);

  const handleResumeSwitch = (id: string) => {
    if (id === "new") {
      setActiveResumeId("new");
      setData(defaultResume);
      setTemplate("modern");
      setUndoStack([]);
      setRedoStack([]);
      return;
    }
    const found = savedResumes.find(r => r.id === id);
    if (found) {
      setActiveResumeId(id);
      setData(normalizeResumeData(found.resume_data));
      setTemplate((found.template || "modern") as TemplateName);
      setUndoStack([]);
      setRedoStack([]);
    }
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== "activeResumeId" || !e.newValue) return;
      handleResumeSwitch(e.newValue);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [savedResumes]); // eslint-disable-line react-hooks/exhaustive-deps

  const waitForResumePages = async (
    getRoot: () => HTMLDivElement | null,
    timeoutMs = 3500
  ): Promise<HTMLElement[]> => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const root = getRoot();
      const pages = root ? Array.from(root.querySelectorAll<HTMLElement>('[data-resume-page="true"]')) : [];
      if (pages.length > 0) return pages;
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    return [];
  };

  const normalizeExportHref = (rawHref: string): string | null => {
    const href = rawHref.trim();
    if (!href) return null;
    if (/^mailto:/i.test(href) || /^tel:/i.test(href) || /^https?:\/\//i.test(href)) return href;
    if (/^www\./i.test(href)) return `https://${href}`;
    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(href)) return `https://${href}`;
    return null;
  };

  const handleExportPDF = async () => {
    if (audit.blockers.length > 0) {
      toast.warning("Resume has critical ATS/parser issues. Exporting anyway, but fixing blockers is recommended.");
    }

    setExporting(true);
    setRenderExportMirror(true);

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

      let sourcePages = await waitForResumePages(() => exportRenderRef.current);
      if (sourcePages.length === 0) {
        sourcePages = await waitForResumePages(() => previewRef.current, 900);
      }
      if (sourcePages.length === 0) {
        throw new Error("Preview pages are not ready for export. Please retry.");
      }

      const { default: JsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");
      const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      for (let index = 0; index < sourcePages.length; index += 1) {
        const pageElement = sourcePages[index];
        const pageRect = pageElement.getBoundingClientRect();
        const canvas = await html2canvas(pageElement, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          imageTimeout: 0,
          windowWidth: Math.max(794, Math.ceil(pageRect.width)),
          windowHeight: Math.max(1123, Math.ceil(pageRect.height)),
        });

        const imageData = canvas.toDataURL("image/jpeg", 0.92);
        if (index > 0) doc.addPage();
        doc.addImage(imageData, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "MEDIUM");

        const anchors = Array.from(pageElement.querySelectorAll<HTMLAnchorElement>("a[href]"));
        for (const anchor of anchors) {
          const href = normalizeExportHref(anchor.getAttribute("href") || "");
          if (!href) continue;

          const rects = Array.from(anchor.getClientRects()).filter((r) => r.width > 0.5 && r.height > 0.5);
          for (const rect of rects) {
            const x = ((rect.left - pageRect.left) / pageRect.width) * pageWidth;
            const y = ((rect.top - pageRect.top) / pageRect.height) * pageHeight;
            const w = (rect.width / pageRect.width) * pageWidth;
            const h = (rect.height / pageRect.height) * pageHeight;
            doc.link(Math.max(0, x), Math.max(0, y), Math.max(1, w), Math.max(1, h), { url: href });
          }
        }
      }

      const blob = doc.output("blob") as Blob;
      const sizeMb = blob.size / (1024 * 1024);
      const safeName = (data.contact.name || "resume").replace(/[^a-z0-9_-]+/gi, "_");
      doc.save(`${safeName}_ats.pdf`);

      if (blob.size <= MAX_EXPORT_BYTES) {
        toast.success(`Preview-matched PDF exported (${sizeMb.toFixed(2)} MB) with clickable links.`);
      } else {
        toast.warning(`Preview-matched PDF exported (${sizeMb.toFixed(2)} MB). Consider reducing content for <2 MB.`);
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Export failed";
      toast.error(message);
    } finally {
      setRenderExportMirror(false);
      setExporting(false);
    }
  };

  const handleSave = async () => {
    if (!user) { toast.error("Please sign in to save"); return; }
    const title = data.contact.name ? `${data.contact.name} Resume` : "Untitled Resume";

    if (activeResumeId !== "new") {
      const { error } = await supabase.from("saved_resumes").update({
        title, resume_data: data as any, template, updated_at: new Date().toISOString(),
      } as any).eq("id", activeResumeId);
      if (error) { toast.error("Failed to save"); return; }
      toast.success("Resume updated!");
    } else {
      const { data: inserted, error } = await supabase.from("saved_resumes").insert({
        title, resume_data: data as any, template, source: "builder", user_id: user.id,
      } as any).select("id").single();
      if (error) { toast.error("Failed to save"); return; }
      if (inserted) setActiveResumeId((inserted as any).id);
      toast.success("Resume saved!");
    }

    setLastSaved(new Date());
    setHasUnsavedChanges(false);

    const { data: resumes } = await supabase
      .from("saved_resumes")
      .select("id, title, resume_data, template, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (resumes) setSavedResumes(resumes as any);
    notifyResumesChanged();
  };

  const [bulkRewriting, setBulkRewriting] = useState(false);
  const [applyingFixes, setApplyingFixes] = useState(false);
  const [applyingFixArea, setApplyingFixArea] = useState<AnalysisFixFocus | null>(null);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [mobileQualityOpen, setMobileQualityOpen] = useState(false);

  const normalizeFocusArea = (value: unknown): AnalysisFixFocus => {
    if (
      value === "all" ||
      value === "ats" ||
      value === "parsing" ||
      value === "content" ||
      value === "recruiter" ||
      value === "structure" ||
      value === "ai-detection"
    ) {
      return value;
    }
    return "all";
  };

  const trimTextForFixes = useCallback((value: unknown, max = 220) => {
    if (typeof value !== "string") return "";
    return value.replace(/\s+/g, " ").trim().slice(0, max);
  }, []);

  const trimStringArrayForFixes = useCallback((value: unknown, limit = 8, itemMax = 120) => {
    if (!Array.isArray(value)) return [] as string[];
    return value
      .map((item) => trimTextForFixes(item, itemMax))
      .filter(Boolean)
      .slice(0, limit);
  }, [trimTextForFixes]);

  const sanitizeUrlForFixes = useCallback((value: unknown) => {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^data:/i.test(trimmed)) return "";
    return trimmed.slice(0, 2048);
  }, []);

  const sanitizeResumeForFixes = useCallback((resume: ResumeData): ResumeData => {
    const cloned: ResumeData = JSON.parse(JSON.stringify(resume));
    cloned.contact.photoUrl = "";
    cloned.contact.linkedin = sanitizeUrlForFixes(cloned.contact.linkedin);
    cloned.contact.portfolio = sanitizeUrlForFixes(cloned.contact.portfolio);

    cloned.experience = cloned.experience.map((entry) => ({
      ...entry,
      url: sanitizeUrlForFixes(entry.url || ""),
    }));
    cloned.education = cloned.education.map((entry) => ({
      ...entry,
      url: sanitizeUrlForFixes(entry.url || ""),
    }));
    cloned.projects = cloned.projects.map((project) => ({
      ...project,
      url: sanitizeUrlForFixes(project.url || ""),
    }));
    cloned.certifications = cloned.certifications.map((entry) => ({
      ...entry,
      url: sanitizeUrlForFixes(entry.url || ""),
    }));
    cloned.awards = cloned.awards.map((entry) => ({
      ...entry,
      url: sanitizeUrlForFixes(entry.url || ""),
    }));
    cloned.volunteer = cloned.volunteer.map((entry) => ({
      ...entry,
      url: sanitizeUrlForFixes(entry.url || ""),
    }));
    cloned.publications = cloned.publications.map((entry) => ({
      ...entry,
      url: sanitizeUrlForFixes(entry.url || ""),
    }));

    return cloned;
  }, [sanitizeUrlForFixes]);

  const buildFixPayload = useCallback((
    focusArea: AnalysisFixFocus,
    analysisData: any,
    resume: ResumeData,
    lean = false,
  ) => {
    const include = (area: Exclude<AnalysisFixFocus, "all">) => focusArea === "all" || focusArea === area;
    const scores = analysisData?.scores || {};
    const roadmap = analysisData?.improvement_roadmap || {};
    const ats = analysisData?.ats_analysis || {};
    const parsing = analysisData?.parsing_analysis || {};
    const recruiter = analysisData?.recruiter_analysis || {};
    const content = analysisData?.content_analysis || {};
    const structure = analysisData?.structure_analysis || {};
    const humanizer = analysisData?.humanizer_analysis || {};

    return {
      resumeData: sanitizeResumeForFixes(resume),
      focusArea,
      scores: {
        ats: { score: typeof scores?.ats?.score === "number" ? scores.ats.score : undefined },
        parsing: { score: typeof scores?.parsing?.score === "number" ? scores.parsing.score : undefined },
        recruiter_readability: { score: typeof scores?.recruiter_readability?.score === "number" ? scores.recruiter_readability.score : undefined },
        content_quality: { score: typeof scores?.content_quality?.score === "number" ? scores.content_quality.score : undefined },
        structure: { score: typeof scores?.structure?.score === "number" ? scores.structure.score : undefined },
        human_authenticity: { score: typeof scores?.human_authenticity?.score === "number" ? scores.human_authenticity.score : undefined },
      },
      improvementRoadmap: {
        immediate_fixes: (Array.isArray(roadmap?.immediate_fixes) ? roadmap.immediate_fixes : []).slice(0, lean ? 4 : 8).map((item: any) => ({
          action: trimTextForFixes(item?.action, 120),
          current: trimTextForFixes(item?.current, 160),
          improved: trimTextForFixes(item?.improved, 180),
          impact: trimTextForFixes(item?.impact, 40),
        })),
        short_term_improvements: !lean
          ? (Array.isArray(roadmap?.short_term_improvements) ? roadmap.short_term_improvements : []).slice(0, 6).map((item: any) => ({
              action: trimTextForFixes(item?.action, 120),
              rationale: trimTextForFixes(item?.rationale, 160),
              impact: trimTextForFixes(item?.impact, 40),
            }))
          : [],
        section_by_section_rewrites: !lean
          ? (Array.isArray(roadmap?.section_by_section_rewrites) ? roadmap.section_by_section_rewrites : []).slice(0, 6).map((item: any) => ({
              section: trimTextForFixes(item?.section, 50),
              current_grade: trimTextForFixes(item?.current_grade, 8),
              issues: trimStringArrayForFixes(item?.issues, 4, 90),
              rewrite_suggestions: trimStringArrayForFixes(item?.rewrite_suggestions, 4, 110),
            }))
          : [],
      },
      atsAnalysis: include("ats")
        ? {
            pass_likelihood: trimTextForFixes(ats?.pass_likelihood, 32),
            missing_keywords: trimStringArrayForFixes(ats?.missing_keywords, lean ? 10 : 16, 40),
            formatting_issues: trimStringArrayForFixes(ats?.formatting_issues, lean ? 6 : 10, 100),
            checks: (Array.isArray(ats?.checks) ? ats.checks : []).slice(0, lean ? 8 : 14).map((check: any) => ({
              label: trimTextForFixes(check?.label, 60),
              status: trimTextForFixes(check?.status, 16),
              detail: trimTextForFixes(check?.detail, 140),
            })),
          }
        : null,
      parsingAnalysis: include("parsing")
        ? {
            overall_extractability: trimTextForFixes(parsing?.overall_extractability, 32),
            fields: (Array.isArray(parsing?.fields) ? parsing.fields : []).slice(0, lean ? 8 : 12).map((field: any) => ({
              field: trimTextForFixes(field?.field, 48),
              status: trimTextForFixes(field?.status, 16),
              note: trimTextForFixes(field?.note, 140),
            })),
            date_consistency: {
              consistent: !!parsing?.date_consistency?.consistent,
              issues: trimStringArrayForFixes(parsing?.date_consistency?.issues, 4, 90),
            },
          }
        : null,
      recruiterAnalysis: include("recruiter")
        ? {
            first_impression: trimTextForFixes(recruiter?.first_impression, lean ? 180 : 280),
            six_second_scan: {
              immediate_verdict: trimTextForFixes(recruiter?.six_second_scan?.immediate_verdict, 140),
            },
            missed: trimStringArrayForFixes(recruiter?.missed, lean ? 4 : 6, 90),
            issues: (Array.isArray(recruiter?.issues) ? recruiter.issues : []).slice(0, lean ? 6 : 10).map((issue: any) => ({
              issue: trimTextForFixes(issue?.issue, 140),
              fix: trimTextForFixes(issue?.fix, 140),
            })),
          }
        : null,
      contentAnalysis: include("content")
        ? {
            bullets: (Array.isArray(content?.bullets) ? content.bullets : []).slice(0, lean ? 10 : 16).map((bullet: any) => ({
              text: trimTextForFixes(bullet?.text, 170),
              strength: trimTextForFixes(bullet?.strength, 16),
              issue: trimTextForFixes(bullet?.issue, 140),
              fix: trimTextForFixes(bullet?.fix, 170),
            })),
          }
        : null,
      structureAnalysis: include("structure")
        ? {
            missing_sections: trimStringArrayForFixes(structure?.missing_sections, 10, 60),
            section_order_issues: trimStringArrayForFixes(structure?.section_order_issues, 10, 120),
          }
        : null,
      humanizerAnalysis: include("ai-detection")
        ? {
            verdict: trimTextForFixes(humanizer?.verdict, 50),
            ai_probability: typeof humanizer?.ai_probability === "number" ? humanizer.ai_probability : null,
            flags: trimStringArrayForFixes(humanizer?.flags, 8, 100),
            detections: (Array.isArray(humanizer?.detections) ? humanizer.detections : []).slice(0, lean ? 4 : 8).map((detection: any) => ({
              original: trimTextForFixes(detection?.original, 140),
              issue: trimTextForFixes(detection?.issue, 120),
              humanized: trimTextForFixes(detection?.humanized, 160),
            })),
          }
        : null,
    };
  }, [sanitizeResumeForFixes, trimStringArrayForFixes, trimTextForFixes]);

  const mergeResumeData = useCallback((current: ResumeData, improved: Partial<ResumeData>): ResumeData => {
    return {
      ...current,
      ...improved,
      contact: {
        ...current.contact,
        ...(improved.contact || {}),
        // Never lose a locally uploaded profile photo due to AI fix responses.
        photoUrl: current.contact.photoUrl || (improved.contact?.photoUrl ?? ""),
      },
      experience: Array.isArray(improved.experience) ? improved.experience : current.experience,
      education: Array.isArray(improved.education) ? improved.education : current.education,
      skills: Array.isArray(improved.skills) ? improved.skills : current.skills,
      certifications: Array.isArray(improved.certifications) ? improved.certifications : current.certifications,
      projects: Array.isArray(improved.projects) ? improved.projects : current.projects,
      awards: Array.isArray(improved.awards) ? improved.awards : current.awards,
      languages: Array.isArray(improved.languages) ? improved.languages : current.languages,
      volunteer: Array.isArray(improved.volunteer) ? improved.volunteer : current.volunteer,
      publications: Array.isArray(improved.publications) ? improved.publications : current.publications,
      summary: typeof improved.summary === "string" ? improved.summary : current.summary,
    };
  }, []);

  const buildResumeTextForAnalysis = useCallback((resume: ResumeData): string => {
    const lines: string[] = [];
    const pushSection = (title: string, content: string[]) => {
      const filtered = content.map((item) => item.trim()).filter(Boolean);
      if (filtered.length === 0) return;
      lines.push("", title.toUpperCase(), ...filtered);
    };

    const { contact } = resume;
    if (contact.name.trim()) lines.push(contact.name.trim());
    if (contact.title.trim()) lines.push(contact.title.trim());

    const contactLine = [
      contact.email,
      contact.phone,
      contact.location,
      contact.linkedin,
      contact.portfolio,
    ]
      .map((v) => v.trim())
      .filter(Boolean)
      .join(" | ");
    if (contactLine) lines.push(contactLine);

    if (resume.summary.trim()) {
      pushSection("Summary", [resume.summary]);
    }

    if (resume.experience.length > 0) {
      const experienceLines: string[] = [];
      resume.experience.forEach((entry) => {
        const heading = [entry.title.trim(), entry.company.trim()].filter(Boolean).join(" — ");
        if (heading) experienceLines.push(heading);
        const meta = [entry.location.trim(), [entry.startDate.trim(), entry.endDate.trim()].filter(Boolean).join(" - ")]
          .filter(Boolean)
          .join(" | ");
        if (meta) experienceLines.push(meta);
        if (entry.url?.trim()) experienceLines.push(entry.url.trim());
        entry.bullets
          .map((bullet) => bullet.trim())
          .filter(Boolean)
          .forEach((bullet) => experienceLines.push(`- ${bullet}`));
        experienceLines.push("");
      });
      pushSection("Experience", experienceLines);
    }

    if (resume.education.length > 0) {
      const educationLines: string[] = [];
      resume.education.forEach((entry) => {
        const heading = [entry.degree.trim(), entry.field.trim()].filter(Boolean).join(", ");
        if (heading) educationLines.push(heading);
        const subheading = [entry.institution.trim(), [entry.startDate.trim(), entry.endDate.trim()].filter(Boolean).join(" - ")]
          .filter(Boolean)
          .join(" | ");
        if (subheading) educationLines.push(subheading);
        if (entry.gpa.trim()) educationLines.push(`GPA: ${entry.gpa.trim()}`);
        if (entry.honors.trim()) educationLines.push(`Honors: ${entry.honors.trim()}`);
        if (entry.url?.trim()) educationLines.push(entry.url.trim());
        educationLines.push("");
      });
      pushSection("Education", educationLines);
    }

    if (resume.skills.length > 0) {
      const skillLines = resume.skills
        .map((skill) => `${skill.category.trim()}: ${skill.items.trim()}`)
        .filter((line) => line !== ":" && line.trim() !== "");
      pushSection("Skills", skillLines);
    }

    if (resume.projects.length > 0) {
      const projectLines: string[] = [];
      resume.projects.forEach((project) => {
        if (project.name.trim()) projectLines.push(project.name.trim());
        if (project.description.trim()) projectLines.push(project.description.trim());
        if (project.technologies.trim()) projectLines.push(`Technologies: ${project.technologies.trim()}`);
        if (project.url.trim()) projectLines.push(project.url.trim());
        project.bullets
          .map((bullet) => bullet.trim())
          .filter(Boolean)
          .forEach((bullet) => projectLines.push(`- ${bullet}`));
        projectLines.push("");
      });
      pushSection("Projects", projectLines);
    }

    if (resume.certifications.length > 0) {
      const certLines = resume.certifications.flatMap((cert) => {
        const line = [cert.name.trim(), cert.issuer.trim(), cert.date.trim()].filter(Boolean).join(" | ");
        return [line, cert.url?.trim() || "", ""];
      });
      pushSection("Certifications", certLines);
    }

    if (resume.awards.length > 0) {
      const awardLines = resume.awards.flatMap((award) => {
        const line = [award.title.trim(), award.issuer.trim(), award.date.trim()].filter(Boolean).join(" | ");
        return [line, award.description.trim(), award.url?.trim() || "", ""];
      });
      pushSection("Awards", awardLines);
    }

    if (resume.languages.length > 0) {
      const languageLines = resume.languages
        .map((language) => [language.language.trim(), language.proficiency.trim()].filter(Boolean).join(" — "))
        .filter(Boolean);
      pushSection("Languages", languageLines);
    }

    if (resume.volunteer.length > 0) {
      const volunteerLines = resume.volunteer.flatMap((entry) => {
        const heading = [entry.role.trim(), entry.organization.trim()].filter(Boolean).join(" — ");
        const meta = [[entry.startDate.trim(), entry.endDate.trim()].filter(Boolean).join(" - "), entry.url?.trim() || ""]
          .filter(Boolean)
          .join(" | ");
        return [heading, meta, entry.description.trim(), ""];
      });
      pushSection("Volunteer", volunteerLines);
    }

    if (resume.publications.length > 0) {
      const publicationLines = resume.publications.flatMap((entry) => {
        const heading = [entry.title.trim(), entry.publisher.trim(), entry.date.trim()].filter(Boolean).join(" | ");
        return [heading, entry.url.trim(), ""];
      });
      pushSection("Publications", publicationLines);
    }

    return lines.map((line) => line.trimEnd()).join("\n").trim();
  }, []);

  const getAnalysisFileName = useCallback((resume: ResumeData) => {
    const activeTitle = savedResumes.find((r) => r.id === activeResumeId)?.title?.trim();
    const fallbackTitle = resume.contact.name.trim() ? `${resume.contact.name.trim()} Resume` : "Resume Builder";
    const baseTitle = activeTitle || fallbackTitle;
    return /\.(pdf|docx?|txt)$/i.test(baseTitle) ? baseTitle : `${baseTitle}.txt`;
  }, [activeResumeId, savedResumes]);

  const getInvokeErrorStatus = useCallback((error: unknown): number | null => {
    if (!error || typeof error !== "object") return null;
    const errObj = error as Record<string, unknown>;
    const directStatus = Number(errObj.status);
    if (Number.isFinite(directStatus) && directStatus > 0) return directStatus;
    const context = errObj.context as { status?: number } | undefined;
    const contextStatus = Number(context?.status);
    if (Number.isFinite(contextStatus) && contextStatus > 0) return contextStatus;
    return null;
  }, []);

  const getInvokeErrorMessage = useCallback(async (error: unknown, fallback = "Request failed.") => {
    const generic =
      error instanceof Error && error.message
        ? error.message
        : (typeof error === "string" ? error : fallback);

    if (!error || typeof error !== "object") {
      return generic;
    }

    const errObj = error as Record<string, unknown>;
    const context = errObj.context as { clone?: () => any; json?: () => Promise<unknown>; text?: () => Promise<string>; status?: number } | undefined;
    const extractBodyMessage = (payload: unknown): string => {
      if (!payload || typeof payload !== "object") return "";
      const body = payload as Record<string, unknown>;
      if (typeof body.error === "string" && body.error.trim()) return body.error.trim();
      if (typeof body.message === "string" && body.message.trim()) return body.message.trim();
      return "";
    };

    if (context) {
      try {
        const jsonSource = typeof context.clone === "function" ? context.clone() : context;
        if (typeof jsonSource?.json === "function") {
          const payload = await jsonSource.json();
          const bodyMessage = extractBodyMessage(payload);
          if (bodyMessage) return bodyMessage;
        }
      } catch {
        // Ignore and fallback to text body parsing.
      }

      try {
        const textSource = typeof context.clone === "function" ? context.clone() : context;
        if (typeof textSource?.text === "function") {
          const rawText = (await textSource.text())?.trim();
          if (rawText) {
            try {
              const parsed = JSON.parse(rawText);
              const parsedMessage = extractBodyMessage(parsed);
              if (parsedMessage) return parsedMessage;
            } catch {
              return rawText.replace(/\s+/g, " ").trim().slice(0, 240);
            }
          }
        }
      } catch {
        // Ignore context parse failures.
      }
    }

    const status = getInvokeErrorStatus(error);
    if (status === 413 || status === 414 || status === 431) {
      return "Fix request was too large for the server. Retrying with compact payload is required.";
    }
    if (status === 404) {
      return "Fix service endpoint was not found. Please redeploy edge functions and retry.";
    }
    if (status === 504) {
      return "Fix request timed out. Please retry or apply one focus area at a time.";
    }
    if (/non-2xx status code/i.test(generic)) {
      return "Apply fixes failed due to a server error. Please retry, or apply one focus area at a time.";
    }
    return generic || fallback;
  }, [getInvokeErrorStatus]);

  const parseServerErrorBody = useCallback((rawText: string) => {
    const trimmed = (rawText || "").trim();
    if (!trimmed) return "";
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed?.error === "string" && parsed.error.trim()) return parsed.error.trim();
      if (typeof parsed?.message === "string" && parsed.message.trim()) return parsed.message.trim();
      if (typeof parsed?.error?.message === "string" && parsed.error.message.trim()) return parsed.error.message.trim();
    } catch {
      // Fallback below.
    }
    return trimmed.replace(/\s+/g, " ").trim().slice(0, 260);
  }, []);

  const invokeApplyFixesWithFallback = useCallback(async (payload: unknown) => {
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
    const initial = await supabase.functions.invoke("apply-analysis-fixes", { body: payload });
    if (!initial.error) {
      return { result: initial.data, error: null as string | null, payloadBytes, source: "invoke" as const };
    }

    const initialMessage = await getInvokeErrorMessage(initial.error, "Failed to apply fixes");
    const initialStatus = getInvokeErrorStatus(initial.error);

    const shouldTryDirectHttp =
      initialStatus === null ||
      initialStatus >= 500 ||
      initialStatus === 413 ||
      initialStatus === 414 ||
      initialStatus === 431 ||
      /non-2xx status code/i.test(initialMessage);

    if (!shouldTryDirectHttp) {
      return { result: null, error: initialMessage, payloadBytes, source: "invoke" as const };
    }

    try {
      const [{ data: sessionData }] = await Promise.all([
        supabase.auth.getSession(),
      ]);
      const token = sessionData?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/apply-analysis-fixes`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      if (response.ok) {
        let parsed: any = null;
        try {
          parsed = raw ? JSON.parse(raw) : null;
        } catch {
          parsed = null;
        }
        return { result: parsed, error: null as string | null, payloadBytes, source: "http" as const };
      }

      const parsedError = parseServerErrorBody(raw);
      const message = parsedError || `Fix service failed with status ${response.status}.`;
      return { result: null, error: message, payloadBytes, source: "http" as const };
    } catch (httpErr: unknown) {
      const httpMessage = httpErr instanceof Error ? httpErr.message : "Fix request failed during HTTP fallback.";
      return { result: null, error: `${initialMessage} ${httpMessage}`.trim(), payloadBytes, source: "http" as const };
    }
  }, [getInvokeErrorMessage, getInvokeErrorStatus, parseServerErrorBody]);

  const refreshAnalysisScores = useCallback(async (resume: ResumeData) => {
    const resumeText = buildResumeTextForAnalysis(resume);
    const fileNameForAnalysis = getAnalysisFileName(resume);
    const linkedResumeId = activeResumeId !== "new" ? activeResumeId : analysis?.resume_id;

    const { data: refreshed, error: fnError } = await supabase.functions.invoke("analyze-resume", {
      body: {
        resumeText,
        fileName: fileNameForAnalysis,
        mimeType: "text/plain",
      },
    });

    if (fnError) throw new Error(fnError.message || "Failed to refresh analysis scores.");
    if (refreshed?.error) throw new Error(refreshed.error);
    if (!refreshed?.analysis) throw new Error("No refreshed analysis returned.");

    const refreshedAnalysis = {
      ...analysis,
      ...refreshed.analysis,
      resume_id: linkedResumeId,
      resume_text: refreshed.analysis.full_raw_text || resumeText,
    };
    setAnalysis(refreshedAnalysis, fileNameForAnalysis);

    if (linkedResumeId && refreshed.analysis?._id) {
      await supabase
        .from("resume_analyses")
        .update({ resume_id: linkedResumeId })
        .eq("id", refreshed.analysis._id);
    }
  }, [activeResumeId, analysis, buildResumeTextForAnalysis, getAnalysisFileName, setAnalysis]);

  const handleApplyFixes = async (focusAreaInput: AnalysisFixFocus | unknown = "all") => {
    const focusArea = normalizeFocusArea(focusAreaInput);
    if (!analysis) { toast.error("No analysis data. Upload and analyze a resume first."); return; }
    setApplyingFixes(true);
    setApplyingFixArea(focusArea);
    try {
      const invokeFixes = async (lean: boolean) => {
        const payload = buildFixPayload(focusArea, analysis, data, lean);
        return invokeApplyFixesWithFallback(payload);
      };

      let response = await invokeFixes(false);
      if (response.error) {
        const firstErrorMessage = response.error || "Failed to apply fixes";
        const shouldRetryLean =
          response.payloadBytes > 450_000 ||
          /too large|payload|request entity|request was too large|non-2xx status code|timed out/i.test(firstErrorMessage);

        if (shouldRetryLean) {
          toast.info("Retrying with compact analysis payload...");
          response = await invokeFixes(true);
        }
      }

      if (response.error) {
        throw new Error(response.error);
      }
      if (response.result?.error) throw new Error(response.result.error);
      if (!response.result?.improvedResume) throw new Error("No fixes were returned. Please retry.");

      if (response.result?.improvedResume) {
        const improved = response.result.improvedResume as Partial<ResumeData>;
        const mergedData = mergeResumeData(data, improved);
        setDataWithUndo(mergedData);
        const labelMap: Record<Exclude<AnalysisFixFocus, "all">, string> = {
          ats: "ATS",
          parsing: "Parsing",
          content: "Content",
          recruiter: "Recruiter view",
          structure: "Structure",
          "ai-detection": "AI detection",
        };
        toast.success(focusArea === "all" ? "All analysis fixes applied!" : `${labelMap[focusArea]} fixes applied!`);

        const syncToast = toast.loading("Refreshing analysis scores from updated resume...");
        try {
          await refreshAnalysisScores(mergedData);
          toast.dismiss(syncToast);
          toast.success("Scores refreshed from the latest analysis.");
        } catch (refreshErr: unknown) {
          toast.dismiss(syncToast);
          const errorMessage = refreshErr instanceof Error ? refreshErr.message : "Fixes were applied, but score refresh failed. Please retry.";
          toast.warning(errorMessage);
        }
      }
    } catch (err: unknown) {
      const message = await getInvokeErrorMessage(err, "Failed to apply fixes");
      toast.error(message);
    }
    finally {
      setApplyingFixes(false);
      setApplyingFixArea(null);
    }
  };

  const handleBulkRewrite = async () => {
    const allBullets = data.experience.flatMap(exp => exp.bullets.filter(b => b.trim()));
    if (allBullets.length === 0) { toast.error("No experience bullets to rewrite."); return; }
    setBulkRewriting(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("rewrite-bullets", {
        body: { bullets: allBullets, style: "concise", context: data.contact.title || "" },
      });
      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);
      if (result?.rewrites) {
        const rewriteMap = new Map<string, string>();
        result.rewrites.forEach((r: { original: string; rewritten: string }) => rewriteMap.set(r.original, r.rewritten));
        setDataWithUndo(prev => ({ ...prev, experience: prev.experience.map(exp => ({ ...exp, bullets: exp.bullets.map(b => rewriteMap.get(b) || b) })) }));
        toast.success(`${result.rewrites.length} bullets rewritten!`);
      }
    } catch (err: any) { toast.error(err.message || "Bulk rewrite failed"); }
    finally { setBulkRewriting(false); }
  };

  const handleDuplicate = async () => {
    if (!user) { toast.error("Please sign in first"); return; }
    const title = `${data.contact.name || "Untitled"} Resume (Copy)`;
    const { data: inserted, error } = await supabase.from("saved_resumes").insert({
      title, resume_data: data as any, template, source: "builder", user_id: user.id,
    } as any).select("id").single();
    if (error) { toast.error("Failed to duplicate"); return; }
    if (inserted) {
      setActiveResumeId((inserted as any).id);
      toast.success("Resume duplicated!");
      const { data: resumes } = await supabase
        .from("saved_resumes")
        .select("id, title, resume_data, template, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (resumes) setSavedResumes(resumes as any);
      notifyResumesChanged();
    }
  };

  // Word/page count
  const wordCount = [
    data.contact.name, data.contact.title, data.summary,
    ...data.experience.flatMap(e => [e.company, e.title, ...e.bullets]),
    ...data.education.map(e => [e.institution, e.degree, e.field].join(" ")),
    ...data.skills.map(s => s.items),
    ...data.projects.flatMap(p => [p.name, p.description, ...p.bullets]),
  ].join(" ").split(/\s+/).filter(Boolean).length;

  const audit = useMemo(() => runResumeAudit(data, template), [data, template]);
  const analysisAtsScore =
    typeof analysis?.scores?.ats?.score === "number" ? analysis.scores.ats.score : undefined;
  const analysisParsingScore =
    typeof analysis?.scores?.parsing?.score === "number" ? analysis.scores.parsing.score : undefined;
  const analysisFixDimensions = useMemo<AnalysisFixDimension[]>(() => {
    if (!analysis) return [];

    const hasAts = !!analysis.ats_analysis || analysis.scores?.ats?.score !== undefined;
    const hasParsing = !!analysis.parsing_analysis || analysis.scores?.parsing?.score !== undefined;
    const hasContent = !!analysis.content_analysis || analysis.scores?.content_quality?.score !== undefined;
    const hasRecruiter = !!analysis.recruiter_analysis || analysis.scores?.recruiter_readability?.score !== undefined;
    const hasStructure = !!analysis.structure_analysis || analysis.scores?.structure?.score !== undefined;
    const hasHuman = !!analysis.humanizer_analysis || analysis.scores?.human_authenticity?.score !== undefined;

    const items: AnalysisFixDimension[] = [];

    if (hasAts) {
      items.push({
        key: "ats",
        label: "ATS",
        score: analysis.scores?.ats?.score,
        helper: "Improve ATS keyword match and filtering compatibility.",
      });
    }

    if (hasParsing) {
      items.push({
        key: "parsing",
        label: "Parsing",
        score: analysis.scores?.parsing?.score,
        helper: "Make sure key fields are extracted cleanly and correctly.",
      });
    }

    if (hasContent) {
      items.push({
        key: "content",
        label: "Content Quality",
        score: analysis.scores?.content_quality?.score,
        helper: "Strengthen bullets with clearer outcomes and impact.",
      });
    }

    if (hasRecruiter) {
      items.push({
        key: "recruiter",
        label: "Recruiter View",
        score: analysis.scores?.recruiter_readability?.score,
        helper: "Make your value easy to scan quickly for recruiters.",
      });
    }

    if (hasStructure) {
      items.push({
        key: "structure",
        label: "Structure",
        score: analysis.scores?.structure?.score,
        helper: "Improve section order and overall reading flow.",
      });
    }

    if (hasHuman) {
      items.push({
        key: "ai-detection",
        label: "AI Detection",
        score: analysis.scores?.human_authenticity?.score,
        helper: "Make writing sound natural, specific, and human.",
      });
    }

    return items;
  }, [analysis]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: "s", ctrl: true, description: "Save", action: handleSave },
    { key: "e", ctrl: true, description: "Export PDF", action: handleExportPDF },
    { key: "z", ctrl: true, description: "Undo", action: handleUndo },
    { key: "z", ctrl: true, shift: true, description: "Redo", action: handleRedo },
    { key: "y", ctrl: true, description: "Redo", action: handleRedo },
    { key: "/", ctrl: true, description: "Shortcuts", action: () => setShortcutsOpen(true) },
    { key: "r", ctrl: true, shift: true, description: "AI Rewrite", action: handleBulkRewrite },
  ]);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const availableWidth = entry.contentRect.width - (isMobile ? 16 : 48);
        const baseScale = Math.min(1, availableWidth / 794);
        const scale = baseScale * (zoomLevel / 100);
        setPreviewScale(scale);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [mode, isMobile, zoomLevel]);

  const previewPanel = (
    <div ref={previewContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/20 flex flex-col items-center py-4 sm:py-6 px-2 sm:px-6">
      <div
        className="shadow-xl rounded-lg overflow-visible bg-white border border-border/30 origin-top"
        style={{ width: 794, transform: `scale(${previewScale})`, transformOrigin: "top center" }}
      >
        <div ref={previewRef}>
          <ResumePreview data={data} template={template} />
        </div>
      </div>
      <div style={{ height: isMobile ? 8 : 40 }} />
    </div>
  );

  const editorPanel = (
    <div className="overflow-y-auto bg-background flex-1">
      <ResumeForm data={data} setData={setDataWithUndo} template={template} onSwitchTemplate={setTemplate} />
    </div>
  );

  const formatTimeSince = (date: Date) => {
    const seconds = Math.round((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const readinessToneClass =
    audit.score >= 80
      ? "border-score-excellent/25 bg-score-excellent/10 text-score-excellent"
      : audit.score >= 60
      ? "border-score-warning/25 bg-score-warning/10 text-score-warning"
      : "border-score-critical/25 bg-score-critical/10 text-score-critical";

  const mobileSaveState = hasUnsavedChanges
    ? "Unsaved changes"
    : lastSaved
    ? `Saved ${formatTimeSince(lastSaved)}`
    : "Auto-save ready";
  const templateSupportsPhoto = template === "designer-photo" || template === "minimal-photo";
  const photoHiddenByTemplate = !!data.contact.photoUrl.trim() && !templateSupportsPhoto;

  return (
    <AppLayout title="Resume Builder">
      {/* Mobile Builder Toolbar */}
      <div className="md:hidden border-b bg-background/96 backdrop-blur-sm px-3 py-2.5 sticky top-0 z-20 space-y-2">
        <Tabs value={mode} onValueChange={(v) => setMode(v as EditorMode)}>
          <TabsList className="h-9 w-full bg-muted/60 p-0.5 grid grid-cols-2">
            <TabsTrigger value="edit" className="h-8 gap-1.5 text-[11px] data-[state=active]:shadow-sm">
              <PenLine className="h-3.5 w-3.5" /> Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="h-8 gap-1.5 text-[11px] data-[state=active]:shadow-sm">
              <Eye className="h-3.5 w-3.5" /> Preview
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center justify-between gap-2 text-[10px]">
          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 font-semibold", readinessToneClass)}>
            Builder {audit.score}/100
          </span>
          <span
            className={cn(
              "truncate",
              hasUnsavedChanges ? "text-score-warning font-medium" : "text-muted-foreground"
            )}
          >
            {mobileSaveState}
          </span>
        </div>
        {photoHiddenByTemplate && (
          <button
            onClick={() => setTemplate("minimal-photo")}
            className="w-full text-left rounded-md border border-score-warning/30 bg-score-warning/10 px-2.5 py-1.5 text-[10px] text-score-warning font-medium"
          >
            Photo is saved but hidden in this template. Tap to switch to Minimal Photo.
          </button>
        )}
      </div>

      {/* Desktop Toolbar */}
      <div className="hidden md:block border-b bg-background/95 backdrop-blur-sm px-2 sm:px-4 py-2.5 shrink-0 sticky top-0 z-20">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={mode} onValueChange={(v) => setMode(v as EditorMode)}>
          <TabsList className="h-8 bg-muted/50 p-0.5">
              <TabsTrigger value="edit" className="h-7 px-2.5 text-[10px] sm:text-[11px] gap-1 data-[state=active]:shadow-sm">
                <PenLine className="h-3 w-3" /> <span className="hidden sm:inline">Edit</span>
              </TabsTrigger>
              {!isMobile && (
                <TabsTrigger value="split" className="h-7 px-3 text-[11px] gap-1 data-[state=active]:shadow-sm">
                  <Columns2 className="h-3 w-3" /> Split
                </TabsTrigger>
              )}
              <TabsTrigger value="preview" className="h-7 px-2.5 text-[10px] sm:text-[11px] gap-1 data-[state=active]:shadow-sm">
                <Eye className="h-3 w-3" /> <span className="hidden sm:inline">Preview</span>
              </TabsTrigger>
          </TabsList>
        </Tabs>

          <button
            onClick={() => setTemplateDialogOpen(true)}
            className="hidden md:flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[11px] font-medium border border-border/60 bg-background hover:bg-muted/50 transition-colors"
          >
            <LayoutGrid className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Template:</span>
            <span>{TEMPLATE_META[template].label}</span>
          </button>

          <div className="flex-1" />

          <div className="hidden xl:flex items-center gap-3 text-[10px] text-muted-foreground mr-1">
            <span className="tabular-nums">{wordCount} words</span>
            {lastSaved && (
              <span className="flex items-center gap-1">
                <Check className="h-2.5 w-2.5 text-score-excellent" />
                Saved {formatTimeSince(lastSaved)}
              </span>
            )}
            {hasUnsavedChanges && (
              <span className="text-score-warning">Unsaved</span>
            )}
          </div>

          {(mode === "preview" || mode === "split") && !isMobile && (
            <div className="hidden md:flex items-center gap-0.5 mr-0.5 rounded-md border border-border/60 bg-card/70 px-1 py-0.5">
              <button onClick={() => setZoomLevel(z => Math.max(50, z - 10))} className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                <ZoomOut className="h-3 w-3" />
              </button>
              <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-center">{zoomLevel}%</span>
              <button onClick={() => setZoomLevel(z => Math.min(150, z + 10))} className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                <ZoomIn className="h-3 w-3" />
              </button>
            </div>
          )}

          {hasAnalysisFixes && (
            <Button
              onClick={() => handleApplyFixes("all")}
              disabled={applyingFixes}
              variant="outline"
              size="sm"
              className="hidden lg:flex h-8 gap-1.5 text-[11px]"
            >
              {applyingFixes ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {applyingFixes ? "Applying..." : "Apply Fixes"}
            </Button>
          )}

          <Button onClick={handleSave} variant="outline" size="sm" className="h-8 gap-1.5 text-[11px]">
            <Save className="h-3.5 w-3.5" /> {activeResumeId !== "new" ? "Update" : "Save"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" className="h-8 gap-1.5 text-[11px]">
                <Download className="h-3.5 w-3.5" /> Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuItem onClick={handleExportPDF} disabled={exporting}>
                <FileDown className="h-3.5 w-3.5 mr-2" /> {exporting ? "Exporting..." : "Export Selectable PDF (links)"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTemplateDialogOpen(true)}>
                <LayoutGrid className="h-3.5 w-3.5 mr-2" /> Change Template
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowScoring(!showScoring)}>
                <ChevronRight className="h-3.5 w-3.5 mr-2" /> {showScoring ? "Hide Quality Rail" : "Show Quality Rail"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleUndo} disabled={undoStack.length === 0}>
                <Undo2 className="h-3.5 w-3.5 mr-2" /> Undo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRedo} disabled={redoStack.length === 0}>
                <Redo2 className="h-3.5 w-3.5 mr-2" /> Redo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleBulkRewrite} disabled={bulkRewriting}>
                {bulkRewriting ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-2" />}
                {bulkRewriting ? "Rewriting..." : "AI Rewrite All"}
              </DropdownMenuItem>
              {hasAnalysisFixes && (
                <DropdownMenuItem onClick={() => handleApplyFixes("all")} disabled={applyingFixes}>
                  {applyingFixes ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-2" />}
                  {applyingFixes ? "Applying..." : "Apply Analysis Fixes"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate Resume
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShortcutsOpen(true)}>
                <Keyboard className="h-3.5 w-3.5 mr-2" /> Keyboard Shortcuts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 font-semibold",
            audit.score >= 80
              ? "border-score-excellent/25 bg-score-excellent/10 text-score-excellent"
              : audit.score >= 60
              ? "border-score-warning/25 bg-score-warning/10 text-score-warning"
              : "border-score-critical/25 bg-score-critical/10 text-score-critical"
          )}>
            Builder {audit.score}/100
          </span>
          <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-muted-foreground">
            Template risk {audit.templateMeta.parseRisk}
          </span>
          <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-muted-foreground">
            Est. {audit.estimatedPages.toFixed(1)} pages
          </span>
          <span className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5",
            audit.blockers.length === 0
              ? "border-score-excellent/25 bg-score-excellent/10 text-score-excellent"
              : "border-score-critical/25 bg-score-critical/10 text-score-critical"
          )}>
            {audit.blockers.length} blockers
          </span>
          {photoHiddenByTemplate && (
            <button
              onClick={() => setTemplate("minimal-photo")}
              className="inline-flex items-center rounded-full border border-score-warning/30 bg-score-warning/10 px-2 py-0.5 text-score-warning font-semibold hover:bg-score-warning/15 transition-colors"
            >
              Photo hidden in this template · Use Minimal Photo
            </button>
          )}
          {audit.templateMeta.parseRisk !== "low" && (
            <button
              onClick={() => setTemplate(audit.recommendedTemplate)}
              className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-primary font-semibold hover:bg-primary/15 transition-colors"
            >
              Switch to {TEMPLATE_META[audit.recommendedTemplate].label}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={cn("flex-1 flex flex-col sm:flex-row overflow-hidden min-h-0", isMobile && "pb-[calc(4.25rem+env(safe-area-inset-bottom))]")}>
        {(mode === "edit" || mode === "split") && (
          <div className={cn(
            "shrink-0 border-r border-border/50 flex flex-col overflow-hidden",
            mode === "split" ? "w-[380px] lg:w-[420px]" : "flex-1 max-w-3xl mx-auto"
          )}>
            {editorPanel}
          </div>
        )}
        {(mode === "preview" || mode === "split") && previewPanel}

        {showScoring && !isMobile && (
          <div className={cn(
            "shrink-0 border-l border-border/50 overflow-y-auto bg-background p-3 sm:p-4 space-y-4",
            "w-[320px]"
          )}>
            <ResumeReadinessPanel
              audit={audit}
              analysisAtsScore={analysisAtsScore}
              analysisParsingScore={analysisParsingScore}
              analysisFixDimensions={analysisFixDimensions}
              hasAnalysisFixes={hasAnalysisFixes}
              applyingFixes={applyingFixes}
              applyingFixArea={applyingFixArea}
              onApplyAnalysisFixes={handleApplyFixes}
            />
            <Separator />
            <LiveScoring data={data} />
          </div>
        )}
      </div>

      {isMobile && (
        <>
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/70 bg-background/96 backdrop-blur-sm px-3 py-2"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
          >
            <div className="grid grid-cols-4 gap-1.5">
              <Button onClick={handleSave} size="sm" className="h-9 text-[11px] gap-1.5">
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
              <Button onClick={handleExportPDF} size="sm" variant="outline" className="h-9 text-[11px] gap-1.5" disabled={exporting}>
                {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Export
              </Button>
              <Button onClick={() => setMobileActionsOpen(true)} size="sm" variant="outline" className="h-9 text-[11px] gap-1.5">
                <MoreHorizontal className="h-3.5 w-3.5" />
                More
              </Button>
              <Button onClick={() => setMobileQualityOpen(true)} size="sm" variant="outline" className="h-9 text-[11px] gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                Quality
              </Button>
            </div>
          </div>

          <Sheet open={mobileActionsOpen} onOpenChange={setMobileActionsOpen}>
            <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl">
              <SheetHeader className="text-left">
                <SheetTitle className="text-base">Builder Actions</SheetTitle>
                <SheetDescription className="text-xs">
                  Quick tools for edits, template changes, AI rewrites, and exports.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-9 justify-start text-[11px] gap-1.5"
                    onClick={() => { setMobileActionsOpen(false); setTemplateDialogOpen(true); }}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" /> Template
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 justify-start text-[11px] gap-1.5"
                    onClick={() => { setMobileActionsOpen(false); handleDuplicate(); }}
                  >
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 justify-start text-[11px] gap-1.5"
                    onClick={() => { setMobileActionsOpen(false); handleUndo(); }}
                    disabled={undoStack.length === 0}
                  >
                    <Undo2 className="h-3.5 w-3.5" /> Undo
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 justify-start text-[11px] gap-1.5"
                    onClick={() => { setMobileActionsOpen(false); handleRedo(); }}
                    disabled={redoStack.length === 0}
                  >
                    <Redo2 className="h-3.5 w-3.5" /> Redo
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 justify-start text-[11px] gap-1.5"
                    onClick={() => { setMobileActionsOpen(false); handleBulkRewrite(); }}
                    disabled={bulkRewriting}
                  >
                    {bulkRewriting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                    AI Rewrite
                  </Button>
                  {hasAnalysisFixes && (
                    <Button
                      variant="outline"
                      className="h-9 justify-start text-[11px] gap-1.5"
                      onClick={() => { setMobileActionsOpen(false); handleApplyFixes("all"); }}
                      disabled={applyingFixes}
                    >
                      {applyingFixes ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Apply Fixes
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="h-9 justify-start text-[11px] gap-1.5"
                    onClick={() => { setMobileActionsOpen(false); setShortcutsOpen(true); }}
                  >
                    <Keyboard className="h-3.5 w-3.5" /> Shortcuts
                  </Button>
                </div>

                <Separator />

                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-muted-foreground">
                    {wordCount} words
                  </span>
                  <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-muted-foreground">
                    Est. {audit.estimatedPages.toFixed(1)} pages
                  </span>
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5", readinessToneClass)}>
                    Builder {audit.score}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5",
                      audit.blockers.length === 0
                        ? "border-score-excellent/25 bg-score-excellent/10 text-score-excellent"
                        : "border-score-critical/25 bg-score-critical/10 text-score-critical"
                    )}
                  >
                    {audit.blockers.length} blockers
                  </span>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Sheet open={mobileQualityOpen} onOpenChange={setMobileQualityOpen}>
            <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl">
              <SheetHeader className="text-left">
                <SheetTitle className="text-base">Quality & Readiness</SheetTitle>
                <SheetDescription className="text-xs">
                  Review ATS/parsing health and apply guided fixes without leaving the builder.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-3 space-y-4 pb-3">
                <ResumeReadinessPanel
                  audit={audit}
                  analysisAtsScore={analysisAtsScore}
                  analysisParsingScore={analysisParsingScore}
                  analysisFixDimensions={analysisFixDimensions}
                  hasAnalysisFixes={hasAnalysisFixes}
                  applyingFixes={applyingFixes}
                  applyingFixArea={applyingFixArea}
                  onApplyAnalysisFixes={handleApplyFixes}
                />
                <Separator />
                <LiveScoring data={data} />
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}

      <TemplatePickerDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        template={template}
        onSelect={setTemplate}
      />

      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />

      {renderExportMirror && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: "-20000px",
            top: 0,
            width: "794px",
            pointerEvents: "none",
            zIndex: -1,
            opacity: 1,
          }}
        >
          <div ref={exportRenderRef}>
            <ResumePreview data={data} template={template} />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
