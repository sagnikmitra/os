import { useState, useEffect, useMemo } from "react";
import { motion } from "@/lib/motion-stub";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  User, Briefcase, MapPin, Mail, Phone, Globe, Linkedin,
  GraduationCap, Award, Code2, Building2, Calendar, Clock,
  FileText, TrendingUp, BarChart3, Pencil, Star, ChevronRight,
  Languages, BookOpen, Zap, Target, CheckCircle2, AlertTriangle,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ResumeData } from "@/types/resume";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

function formatRelativeStamp(dateValue?: string) {
  if (!dateValue) return "recently";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "recently";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface SavedResume {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  resume_data: ResumeData;
  template: string;
  version: number;
  is_primary: boolean;
  source: string;
  tags: string[];
}

interface ProfileData {
  name: string;
  resumes: SavedResume[];
  latestResume: ResumeData;
  // Aggregated data
  allSkills: { skill: string; count: number }[];
  allCompanies: { company: string; role: string; duration: string }[];
  allEducation: { institution: string; degree: string; field: string }[];
  allCertifications: string[];
  allLanguages: string[];
  totalExperienceEntries: number;
  totalBullets: number;
  latestTitle: string;
  latestLocation: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
}

function aggregateProfile(name: string, resumes: SavedResume[]): ProfileData {
  const sorted = [...resumes].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  const latest = sorted[0]?.resume_data || {} as ResumeData;

  // Aggregate skills across all resumes
  const skillMap = new Map<string, number>();
  resumes.forEach(r => {
    (r.resume_data?.skills || []).forEach(cat => {
      cat.items.split(",").map(s => s.trim()).filter(Boolean).forEach(s => {
        skillMap.set(s, (skillMap.get(s) || 0) + 1);
      });
    });
  });
  const allSkills = Array.from(skillMap.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count);

  // Aggregate companies
  const companySet = new Set<string>();
  const allCompanies: { company: string; role: string; duration: string }[] = [];
  resumes.forEach(r => {
    (r.resume_data?.experience || []).forEach(exp => {
      if (exp.company && !companySet.has(exp.company)) {
        companySet.add(exp.company);
        allCompanies.push({
          company: exp.company,
          role: exp.title,
          duration: [exp.startDate, exp.endDate].filter(Boolean).join(" – "),
        });
      }
    });
  });

  // Education
  const eduSet = new Set<string>();
  const allEducation: { institution: string; degree: string; field: string }[] = [];
  resumes.forEach(r => {
    (r.resume_data?.education || []).forEach(edu => {
      if (edu.institution && !eduSet.has(edu.institution)) {
        eduSet.add(edu.institution);
        allEducation.push({ institution: edu.institution, degree: edu.degree, field: edu.field });
      }
    });
  });

  // Certifications
  const certSet = new Set<string>();
  resumes.forEach(r => (r.resume_data?.certifications || []).forEach(c => c.name && certSet.add(c.name)));

  // Languages
  const langSet = new Set<string>();
  resumes.forEach(r => (r.resume_data?.languages || []).forEach(l => l.language && langSet.add(l.language)));

  // Counts
  let totalBullets = 0;
  resumes.forEach(r => (r.resume_data?.experience || []).forEach(e => { totalBullets += e.bullets.filter(Boolean).length; }));

  return {
    name,
    resumes: sorted,
    latestResume: latest,
    allSkills,
    allCompanies,
    allEducation,
    allCertifications: Array.from(certSet),
    allLanguages: Array.from(langSet),
    totalExperienceEntries: allCompanies.length,
    totalBullets,
    latestTitle: latest.contact?.title || "",
    latestLocation: latest.contact?.location || "",
    email: latest.contact?.email || "",
    phone: latest.contact?.phone || "",
    linkedin: latest.contact?.linkedin || "",
    portfolio: latest.contact?.portfolio || "",
  };
}

export default function ProfileHub() {
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedProfile = searchParams.get("profile");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("saved_resumes").select("*").order("updated_at", { ascending: false });
      if (error) toast.error("Failed to load resumes");
      else setResumes((data as any[]) || []);
      setLoading(false);
    })();
  }, []);

  const getCandidateName = (r: SavedResume): string => {
    const name = r.resume_data?.contact?.name;
    if (name && typeof name === "string" && name.trim() && name.trim().toLowerCase() !== "your name") return name.trim();
    return "Uncategorized";
  };

  const profiles = useMemo(() => {
    const grouped: Record<string, SavedResume[]> = {};
    resumes.forEach(r => {
      const name = getCandidateName(r);
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(r);
    });
    return Object.entries(grouped)
      .map(([name, rr]) => aggregateProfile(name, rr))
      .sort((a, b) => {
        if (a.name === "Uncategorized") return 1;
        if (b.name === "Uncategorized") return -1;
        return b.resumes.length - a.resumes.length;
      });
  }, [resumes]);

  const currentProfile = selectedProfile ? profiles.find(p => p.name === selectedProfile) : null;
  const profileStats = useMemo(() => {
    let resumeCount = 0;
    let skillCount = 0;
    let companyCount = 0;

    profiles.forEach((profile) => {
      resumeCount += profile.resumes.length;
      skillCount += profile.allSkills.length;
      companyCount += profile.totalExperienceEntries;
    });

    return {
      profileCount: profiles.length,
      resumeCount,
      skillCount,
      companyCount,
    };
  }, [profiles]);

  const handleRename = async (oldName: string) => {
    if (!newName.trim() || newName.trim() === oldName) { setEditingName(null); return; }
    const profileResumes = resumes.filter(r => getCandidateName(r) === oldName);
    let updated = 0;
    for (const r of profileResumes) {
      const updatedData = { ...r.resume_data, contact: { ...r.resume_data.contact, name: newName.trim() } };
      const { error } = await supabase.from("saved_resumes").update({ resume_data: updatedData as any }).eq("id", r.id);
      if (!error) updated++;
    }
    if (updated > 0) {
      toast.success(`Renamed ${updated} resume(s) to "${newName.trim()}"`);
      setResumes(prev => prev.map(r => {
        if (getCandidateName(r) === oldName) {
          return { ...r, resume_data: { ...r.resume_data, contact: { ...r.resume_data.contact, name: newName.trim() } } };
        }
        return r;
      }));
      navigate(`/profile-hub?profile=${encodeURIComponent(newName.trim())}`);
    }
    setEditingName(null);
  };

  // Profile Detail View
  if (currentProfile) {
    const p = currentProfile;
    const initials = p.name === "Uncategorized" ? "?" : p.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    return (
      <AppLayout title={`${p.name} — Profile`}>
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Profile Header */}
          <motion.div {...fade(0)} className="rounded-2xl border bg-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/3 blur-2xl" />
            <div className="relative flex items-start gap-5">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-primary">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {editingName === p.name ? (
                    <div className="flex items-center gap-2">
                      <Input value={newName} onChange={e => setNewName(e.target.value)} className="h-8 w-60" autoFocus onKeyDown={e => e.key === "Enter" && handleRename(p.name)} />
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleRename(p.name)}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingName(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold text-foreground">{p.name}</h1>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditingName(p.name); setNewName(p.name); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
                {p.latestTitle && <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {p.latestTitle}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  {p.latestLocation && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.latestLocation}</span>}
                  {p.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {p.email}</span>}
                  {p.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {p.phone}</span>}
                  {p.linkedin && <span className="flex items-center gap-1"><Linkedin className="h-3 w-3" /> {p.linkedin}</span>}
                  {p.portfolio && <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {p.portfolio}</span>}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/profile-hub")} className="shrink-0">← All Profiles</Button>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div {...fade(1)} className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Resumes", value: p.resumes.length, icon: <FileText className="h-4 w-4 text-primary" /> },
              { label: "Companies", value: p.totalExperienceEntries, icon: <Building2 className="h-4 w-4 text-primary" /> },
              { label: "Skills", value: p.allSkills.length, icon: <Code2 className="h-4 w-4 text-primary" /> },
              { label: "Certifications", value: p.allCertifications.length, icon: <Award className="h-4 w-4 text-primary" /> },
              { label: "Bullets Written", value: p.totalBullets, icon: <Target className="h-4 w-4 text-primary" /> },
            ].map(s => (
              <div key={s.label} className="rounded-xl border bg-card p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">{s.icon}<span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</span></div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </motion.div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
              <TabsTrigger value="overview" className="gap-1.5 text-xs"><User className="h-3 w-3" /> Overview</TabsTrigger>
              <TabsTrigger value="skills" className="gap-1.5 text-xs"><Code2 className="h-3 w-3" /> Skills Matrix</TabsTrigger>
              <TabsTrigger value="experience" className="gap-1.5 text-xs"><Building2 className="h-3 w-3" /> Experience</TabsTrigger>
              <TabsTrigger value="education" className="gap-1.5 text-xs"><GraduationCap className="h-3 w-3" /> Education</TabsTrigger>
              <TabsTrigger value="resumes" className="gap-1.5 text-xs"><FileText className="h-3 w-3" /> Resumes</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-4">
              {/* Summary from latest resume */}
              {p.latestResume?.summary && (
                <motion.div {...fade(0)} className="rounded-xl border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Professional Summary</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.latestResume.summary}</p>
                </motion.div>
              )}

              <div className="grid lg:grid-cols-2 gap-4">
                {/* Top Skills */}
                <motion.div {...fade(1)} className="rounded-xl border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Top Skills</h3>
                  <div className="space-y-2">
                    {p.allSkills.slice(0, 10).map((s, i) => (
                      <div key={s.skill} className="flex items-center gap-3">
                        <span className="text-sm text-foreground flex-1 truncate">{s.skill}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={Math.min(100, s.count * 33)} className="w-20 h-1.5" />
                          <span className="text-[10px] text-muted-foreground w-12 text-right">
                            {s.count > 1 ? `${s.count} resumes` : "1 resume"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Career Timeline */}
                <motion.div {...fade(2)} className="rounded-xl border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Career Timeline</h3>
                  <div className="space-y-3">
                    {p.allCompanies.map((c, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary/40 shrink-0 ring-2 ring-primary/10" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{c.role}</p>
                          <p className="text-xs text-muted-foreground">{c.company}</p>
                          {c.duration && <p className="text-[10px] text-muted-foreground mt-0.5">{c.duration}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Extras row */}
              <div className="grid lg:grid-cols-3 gap-4">
                {p.allCertifications.length > 0 && (
                  <motion.div {...fade(3)} className="rounded-xl border bg-card p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Certifications</h3>
                    {p.allCertifications.map((c, i) => (
                      <p key={i} className="text-sm text-muted-foreground flex items-start gap-2 mb-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /> {c}</p>
                    ))}
                  </motion.div>
                )}
                {p.allLanguages.length > 0 && (
                  <motion.div {...fade(4)} className="rounded-xl border bg-card p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Languages className="h-4 w-4 text-primary" /> Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {p.allLanguages.map((l, i) => <Badge key={i} variant="secondary">{l}</Badge>)}
                    </div>
                  </motion.div>
                )}
                {p.allEducation.length > 0 && (
                  <motion.div {...fade(5)} className="rounded-xl border bg-card p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Education</h3>
                    {p.allEducation.map((e, i) => (
                      <div key={i} className="mb-2">
                        <p className="text-sm font-medium text-foreground">{e.degree}{e.field ? ` in ${e.field}` : ""}</p>
                        <p className="text-xs text-muted-foreground">{e.institution}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Quick Actions */}
              <motion.div {...fade(6)} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Career Intel", icon: <TrendingUp className="h-4 w-4" />, href: "/career-intelligence" },
                  { label: "Learning Path", icon: <BookOpen className="h-4 w-4" />, href: "/learning-roadmap" },
                  { label: "Personal Brand", icon: <Star className="h-4 w-4" />, href: "/personal-branding" },
                  { label: "Interview Prep", icon: <Target className="h-4 w-4" />, href: "/interview-prep" },
                ].map(a => (
                  <Link key={a.href} to={a.href}>
                    <div className="rounded-xl border bg-card p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">{a.icon}</div>
                      <span className="text-sm font-medium text-foreground">{a.label}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                    </div>
                  </Link>
                ))}
              </motion.div>
            </TabsContent>

            {/* Skills Matrix */}
            <TabsContent value="skills" className="space-y-4">
              <motion.div {...fade(0)} className="rounded-xl border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">All Skills ({p.allSkills.length})</h3>
                <div className="space-y-2">
                  {p.allSkills.map((s, i) => (
                    <div key={s.skill} className="flex items-center gap-3 rounded-lg bg-muted/20 p-2.5">
                      <span className="text-sm font-medium text-foreground flex-1">{s.skill}</span>
                      <Progress value={Math.min(100, s.count * 33)} className="w-32 h-2" />
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {s.count} resume{s.count > 1 ? "s" : ""}
                      </Badge>
                    </div>
                  ))}
                </div>
                {p.allSkills.length === 0 && <p className="text-sm text-muted-foreground">No skills data found in resumes.</p>}
              </motion.div>
            </TabsContent>

            {/* Experience */}
            <TabsContent value="experience" className="space-y-3">
              {p.allCompanies.map((c, i) => (
                <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{c.role}</p>
                      <p className="text-sm text-muted-foreground">{c.company}</p>
                      {c.duration && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> {c.duration}</p>}
                    </div>
                  </div>
                </motion.div>
              ))}
              {p.allCompanies.length === 0 && <p className="text-sm text-muted-foreground p-4">No experience data found.</p>}
            </TabsContent>

            {/* Education */}
            <TabsContent value="education" className="space-y-3">
              {p.allEducation.map((e, i) => (
                <motion.div key={i} {...fade(i)} className="rounded-xl border bg-card p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{e.degree}{e.field ? ` in ${e.field}` : ""}</p>
                      <p className="text-sm text-muted-foreground">{e.institution}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {p.allEducation.length === 0 && <p className="text-sm text-muted-foreground p-4">No education data found.</p>}
            </TabsContent>

            {/* Resumes */}
            <TabsContent value="resumes" className="space-y-3">
              {p.resumes.map((r, i) => (
                <motion.div key={r.id} {...fade(i)} className="rounded-xl border bg-card p-4 flex items-center gap-4 group hover:shadow-md transition-shadow">
                  <div className="w-12 h-[60px] rounded-lg bg-secondary/50 border flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate text-foreground">{r.title}</h3>
                      {r.is_primary && <Badge className="text-[10px] bg-primary/10 text-primary">Primary</Badge>}
                      <Badge variant="outline" className="text-[10px] capitalize">{r.template}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(r.updated_at).toLocaleDateString()}</span>
                      <span>v{r.version}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => navigate(`/analytics?resume=${r.id}`)}>
                      <BarChart3 className="h-3 w-3" /> Analytics
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => navigate("/builder")}>
                      <Pencil className="h-3 w-3" /> Edit
                    </Button>
                  </div>
                </motion.div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    );
  }

  // Profile List View
  return (
    <AppLayout title="Profile Hub">
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 space-y-6">
        <motion.div {...fade(0)}>
          <div className="rounded-2xl border border-border/70 bg-card/90 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1.5">
                <p className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/90">
                  Candidate Workspace
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Profile Hub</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Manage candidate profiles, compare resume coverage, and jump into each profile with a cleaner overview.
                </p>
              </div>
              <Link to="/builder" className="sm:shrink-0">
                <Button size="sm" className="h-10 gap-2 px-4">
                  <FileText className="h-4 w-4" />
                  New Resume
                </Button>
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { label: "Profiles", value: profileStats.profileCount },
                { label: "Resumes", value: profileStats.resumeCount },
                { label: "Skills", value: profileStats.skillCount },
                { label: "Companies", value: profileStats.companyCount },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-xl font-semibold leading-none text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-12 text-center">Loading profiles...</p>
        ) : profiles.length === 0 ? (
          <motion.div {...fade(0)} className="rounded-2xl border-2 border-dashed bg-card/50 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/[0.08] flex items-center justify-center mx-auto mb-5">
              <User className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-foreground">No profiles yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">Upload or build resumes to create candidate profiles automatically.</p>
            <div className="flex justify-center gap-3">
              <Link to="/upload"><Button variant="outline">Upload Resume</Button></Link>
              <Link to="/builder"><Button>Build Resume</Button></Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {profiles.map((p, i) => {
              const initials = p.name === "Uncategorized" ? "?" : p.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
              const lastUpdated = formatRelativeStamp(p.resumes[0]?.updated_at);
              return (
                <motion.div key={p.name} {...fade(i)} className="h-full">
                  <Link to={`/profile-hub?profile=${encodeURIComponent(p.name)}`}>
                    <div className="group flex h-full flex-col rounded-2xl border border-border/65 bg-card/95 p-4 shadow-[0_1px_3px_hsl(var(--foreground)/0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg sm:p-5">
                      <div className="mb-3 flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 transition-colors group-hover:bg-primary/15">
                          <span className="text-sm font-bold tracking-wide text-primary">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="truncate text-lg font-semibold leading-tight text-foreground">{p.name}</h3>
                          <p className="mt-0.5 truncate text-sm text-muted-foreground">{p.latestTitle || "Role not specified yet"}</p>
                          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            Updated {lastUpdated}
                          </p>
                        </div>
                        <div className="mt-1 rounded-full border border-border/70 p-1.5 text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary">
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5 text-center">
                        <div className="rounded-xl border border-border/60 bg-muted/[0.22] px-2 py-2.5">
                          <p className="text-xl font-semibold leading-none text-foreground">{p.resumes.length}</p>
                          <p className="mt-1 text-[11px] font-medium text-muted-foreground">Resumes</p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-muted/[0.22] px-2 py-2.5">
                          <p className="text-xl font-semibold leading-none text-foreground">{p.allSkills.length}</p>
                          <p className="mt-1 text-[11px] font-medium text-muted-foreground">Skills</p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-muted/[0.22] px-2 py-2.5">
                          <p className="text-xl font-semibold leading-none text-foreground">{p.totalExperienceEntries}</p>
                          <p className="mt-1 text-[11px] font-medium text-muted-foreground">Companies</p>
                        </div>
                      </div>

                      <div className="mt-3 min-h-[54px]">
                        {p.allSkills.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {p.allSkills.slice(0, 4).map((s) => (
                              <Badge
                                key={s.skill}
                                variant="secondary"
                                className="max-w-[160px] truncate rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary/90"
                                title={s.skill}
                              >
                                {s.skill}
                              </Badge>
                            ))}
                            {p.allSkills.length > 4 && (
                              <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px] font-medium">
                                +{p.allSkills.length - 4} more
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No skill tags yet. Open profile to enrich this data.</p>
                        )}
                      </div>

                      <div className="mt-auto pt-3">
                        <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.1em] text-primary/90">
                          Open Profile
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
