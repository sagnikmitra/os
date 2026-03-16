import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import { supabase } from "@/integrations/supabase/client";
import { ResumePreview } from "@/components/builder/ResumePreview";
import { TemplateName, ResumeData } from "@/types/resume";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GitBranch, ArrowLeft, Clock, Eye, ListChecks, Loader2, FileText, ArrowRight, ArrowDown, CheckCircle2, AlertCircle, Plus, Minus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });
const PREVIEW_WIDTH = 794;
const PREVIEW_HEIGHT = 1123;

interface SavedResume {
  id: string;
  title: string;
  template: string;
  resume_data: any;
  version: number;
  updated_at: string;
  created_at: string;
  parent_id: string | null;
}

function ComparePreviewPane({
  data,
  template,
  borderClassName,
}: {
  data: ResumeData;
  template: TemplateName;
  borderClassName: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const width = el.clientWidth;
      if (width <= 0) return;
      setScale(width / PREVIEW_WIDTH);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`rounded-xl overflow-hidden border-2 ${borderClassName} shadow-sm bg-white`}>
      <div ref={containerRef} className="relative w-full overflow-hidden bg-white" style={{ height: PREVIEW_HEIGHT * scale }}>
        <div
          className="pointer-events-none absolute left-1/2 top-0 origin-top"
          style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT, transform: `translateX(-50%) scale(${scale})` }}
        >
          <ResumePreview data={data} template={template} simple />
        </div>
      </div>
    </div>
  );
}

