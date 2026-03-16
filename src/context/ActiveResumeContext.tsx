import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useAnalysis } from "@/context/AnalysisContext";
import { toast } from "sonner";

const reconstructAnalysis = (data: any) => ({
  _id: data.id,
  resume_id: data.resume_id,
  resume_text: data.resume_text,
  extracted_info: {},
  scores: data.scores || {},
  ats_analysis: data.ats_analysis || {},
  parsing_analysis: data.parsing_analysis || {},
  recruiter_analysis: data.recruiter_analysis || {},
  content_analysis: data.content_analysis || {},
  humanizer_analysis: data.humanizer_analysis || {},
  structure_analysis: data.structure_analysis || {},
  red_flags: data.red_flags || [],
  priorities: data.priorities || [],
  strengths: data.strengths || [],
});

export interface ActiveResume {
  id: string;
  title: string;
  alias: string | null;
  template: string;
  updated_at: string;
  created_at: string;
  resume_data: any;
  source: string | null;
  is_primary: boolean;
}

interface ActiveResumeContextType {
  resumes: ActiveResume[];
  activeResumeId: string;
  activeResume: ActiveResume | null;
  loading: boolean;
  setActiveResumeId: (id: string) => void;
  refreshResumes: () => Promise<void>;
  updateAlias: (id: string, alias: string) => Promise<void>;
  /** Display label: alias > title, with timestamp */
  getDisplayName: (resume: ActiveResume) => string;
}

const ActiveResumeContext = createContext<ActiveResumeContextType | null>(null);

export function ActiveResumeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { setAnalysis, clearAnalysis } = useAnalysis();
  const [resumes, setResumes] = useState<ActiveResume[]>([]);
  const [activeResumeId, setActiveResumeIdState] = useState<string>(() =>
    sessionStorage.getItem("activeResumeId") || ""
  );
  const [loading, setLoading] = useState(true);

  const fetchResumes = useCallback(async () => {
    if (!user) { setResumes([]); setLoading(false); return; }
    const { data } = await supabase
      .from("saved_resumes")
      .select("id, title, alias, template, updated_at, created_at, resume_data, source, is_primary")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);
    const list = (data as ActiveResume[]) || [];
    setResumes(list);

    // If current active ID no longer exists, auto-select first
    if (list.length > 0 && !list.find(r => r.id === activeResumeId)) {
      const primaryResume = list.find(r => r.is_primary);
      const newId = primaryResume?.id || list[0].id;
      setActiveResumeIdState(newId);
      sessionStorage.setItem("activeResumeId", newId);
    } else if (list.length === 0) {
      setActiveResumeIdState("");
      sessionStorage.removeItem("activeResumeId");
    }
    setLoading(false);
  }, [user, activeResumeId]);

  useEffect(() => { fetchResumes(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
 
  // Listen for synchronization events
  useEffect(() => {
    const handleResumesChanged = () => {
      console.log("ActiveResumeContext: resumes-changed received");
      fetchResumes();
    };
 
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "activeResumeId" && e.newValue) {
        console.log("ActiveResumeContext: storage change activeResumeId", e.newValue);
        setActiveResumeIdState(e.newValue);
      }
    };
 
    window.addEventListener("resumes-changed", handleResumesChanged);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("resumes-changed", handleResumesChanged);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchResumes]);

  const setActiveResumeId = useCallback((id: string) => {
    setActiveResumeIdState(id);
    sessionStorage.setItem("activeResumeId", id);
    // Dispatch event so any legacy listeners also sync
    window.dispatchEvent(new StorageEvent("storage", { key: "activeResumeId", newValue: id }));
  }, []);

  // Load analysis for the active resume from DB
  useEffect(() => {
    if (!activeResumeId || !user) return;
    (async () => {
      // 1. Try by resume_id (direct link)
      const { data } = await supabase
        .from("resume_analyses")
        .select("*")
        .eq("resume_id", activeResumeId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setAnalysis(reconstructAnalysis(data), data.file_name);
        return;
      }

      // 2. Fallback: match by file_name (with or without extension) + user_id
      const resume = resumes.find(r => r.id === activeResumeId);
      if (!resume) { clearAnalysis(); return; }

      // Try exact title match, then title with common extensions
      const candidates = [
        resume.title,
        `${resume.title}.pdf`,
        `${resume.title}.docx`,
        `${resume.title}.doc`,
        `${resume.title}.txt`,
      ];

      const { data: byName } = await supabase
        .from("resume_analyses")
        .select("*")
        .eq("user_id", user.id)
        .in("file_name", candidates)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (byName) {
        // Auto-link for future lookups
        await supabase.from("resume_analyses")
          .update({ resume_id: activeResumeId } as any)
          .eq("id", byName.id);
        setAnalysis(reconstructAnalysis(byName), byName.file_name);
      } else {
        clearAnalysis();
      }
    })();
  }, [activeResumeId, user, resumes]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeResume = resumes.find(r => r.id === activeResumeId) || null;

  const updateAlias = useCallback(async (id: string, alias: string) => {
    await supabase.from("saved_resumes").update({ alias: alias || null } as any).eq("id", id);
    setResumes(prev => prev.map(r => r.id === id ? { ...r, alias } : r));
  }, []);

  const getDisplayName = useCallback((resume: ActiveResume) => {
    if (resume.alias) return resume.alias;
    
    // Find all resumes with the same exact title
    const sameTitleResumes = resumes
      .filter(r => r.title === resume.title)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
    // If there's more than one with this title, append the version based on chronological order
    if (sameTitleResumes.length > 1) {
      const versionIndex = sameTitleResumes.findIndex(r => r.id === resume.id);
      return `${resume.title} (v${versionIndex + 1})`;
    }

    return resume.title;
  }, [resumes]);

  return (
    <ActiveResumeContext.Provider value={{
      resumes, activeResumeId, activeResume, loading,
      setActiveResumeId, refreshResumes: fetchResumes, updateAlias, getDisplayName,
    }}>
      {children}
    </ActiveResumeContext.Provider>
  );
}

export function useActiveResume() {
  const ctx = useContext(ActiveResumeContext);
  if (!ctx) throw new Error("useActiveResume must be used within ActiveResumeProvider");
  return ctx;
}
