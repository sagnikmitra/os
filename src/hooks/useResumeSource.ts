import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface SavedResumeOption {
  id: string;
  title: string;
  resume_data: any;
  updated_at: string;
}

const RESUME_CACHE_TTL_MS = 30 * 1000;
const resumeCacheByUser = new Map<string, { data: SavedResumeOption[]; fetchedAt: number }>();

function getCachedResumes(userId: string): SavedResumeOption[] | null {
  const cached = resumeCacheByUser.get(userId);
  if (!cached) return null;
  if (Date.now() - cached.fetchedAt > RESUME_CACHE_TTL_MS) {
    resumeCacheByUser.delete(userId);
    return null;
  }
  return cached.data;
}

function setCachedResumes(userId: string, data: SavedResumeOption[]) {
  resumeCacheByUser.set(userId, { data, fetchedAt: Date.now() });
}

/** Dispatch this event from any page after inserting/updating/deleting a resume
 *  so that all mounted useResumeSource hooks refetch automatically. */
export function notifyResumesChanged() {
  resumeCacheByUser.clear();
  window.dispatchEvent(new Event("resumes-changed"));
}

/**
 * Hook to provide resume text from either a saved resume, sessionStorage, or manual paste.
 * Returns { resumeText, sourceMode, ... } so pages can use resumeText directly.
 * Automatically refetches when a "resumes-changed" event is dispatched on window.
 */
export function useResumeSource() {
  const { user } = useAuth();
  const [savedResumes, setSavedResumes] = useState<SavedResumeOption[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [pastedText, setPastedText] = useState("");
  const [sourceMode, setSourceMode] = useState<"saved" | "paste">("saved");
  const [loadingResumes, setLoadingResumes] = useState(true);

  const fetchResumes = useCallback(async (force = false) => {
    if (!user?.id) {
      setSavedResumes([]);
      setSelectedResumeId("");
      setLoadingResumes(false);
      return;
    }

    if (!force) {
      const cached = getCachedResumes(user.id);
      if (cached) {
        setSavedResumes(cached);
        setSelectedResumeId((prev) => (prev && cached.some((r) => r.id === prev) ? prev : cached[0]?.id || ""));
        setLoadingResumes(false);
        return;
      }
    }

    setLoadingResumes(true);
    try {
      const { data } = await supabase
        .from("saved_resumes")
        .select("id, title, resume_data, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20);

      const rows = (data as SavedResumeOption[]) || [];
      setCachedResumes(user.id, rows);

      if (rows.length > 0) {
        setSavedResumes(rows);
        // Only set selected if not already selected (preserve user choice)
        setSelectedResumeId((prev) => (prev && rows.some((r) => r.id === prev) ? prev : rows[0].id));
      } else {
        setSavedResumes([]);
        setSelectedResumeId("");
      }
    } catch {}
    setLoadingResumes(false);
  }, [user?.id]);

  // Fetch on mount
  useEffect(() => { fetchResumes(); }, [fetchResumes]);

  // Listen for cross-page invalidation events
  useEffect(() => {
    const handler = () => { fetchResumes(true); };
    window.addEventListener("resumes-changed", handler);
    return () => window.removeEventListener("resumes-changed", handler);
  }, [fetchResumes]);

  const resumeDataToText = useCallback((rd: any): string => {
    if (!rd) return "";
    const parts: string[] = [];
    if (rd.name) parts.push(rd.name);
    if (rd.title) parts.push(rd.title);
    if (rd.email || rd.phone || rd.location) parts.push([rd.email, rd.phone, rd.location].filter(Boolean).join(" | "));
    if (rd.summary) parts.push(`Summary: ${rd.summary}`);
    if (rd.experience?.length) {
      parts.push("Experience:");
      rd.experience.forEach((e: any) => {
        parts.push(`${e.title || ""} at ${e.company || ""} (${e.startDate || ""} - ${e.endDate || "Present"})`);
        if (e.description) parts.push(e.description);
        if (e.bullets?.length) e.bullets.forEach((b: string) => parts.push(`• ${b}`));
      });
    }
    if (rd.education?.length) {
      parts.push("Education:");
      rd.education.forEach((e: any) => parts.push(`${e.degree || ""} - ${e.school || ""} (${e.graduationDate || ""})`));
    }
    if (rd.skills?.length) parts.push(`Skills: ${rd.skills.join(", ")}`);
    if (rd.certifications?.length) {
      parts.push("Certifications:");
      rd.certifications.forEach((c: any) => parts.push(typeof c === "string" ? c : `${c.name || ""} - ${c.issuer || ""}`));
    }
    if (rd.projects?.length) {
      parts.push("Projects:");
      rd.projects.forEach((p: any) => parts.push(`${p.name || ""}: ${p.description || ""}`));
    }
    return parts.join("\n");
  }, []);

  const getResumeText = useCallback((): string => {
    if (sourceMode === "paste") return pastedText;
    const selected = savedResumes.find(r => r.id === selectedResumeId);
    if (selected) return resumeDataToText(selected.resume_data);
    // Fallback to sessionStorage
    const ss = sessionStorage.getItem("parsedResume_text");
    if (ss) return ss;
    return pastedText;
  }, [sourceMode, pastedText, savedResumes, selectedResumeId, resumeDataToText]);

  const getResumeData = useCallback((): any => {
    if (sourceMode === "saved") {
      const selected = savedResumes.find(r => r.id === selectedResumeId);
      if (selected) return selected.resume_data;
    }
    // Fallback to sessionStorage
    const ss = sessionStorage.getItem("parsedResume_data");
    if (ss) try { return JSON.parse(ss); } catch {}
    return null;
  }, [sourceMode, savedResumes, selectedResumeId]);

  return {
    savedResumes,
    selectedResumeId,
    setSelectedResumeId,
    pastedText,
    setPastedText,
    sourceMode,
    setSourceMode,
    loadingResumes,
    getResumeText,
    getResumeData,
    hasSavedResumes: savedResumes.length > 0,
  };
}