export default function CompareVersions() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [leftId, setLeftId] = useState(searchParams.get("left") || "");
  const [rightId, setRightId] = useState(searchParams.get("right") || "");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"visual" | "diff">("visual");

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("saved_resumes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (data) {
        setResumes(data as SavedResume[]);
        if (!leftId && data.length > 0) setLeftId(data[0].id);
        if (!rightId && data.length > 1) setRightId(data[1].id);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const left = resumes.find(r => r.id === leftId);
  const right = resumes.find(r => r.id === rightId);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const diffSections = (a: ResumeData, b: ResumeData) => {
    const diffs: { section: string; status: "added" | "removed" | "changed" | "same" }[] = [];
    const check = (name: string, valA: any, valB: any) => {
      const strA = JSON.stringify(valA || "");
      const strB = JSON.stringify(valB || "");
      if (strA === strB) diffs.push({ section: name, status: "same" });
      else if (!valA || (Array.isArray(valA) && valA.length === 0)) diffs.push({ section: name, status: "added" });
      else if (!valB || (Array.isArray(valB) && valB.length === 0)) diffs.push({ section: name, status: "removed" });
      else diffs.push({ section: name, status: "changed" });
    };
    check("Contact", a?.contact, b?.contact);
    check("Summary", a?.summary, b?.summary);
    check("Experience", a?.experience, b?.experience);
    check("Education", a?.education, b?.education);
    check("Skills", a?.skills, b?.skills);
    check("Projects", a?.projects, b?.projects);
    check("Certifications", a?.certifications, b?.certifications);
    check("Awards", a?.awards, b?.awards);
    check("Languages", a?.languages, b?.languages);
    return diffs;
  };

  const statusColors: Record<string, string> = {
    same: "bg-muted text-muted-foreground",
    changed: "bg-score-warning/10 text-score-warning border-score-warning/20",
    added: "bg-score-excellent/10 text-score-excellent border-score-excellent/20",
    removed: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const statusIcons: Record<string, typeof CheckCircle2> = {
    same: CheckCircle2,
    changed: AlertCircle,
    added: Plus,
    removed: Minus,
  };

  const getFieldDiffs = (a: ResumeData, b: ResumeData) => {
    const diffs: { field: string; oldVal: string; newVal: string }[] = [];
    if (a?.contact && b?.contact) {
      const fields = ["name", "email", "phone", "linkedin", "portfolio", "location", "title"] as const;
      fields.forEach(f => {
        const av = (a.contact as any)[f] || "";
        const bv = (b.contact as any)[f] || "";
        if (av !== bv) diffs.push({ field: `Contact → ${f}`, oldVal: av, newVal: bv });
      });
    }
    if ((a?.summary || "") !== (b?.summary || "")) {
      diffs.push({ field: "Summary", oldVal: (a?.summary || "").slice(0, 120) + "...", newVal: (b?.summary || "").slice(0, 120) + "..." });
    }
    const expA = a?.experience?.length || 0;
    const expB = b?.experience?.length || 0;
    if (expA !== expB) diffs.push({ field: "Experience entries", oldVal: String(expA), newVal: String(expB) });
    const bulletsA = a?.experience?.reduce((s, e) => s + e.bullets.filter(Boolean).length, 0) || 0;
    const bulletsB = b?.experience?.reduce((s, e) => s + e.bullets.filter(Boolean).length, 0) || 0;
    if (bulletsA !== bulletsB) diffs.push({ field: "Total bullets", oldVal: String(bulletsA), newVal: String(bulletsB) });
    const eduA = a?.education?.length || 0;
    const eduB = b?.education?.length || 0;
    if (eduA !== eduB) diffs.push({ field: "Education entries", oldVal: String(eduA), newVal: String(eduB) });
    const skillsA = a?.skills?.reduce((s, sk) => s + sk.items.split(",").filter(i => i.trim()).length, 0) || 0;
    const skillsB = b?.skills?.reduce((s, sk) => s + sk.items.split(",").filter(i => i.trim()).length, 0) || 0;
    if (skillsA !== skillsB) diffs.push({ field: "Total skills", oldVal: String(skillsA), newVal: String(skillsB) });
    return diffs;
  };

  const diffs = left && right ? diffSections(left.resume_data as ResumeData, right.resume_data as ResumeData) : [];
  const fieldDiffs = left && right ? getFieldDiffs(left.resume_data as ResumeData, right.resume_data as ResumeData) : [];
  const changedCount = diffs.filter(d => d.status !== "same").length;
  const sameCount = diffs.filter(d => d.status === "same").length;

  return (
    <AppLayout title="Compare Versions" subtitle="Side-by-side version comparison">
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
        <motion.div {...fade(0)} className="flex items-center gap-4 flex-wrap">
          <Link to="/my-resumes">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> My Resumes
            </Button>
          </Link>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GitBranch className="h-4 w-4 text-primary shrink-0" />
            <h2 className="font-display text-lg font-bold tracking-tight">Version Compare</h2>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </motion.div>
          ) : resumes.length < 2 ? (
            <motion.div key="empty" {...fade(0)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
              <GitBranch className="h-10 w-10 text-primary/40 mx-auto mb-4" />
              <h3 className="font-display text-lg font-bold mb-2">Need at least 2 resumes to compare</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Save multiple versions of your resume from the builder, then come back to compare changes side by side.
              </p>
              <div className="flex justify-center gap-3">
                <Link to="/builder"><Button className="gap-1.5"><FileText className="h-4 w-4" /> Open Builder</Button></Link>
                <Link to="/upload"><Button variant="outline" className="gap-1.5">Upload Resume</Button></Link>
              </div>
            </motion.div>
          ) : (
            <motion.div key="compare" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* Version Timeline */}
              <motion.div {...fade(1)} className="rounded-xl border bg-card p-4 sm:p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> Version Timeline — click to select
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {resumes.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        if (!leftId || (leftId && rightId)) { setLeftId(r.id); setRightId(""); }
                        else if (r.id !== leftId) setRightId(r.id);
                      }}
                      className={`shrink-0 px-3 py-2.5 rounded-xl border-2 text-left transition-all text-xs ${
                        r.id === leftId ? "border-primary bg-primary/5 shadow-sm" :
                        r.id === rightId ? "border-score-excellent bg-score-excellent/5 shadow-sm" :
                        "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="font-medium truncate max-w-[140px]">{r.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">v{r.version} · {formatDate(r.updated_at)}</div>
                      {r.id === leftId && <Badge className="text-[9px] mt-1 bg-primary/10 text-primary border-0">A</Badge>}
                      {r.id === rightId && <Badge className="text-[9px] mt-1 bg-score-excellent/10 text-score-excellent border-0">B</Badge>}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Selectors */}
              <motion.div {...fade(2)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold">A</span> Version A
                  </label>
                  <Select value={leftId} onValueChange={setLeftId}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select resume" /></SelectTrigger>
                    <SelectContent>
                      {resumes.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.title} (v{r.version})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-score-excellent flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-score-excellent/10 flex items-center justify-center text-[10px] font-bold">B</span> Version B
                  </label>
                  <Select value={rightId} onValueChange={setRightId}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select resume" /></SelectTrigger>
                    <SelectContent>
                      {resumes.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.title} (v{r.version})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>

              {/* Diff Summary */}
              {left && right && (
                <motion.div {...fade(3)} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {changedCount} change{changedCount !== 1 ? "s" : ""} · {sameCount} unchanged
                      </span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {diffs.map(d => {
                        const Icon = statusIcons[d.status];
                        return (
                          <span key={d.section} className={`text-[10px] font-medium px-2 py-1 rounded-lg border flex items-center gap-1 ${statusColors[d.status]}`}>
                            <Icon className="h-2.5 w-2.5" /> {d.section}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* View tabs */}
                  <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                    <TabsList className="bg-muted/50 p-1">
                      <TabsTrigger value="visual" className="gap-1.5 text-xs"><Eye className="h-3.5 w-3.5" /> Visual Compare</TabsTrigger>
                      <TabsTrigger value="diff" className="gap-1.5 text-xs"><ListChecks className="h-3.5 w-3.5" /> Field Diff</TabsTrigger>
                    </TabsList>

                    <TabsContent value="visual">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4">
                        {[{ resume: left, label: "A", color: "border-primary/30" }, { resume: right, label: "B", color: "border-score-excellent/30" }].map(({ resume, label, color }) => (
                          <div key={label} className="space-y-2">
                            <div className="flex items-center justify-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{label}</Badge>
                              <span className="text-xs font-medium text-muted-foreground truncate">{resume.title} (v{resume.version})</span>
                            </div>
                            <ComparePreviewPane
                              data={resume.resume_data as ResumeData}
                              template={resume.template as TemplateName}
                              borderClassName={color}
                            />
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="diff">
                      <div className="mt-4 rounded-xl border bg-card overflow-hidden">
                        {fieldDiffs.length === 0 ? (
                          <div className="p-6 sm:p-8 text-center">
                            <CheckCircle2 className="h-8 w-8 text-score-excellent/40 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No differences found between these versions.</p>
                          </div>
                        ) : (
                          <>
                            <div className="hidden md:block">
                              <div className="grid grid-cols-3 gap-0 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground border-b bg-secondary/40 px-4 py-2.5">
                                <span>Field</span>
                                <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">A</span> Version A</span>
                                <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-score-excellent/10 flex items-center justify-center text-[8px] font-bold text-score-excellent">B</span> Version B</span>
                              </div>
                              {fieldDiffs.map((d, i) => (
                                <div key={i} className="grid grid-cols-3 gap-0 px-4 py-2.5 border-b last:border-0 text-xs hover:bg-secondary/10 transition-colors">
                                  <span className="font-medium">{d.field}</span>
                                  <span className="text-destructive/80 bg-destructive/5 px-2 py-0.5 rounded truncate">{d.oldVal || "—"}</span>
                                  <span className="text-score-excellent/80 bg-score-excellent/5 px-2 py-0.5 rounded truncate">{d.newVal || "—"}</span>
                                </div>
                              ))}
                            </div>

                            <div className="space-y-2 p-3 md:hidden">
                              {fieldDiffs.map((d, i) => (
                                <div key={i} className="rounded-lg border border-border/70 bg-secondary/15 p-2.5">
                                  <p className="text-[11px] font-semibold text-foreground">{d.field}</p>
                                  <div className="mt-2 space-y-1.5">
                                    <div className="rounded-md bg-destructive/5 px-2 py-1.5">
                                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-destructive/80">Version A</p>
                                      <p className="mt-0.5 text-xs text-foreground/80 break-words">{d.oldVal || "—"}</p>
                                    </div>
                                    <div className="rounded-md bg-score-excellent/5 px-2 py-1.5">
                                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-score-excellent">Version B</p>
                                      <p className="mt-0.5 text-xs text-foreground/80 break-words">{d.newVal || "—"}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
