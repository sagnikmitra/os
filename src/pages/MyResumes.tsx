import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Upload, FileText, Trash2, Copy, Clock, Search,
  Star, StarOff, Pencil, Share2, BarChart3, User, ChevronDown, ChevronUp,
  MoreVertical, Wand2, Check, X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useActiveResume } from "@/context/ActiveResumeContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { notifyResumesChanged } from "@/hooks/useResumeSource";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04, duration: 0.3 } });

interface SavedResume {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  alias: string | null;
  resume_data: any;
  template: string;
  version: number;
  parent_id: string | null;
  tags: string[];
  is_primary: boolean;
  source: string;
  notes: string;
  share_token: string | null;
  is_public: boolean;
  user_id: string;
}

export default function MyResumes() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { refreshResumes: refreshGlobal, setActiveResumeId, getDisplayName, updateAlias } = useActiveResume();
  const [generatingAliasId, setGeneratingAliasId] = useState<string | null>(null);
  const [editingAliasId, setEditingAliasId] = useState<string | null>(null);
  const [aliasDraft, setAliasDraft] = useState("");

  const fetchResumes = async () => {
    if (!user) { setResumes([]); setLoading(false); return; }
    setLoading(true);
    
    const { data, error } = await supabase
      .from("saved_resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Failed to load resumes");
    } else {
      setResumes((data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchResumes(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDuplicate = async (resume: SavedResume) => {
    if (!user) return;
    const { error } = await supabase.from("saved_resumes").insert({
      title: `${resume.title} (Copy)`,
      resume_data: resume.resume_data,
      template: resume.template,
      version: 1,
      parent_id: resume.id,
      tags: resume.tags,
      source: "duplicate",
      user_id: user.id,
    } as any);
    if (error) { toast.error("Failed to duplicate"); return; }
    toast.success("Resume duplicated");
    fetchResumes();
    refreshGlobal();
    notifyResumesChanged();
  };

  const handleShare = async (resume: SavedResume) => {
    const slug = prompt("Enter a custom slug (leave empty for auto-generated):", resume.share_token || "");
    const token = slug?.trim() || resume.share_token || crypto.randomUUID();
    const { error } = await supabase.from("saved_resumes")
      .update({ share_token: token, is_public: true, custom_slug: slug?.trim() || null } as any)
      .eq("id", resume.id);
    if (error) {
      if (error.code === "23505") { toast.error("That slug is already taken. Try another."); return; }
      toast.error("Failed to generate link"); return;
    }
    const shareId = slug?.trim() || token;
    const url = `${window.location.origin}/shared/${shareId}`;
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard!");
    setResumes(prev => prev.map(r => r.id === resume.id ? { ...r, share_token: token, is_public: true } : r));
  };

  const handleDelete = async (id: string) => {
    try {
      const resume = resumes.find(r => r.id === id);

      // 1. Handle job alerts that might reference this resume
      const [{ error: alertsError }, { error: byIdError }, { error: byNameError }] = await Promise.all([
        supabase.from("job_alerts")
          .update({ resume_id: null } as any)
          .eq("resume_id", id),
        supabase.from("resume_analyses").delete().eq("resume_id", id),
        resume?.title
          ? supabase.from("resume_analyses").delete().eq("file_name", resume.title)
          : Promise.resolve({ error: null }),
      ]);

      if (alertsError) console.error("Failed to detach job alerts:", alertsError);
      if (byIdError) console.error("Failed to delete analysis by resume_id:", byIdError);
      if (byNameError) console.error("Failed to delete analysis by file_name:", byNameError);

      // 2. Delete the resume itself
      const { error } = await supabase.from("saved_resumes").delete().eq("id", id);
      if (error) throw error;
      
      toast.success("Resume and its analytics deleted");
      setResumes(prev => prev.filter(r => r.id !== id));
      refreshGlobal();
      notifyResumesChanged();
    } catch (err: any) {
      console.error("Delete Error:", err);
      toast.error("Failed to delete resume. It may be linked to other records.");
    }
  };

  const handleTogglePrimary = async (resume: SavedResume) => {
    const { error } = await supabase.from("saved_resumes").update({ is_primary: !resume.is_primary } as any).eq("id", resume.id);
    if (error) { toast.error("Failed to update"); return; }
    setResumes(prev => prev.map(r => r.id === resume.id ? { ...r, is_primary: !r.is_primary } : r));
  };

  const handleGenerateAlias = async (resume: SavedResume) => {
    setGeneratingAliasId(resume.id);
    try {
      // Call the secure Supabase Edge Function instead of direct Gemini API
      const { data, error } = await supabase.functions.invoke("generate-alias", {
        body: { resumeData: resume.resume_data || {} },
      });

      if (error) throw error;

      if (data?.alias) {
        await updateAlias(resume.id, data.alias);
        setResumes(prev => prev.map(r => r.id === resume.id ? { ...r, alias: data.alias } : r));
        toast.success("AI Alias generated successfully!");
      }
    } catch (err: any) {
      console.error("Generate Alias Error:", err);
      toast.error("Failed to generate alias");
    } finally {
      setGeneratingAliasId(null);
    }
  };

  const handleStartInlineAliasEdit = (resume: SavedResume) => {
    setEditingAliasId(resume.id);
    setAliasDraft((resume.alias || "").trim());
  };

  const handleCancelInlineAliasEdit = () => {
    setEditingAliasId(null);
    setAliasDraft("");
  };

  const handleSaveInlineAlias = async (resume: SavedResume) => {
    const trimmed = aliasDraft.trim();
    const nextAlias = trimmed && trimmed !== resume.title ? trimmed : "";
    await updateAlias(resume.id, nextAlias);
    setResumes(prev => prev.map(r => r.id === resume.id ? { ...r, alias: nextAlias || null } : r));
    toast.success(nextAlias ? "Alias updated" : "Alias cleared");
    setEditingAliasId(null);
    setAliasDraft("");
  };

  const matchesSearch = (resume: SavedResume, query: string) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    const title = resume.title?.toLowerCase() || "";
    const display = getDisplayName(resume as any)?.toLowerCase() || "";
    const tags = Array.isArray(resume.tags) ? resume.tags.join(" ").toLowerCase() : "";
    const source = resume.source?.toLowerCase() || "";
    const candidate = getCandidateName(resume).toLowerCase();
    return title.includes(q) || display.includes(q) || tags.includes(q) || source.includes(q) || candidate.includes(q);
  };

  const filtered = resumes.filter((resume) => matchesSearch(resume, search));

  function getCandidateName(r: SavedResume): string {
    try {
      const name = r.resume_data?.contact?.name;
      if (name && typeof name === "string" && name.trim() && name.trim().toLowerCase() !== "your name") return name.trim();
    } catch {}
    return "Uncategorized";
  }

  const grouped = filtered.reduce<Record<string, SavedResume[]>>((acc, r) => {
    const name = getCandidateName(r);
    if (!acc[name]) acc[name] = [];
    acc[name].push(r);
    return acc;
  }, {});

  const sortedProfiles = Object.entries(grouped).sort(([a], [b]) => {
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  const [collapsedProfiles, setCollapsedProfiles] = useState<Record<string, boolean>>({});
  const toggleProfile = (name: string) => setCollapsedProfiles(p => ({ ...p, [name]: !p[name] }));

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const renderResumeCard = (resume: SavedResume, i: number) => (
    <motion.div key={resume.id} {...fade(i)} className="rounded-xl border bg-card p-4 sm:p-5 flex items-start sm:items-center gap-4 group hover:shadow-sm transition-shadow">
      <div className="w-12 h-16 sm:w-14 sm:h-[72px] rounded-lg bg-secondary/50 border flex items-center justify-center shrink-0 overflow-hidden">
        <FileText className="h-6 w-6 text-muted-foreground/50" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {editingAliasId === resume.id ? (
              <div className="flex items-center gap-1 min-w-0">
                <Input
                  value={aliasDraft}
                  onChange={(e) => setAliasDraft(e.target.value)}
                  placeholder="Enter alias..."
                  className="h-7 w-[220px] max-w-[62vw] text-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSaveInlineAlias(resume);
                    if (e.key === "Escape") handleCancelInlineAliasEdit();
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => void handleSaveInlineAlias(resume)}
                  aria-label="Save alias"
                >
                  <Check className="h-3.5 w-3.5 text-primary" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={handleCancelInlineAliasEdit}
                  aria-label="Cancel alias edit"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground leading-tight truncate max-w-[44vw] sm:max-w-[360px]">
                  {getDisplayName(resume as any)}
                </h3>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => handleStartInlineAliasEdit(resume)}
                  aria-label="Edit alias"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
            {resume.is_primary && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium tracking-wide">Primary</span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground capitalize">{resume.template}</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Uploaded {formatDate(resume.updated_at)}</span>
            <span className="text-muted-foreground/30">•</span>
            <span>Version {resume.version}</span>
            {resume.source && (
              <>
                <span className="text-muted-foreground/30">•</span>
                <span>Source: <span className="capitalize">{resume.source}</span></span>
              </>
            )}
          </div>
          {resume.tags && resume.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {resume.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Unified Actions Container (Desktop & Mobile) */}
        <div className="flex items-center gap-2 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 w-full sm:w-auto shrink-0 justify-end">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs bg-background"
            onClick={() => {
              setActiveResumeId(resume.id);
              navigate("/builder");
            }}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
          </Button>
          <Button size="sm" className="h-8 px-3 text-xs font-semibold shadow-sm" onClick={() => { setActiveResumeId(resume.id); navigate("/reports"); }}>
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> See Report
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0 border border-transparent hover:border-border/50">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 shadow-lg">
              <DropdownMenuItem onClick={() => handleGenerateAlias(resume)} disabled={generatingAliasId === resume.id}>
                <Wand2 className={`h-4 w-4 mr-2 ${generatingAliasId === resume.id ? 'animate-pulse text-primary' : ''}`} /> Generate AI Alias
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTogglePrimary(resume)}>
                {resume.is_primary ? <Star className="h-4 w-4 mr-2 fill-primary text-primary" /> : <StarOff className="h-4 w-4 mr-2" />} {resume.is_primary ? "Unstar Primary" : "Mark as Primary"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/analytics?resume=${resume.id}`)}>
                <BarChart3 className="h-4 w-4 mr-2" /> View Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare(resume)}>
                <Share2 className="h-4 w-4 mr-2" /> Share Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicate(resume)}>
                <Copy className="h-4 w-4 mr-2" /> Duplicate
              </DropdownMenuItem>
              <div className="h-px bg-border/50 my-1" />
              <DropdownMenuItem onClick={() => handleDelete(resume.id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Delete Resume
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );

  return (
    <AppLayout title="My Resumes">
      <div className="page-container py-4 sm:py-6 max-w-5xl space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1">My Resumes</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {sortedProfiles.length > 1
                ? `${resumes.length} resumes across ${sortedProfiles.filter(([n]) => n !== "Uncategorized").length} profiles`
                : "Manage all your resume versions in one place."}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/upload">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <Upload className="h-3.5 w-3.5" /> Upload
              </Button>
            </Link>
            <Link to="/builder">
              <Button size="sm" className="gap-1.5 text-xs h-8">
                <Plus className="h-3.5 w-3.5" /> New
              </Button>
            </Link>
          </div>
        </div>

        {resumes.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Total resumes</p>
              <p className="text-base font-semibold">{resumes.length}</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Primary</p>
              <p className="text-base font-semibold">{resumes.filter(r => r.is_primary).length}</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Public links</p>
              <p className="text-base font-semibold">{resumes.filter(r => r.is_public).length}</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Profiles</p>
              <p className="text-base font-semibold">{sortedProfiles.filter(([n]) => n !== "Uncategorized").length}</p>
            </div>
          </div>
        )}

        {resumes.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, alias, tags, source, or candidate..."
              className="pl-10 h-9"
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center text-sm text-muted-foreground">
              Loading resumes...
            </motion.div>
          ) : filtered.length === 0 && resumes.length === 0 ? (
            <motion.div key="empty" {...fade(0)} className="rounded-2xl border-2 border-dashed bg-card/50 p-10 sm:p-16 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/[0.08] flex items-center justify-center mx-auto mb-4 sm:mb-5">
                <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <h3 className="font-display text-base sm:text-lg font-bold mb-2">No resumes yet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mb-5 sm:mb-6">
                Upload an existing resume for analysis, or build one from scratch.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                <Link to="/upload"><Button variant="outline" className="gap-1.5 w-full sm:w-auto"><Upload className="h-4 w-4" /> Upload Resume</Button></Link>
                <Link to="/onboarding"><Button className="gap-1.5 w-full sm:w-auto"><Plus className="h-4 w-4" /> Build New</Button></Link>
              </div>
            </motion.div>
          ) : sortedProfiles.length === 1 && sortedProfiles[0][0] === "Uncategorized" ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 sm:space-y-3">
              {filtered.map((resume, i) => renderResumeCard(resume, i))}
            </motion.div>
          ) : (
            <motion.div key="grouped" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-5">
              {sortedProfiles.map(([profileName, profileResumes]) => {
                const isCollapsed = collapsedProfiles[profileName];
                const initials = profileName === "Uncategorized"
                  ? "?"
                  : profileName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

                return (
                  <div key={profileName} className="rounded-xl border border-border bg-card/50 overflow-hidden">
                    <button
                      onClick={() => toggleProfile(profileName)}
                      className="w-full px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {profileName === "Uncategorized" ? (
                          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        ) : (
                          <span className="text-[10px] sm:text-xs font-bold text-primary">{initials}</span>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{profileName}</p>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                          {profileResumes.length} resume{profileResumes.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] mr-2 hidden sm:inline-flex">{profileResumes.length}</Badge>
                      {isCollapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border"
                        >
                          <div className="p-2 sm:p-3 space-y-2">
                            {profileResumes.map((resume, i) => renderResumeCard(resume, i))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
