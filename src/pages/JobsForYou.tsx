import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, MapPin, Building2, Briefcase, ExternalLink, Filter, X, Heart,
  Loader2, Clock, DollarSign, Users, Sparkles, RefreshCw, CheckCircle2,
  AlertTriangle, Globe, Monitor, Wifi, ChevronRight, Target, Zap, Star,
  Calendar, UserCircle, Layers, BookOpen, Trash2, StickyNote, Bookmark,
  Radar, Link as LinkIcon,
} from "lucide-react";

interface Job {
  job_id: string;
  title: string;
  company: string;
  company_logo_letter?: string;
  location: string;
  work_mode: "Remote" | "Hybrid" | "On-site";
  employment_type?: string;
  seniority: string;
  salary_range: string;
  posted_date?: string;
  application_deadline?: string;
  short_description: string;
  key_requirements: string[];
  matching_skills: string[];
  missing_skills?: string[];
  match_score: number;
  career_page_url?: string;
  benefits?: string[];
  team_size?: string;
  reports_to?: string;
  tech_stack?: string[];
  company_industry: string;
  company_size?: string;
  why_good_fit?: string;
  application_tips?: string;
  apply_url?: string;
  link_status?: "live" | "expired" | "unknown";
}

const linkStatusIndicator = (status?: string) => {
  if (status === "live") return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
      <CheckCircle2 className="h-2.5 w-2.5" /> Verified
    </span>
  );
  if (status === "expired") return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
      <AlertTriangle className="h-2.5 w-2.5" /> Expired
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-muted text-muted-foreground border">
      <LinkIcon className="h-2.5 w-2.5" /> Unverified
    </span>
  );
};

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: Math.min(i * 0.03, 0.6) } });

const workModeIcon = (mode: string) => {
  if (mode === "Remote") return <Wifi className="h-3 w-3" />;
  if (mode === "Hybrid") return <Globe className="h-3 w-3" />;
  return <Monitor className="h-3 w-3" />;
};
const workModeColor = (mode: string) => {
  if (mode === "Remote") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  if (mode === "Hybrid") return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
  return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
};
const matchColor = (score: number) => {
  if (score >= 85) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 70) return "text-blue-600 dark:text-blue-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
};
const matchBg = (score: number) => {
  if (score >= 85) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 70) return "bg-blue-500/10 border-blue-500/20";
  if (score >= 50) return "bg-amber-500/10 border-amber-500/20";
  return "bg-muted/50 border-border";
};
const seniorityColor = (level: string) => {
  const l = level.toLowerCase();
  if (l.includes("entry")) return "bg-sky-500/10 text-sky-600 dark:text-sky-400";
  if (l.includes("mid")) return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  if (l.includes("senior")) return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
  if (l.includes("staff") || l.includes("principal")) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
};
const companyColor = (name: string) => {
  const colors = [
    "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    "bg-purple-500/15 text-purple-600 dark:text-purple-400",
    "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
    "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

function daysAgo(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

export default function JobsForYou() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [search, setSearch] = useState("");
  const [workModeFilter, setWorkModeFilter] = useState("all");
  const [seniorityFilter, setSeniorityFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"discover" | "saved" | "scraper">("discover");
  const [savedJobsList, setSavedJobsList] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [jobNotes, setJobNotes] = useState<Record<string, string>>({});
  const [scrapeQuery, setScrapeQuery] = useState("");
  const [scrapeUrls, setScrapeUrls] = useState("");
  const [scrapedJobs, setScrapedJobs] = useState<Job[]>([]);
  const [scraping, setScraping] = useState(false);
  const [scrapeStats, setScrapeStats] = useState<{ sources: number; found: number } | null>(null);

  // Load saved jobs from DB on mount
  useEffect(() => {
    if (!user) return;
    loadSavedJobs();
  }, [user]);

  const loadSavedJobs = async () => {
    if (!user) return;
    setLoadingSaved(true);
    const { data, error } = await supabase
      .from("saved_jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setSavedJobsList(data);
      setSavedJobIds(new Set(data.map((j: any) => j.job_id)));
      const notes: Record<string, string> = {};
      data.forEach((j: any) => { if (j.notes) notes[j.job_id] = j.notes; });
      setJobNotes(notes);
    }
    setLoadingSaved(false);
  };

  const saveJob = async (job: Job) => {
    if (!user) { toast.error("Sign in to save jobs"); return; }
    if (savedJobIds.has(job.job_id)) {
      // Unsave
      await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", job.job_id);
      setSavedJobIds(prev => { const n = new Set(prev); n.delete(job.job_id); return n; });
      setSavedJobsList(prev => prev.filter(j => j.job_id !== job.job_id));
      toast.success("Removed from saved");
    } else {
      const { error } = await supabase.from("saved_jobs").insert({
        user_id: user.id,
        job_id: job.job_id,
        title: job.title,
        company: job.company,
        location: job.location,
        work_mode: job.work_mode,
        employment_type: job.employment_type || "Full-time",
        seniority: job.seniority,
        salary_range: job.salary_range,
        posted_date: job.posted_date,
        application_deadline: job.application_deadline,
        short_description: job.short_description,
        key_requirements: job.key_requirements,
        matching_skills: job.matching_skills,
        missing_skills: job.missing_skills || [],
        match_score: job.match_score,
        career_page_url: job.career_page_url,
        benefits: job.benefits || [],
        team_size: job.team_size,
        reports_to: job.reports_to,
        tech_stack: job.tech_stack || [],
        company_industry: job.company_industry,
        company_size: job.company_size,
        company_logo_letter: job.company_logo_letter,
        why_good_fit: job.why_good_fit,
        application_tips: job.application_tips,
      });
      if (error) {
        if (error.code === "23505") toast.info("Job already saved");
        else toast.error("Failed to save job");
        return;
      }
      setSavedJobIds(prev => new Set(prev).add(job.job_id));
      toast.success("Job saved!");
      loadSavedJobs();
    }
  };

  const updateJobNotes = async (jobId: string, notes: string) => {
    if (!user) return;
    setJobNotes(prev => ({ ...prev, [jobId]: notes }));
    await supabase.from("saved_jobs").update({ notes }).eq("user_id", user.id).eq("job_id", jobId);
  };

  const updateJobStatus = async (jobId: string, status: string) => {
    if (!user) return;
    const updates: any = { status };
    if (status === "applied") updates.applied_at = new Date().toISOString();
    await supabase.from("saved_jobs").update(updates).eq("user_id", user.id).eq("job_id", jobId);
    toast.success(`Status updated to ${status}`);
    loadSavedJobs();
  };

  const fetchJobs = async () => {
    if (!user) { toast.error("Sign in to find jobs"); return; }
    setLoading(true);
    setHasSearched(true);

    try {
      const [{ data: resumes }, { data: analyses }] = await Promise.all([
        supabase
          .from("saved_resumes")
          .select("resume_data")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(3),
        // Also get analysis data for richer context
        supabase
          .from("resume_analyses")
          .select("scores, ats_analysis, content_analysis, strengths, priorities")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      if (!resumes?.length) { toast.error("Upload a resume first"); setLoading(false); return; }

      const allSkills = new Set<string>();
      const allExperience: string[] = [];
      const allBullets: string[] = [];
      let title = "", summary = "", location = "";
      const industries = new Set<string>();

      for (const r of resumes) {
        const rd = r.resume_data as any;
        if (rd?.contact?.title && !title) title = rd.contact.title;
        if (rd?.contact?.location && !location) location = rd.contact.location;
        if (rd?.summary && !summary) summary = rd.summary;
        if (rd?.skills) for (const s of rd.skills) {
          if (s.items) s.items.split(",").forEach((i: string) => allSkills.add(i.trim()));
          if (s.category) allSkills.add(s.category);
        }
        if (rd?.experience) for (const exp of rd.experience) {
          allExperience.push(`${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})`);
          if (exp.bullets) allBullets.push(...exp.bullets.slice(0, 3));
        }
        if (rd?.education) for (const edu of rd.education) {
          if (edu.field) industries.add(edu.field);
        }
      }

      // Enrich with analysis data
      let analysisContext = "";
      if (analyses?.length) {
        const a = analyses[0] as any;
        if (a.strengths?.length) analysisContext += `\nKey Strengths: ${a.strengths.slice(0, 5).join("; ")}`;
        if (a.ats_analysis?.matched_keywords?.length) {
          a.ats_analysis.matched_keywords.forEach((k: string) => allSkills.add(k));
        }
      }

      const { data, error } = await supabase.functions.invoke("find-jobs", {
        body: {
          skills: Array.from(allSkills).slice(0, 40),
          title,
          summary: (summary + analysisContext).slice(0, 500),
          location,
          experience: allExperience.slice(0, 8).join("; "),
          industries: Array.from(industries).slice(0, 5),
          bulletSamples: allBullets.slice(0, 5),
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const jobList = data?.jobs || [];
      jobList.sort((a: Job, b: Job) => (b.match_score || 0) - (a.match_score || 0));
      setJobs(jobList);
      if (jobList.length > 0) toast.success(`Found ${jobList.length} matching jobs!`);
      else toast.info("No jobs found. Try updating your resume.");
    } catch (err: any) {
      console.error("Job search error:", err);
      toast.error(err.message || "Failed to find jobs");
    } finally {
      setLoading(false);
    }
  };

  const scrapeJobs = async () => {
    if (!scrapeQuery && !scrapeUrls.trim()) {
      toast.error("Enter a search query or career page URLs");
      return;
    }
    setScraping(true);
    setScrapeStats(null);

    try {
      const urls = scrapeUrls.trim() ? scrapeUrls.split("\n").map(u => u.trim()).filter(Boolean) : undefined;
      const sources = ["boards", "startups"];

      const { data, error } = await supabase.functions.invoke("scrape-jobs", {
        body: { query: scrapeQuery || undefined, urls, sources },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const scraped = data?.jobs || [];
      setScrapedJobs(scraped);
      setScrapeStats({ sources: data?.sources_scanned || 0, found: scraped.length });
      if (scraped.length > 0) toast.success(`Scraped ${scraped.length} real jobs from ${data?.sources_scanned || 0} sources!`);
      else toast.info("No jobs found in scraped pages.");
    } catch (err: any) {
      console.error("Scrape error:", err);
      toast.error(err.message || "Scraping failed");
    } finally {
      setScraping(false);
    }
  };

  const industries = useMemo(() => Array.from(new Set(jobs.map(j => j.company_industry).filter(Boolean))).sort(), [jobs]);
  const seniorities = useMemo(() => Array.from(new Set(jobs.map(j => j.seniority).filter(Boolean))).sort(), [jobs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return jobs.filter(j => {
      // Auto-filter expired links
      if (j.link_status === "expired") return false;
      if (workModeFilter !== "all" && j.work_mode !== workModeFilter) return false;
      if (seniorityFilter !== "all" && j.seniority !== seniorityFilter) return false;
      if (industryFilter !== "all" && j.company_industry !== industryFilter) return false;
      if (q) return j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.location.toLowerCase().includes(q) || j.short_description.toLowerCase().includes(q);
      return true;
    });
  }, [jobs, search, workModeFilter, seniorityFilter, industryFilter]);

  const activeFilters = (workModeFilter !== "all" ? 1 : 0) + (seniorityFilter !== "all" ? 1 : 0) + (industryFilter !== "all" ? 1 : 0) + (search ? 1 : 0);
  const clearFilters = () => { setSearch(""); setWorkModeFilter("all"); setSeniorityFilter("all"); setIndustryFilter("all"); };

  const renderJobCard = (job: Job, i: number, isSavedView = false) => {
    const isSaved = savedJobIds.has(job.job_id);
    return (
      <motion.div key={job.job_id} {...fade(i)} className="rounded-xl border bg-card p-5 card-hover group relative cursor-pointer" onClick={() => setSelectedJob(job)}>
        <button onClick={e => { e.stopPropagation(); saveJob(job); }} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary/60 transition-colors z-10">
          <Heart className={`h-4 w-4 transition-colors ${isSaved ? "fill-rose-500 text-rose-500" : "text-muted-foreground/30 group-hover:text-muted-foreground/60"}`} />
        </button>
        <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-md border text-[10px] font-bold ${matchBg(job.match_score)} ${matchColor(job.match_score)}`}>{job.match_score}% match</div>
        <div className="flex items-start gap-3 mb-3 pt-6 pr-8">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${companyColor(job.company)}`}>{job.company_logo_letter || job.company[0]}</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold leading-tight line-clamp-2">{job.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{job.company}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">{job.short_description}</p>
        <div className="p-2.5 rounded-lg bg-secondary/40 mb-3 space-y-1.5">
          <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-muted-foreground shrink-0" /><span className="text-[11px] truncate">{job.location}</span></div>
          <div className="flex items-center gap-2"><DollarSign className="h-3 w-3 text-muted-foreground shrink-0" /><span className="text-[11px] truncate">{job.salary_range}</span></div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${workModeColor(job.work_mode)}`}>{workModeIcon(job.work_mode)} {job.work_mode}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${seniorityColor(job.seniority)}`}>{job.seniority}</span>
          <Badge variant="outline" className="text-[10px] truncate max-w-[120px]">{job.company_industry}</Badge>
        </div>
        {job.matching_skills?.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {job.matching_skills.slice(0, 3).map(s => (<span key={s} className="px-1.5 py-0.5 rounded text-[9px] bg-primary/10 text-primary font-medium truncate max-w-[80px]">{s}</span>))}
            {job.matching_skills.length > 3 && <span className="text-[9px] text-muted-foreground">+{job.matching_skills.length - 3}</span>}
          </div>
        )}
        {job.posted_date && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{daysAgo(job.posted_date)}</span>
            {job.employment_type && <span className="text-[10px] text-muted-foreground ml-auto">{job.employment_type}</span>}
          </div>
        )}
        {job.career_page_url && (
          <div className="flex items-center gap-1.5 mt-2">
            {linkStatusIndicator(job.link_status)}
          </div>
        )}
      </motion.div>
    );
  };

  const savedAsJobs: Job[] = savedJobsList.map((sj: any) => ({
    job_id: sj.job_id, title: sj.title, company: sj.company,
    company_logo_letter: sj.company_logo_letter, location: sj.location,
    work_mode: sj.work_mode, employment_type: sj.employment_type,
    seniority: sj.seniority, salary_range: sj.salary_range,
    posted_date: sj.posted_date, application_deadline: sj.application_deadline,
    short_description: sj.short_description,
    key_requirements: sj.key_requirements || [], matching_skills: sj.matching_skills || [],
    missing_skills: sj.missing_skills || [], match_score: sj.match_score,
    career_page_url: sj.career_page_url, benefits: sj.benefits || [],
    team_size: sj.team_size, reports_to: sj.reports_to,
    tech_stack: sj.tech_stack || [], company_industry: sj.company_industry,
    company_size: sj.company_size, why_good_fit: sj.why_good_fit,
    application_tips: sj.application_tips,
  }));

  return (
    <AppLayout title="Jobs For You">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div {...fade(0)} className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Jobs For You
            </h1>
            <p className="text-sm text-muted-foreground">AI-powered job discovery based on your resume skills and experience.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchJobs} disabled={loading} className="gap-2" variant="premium">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Scanning...</> : <><RefreshCw className="h-4 w-4" /> {hasSearched ? "Refresh" : "Find Jobs"}</>}
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="discover" className="gap-1.5 text-xs"><Search className="h-3.5 w-3.5" /> Discover</TabsTrigger>
            <TabsTrigger value="scraper" className="gap-1.5 text-xs"><Radar className="h-3.5 w-3.5" /> Job Scraper</TabsTrigger>
            <TabsTrigger value="saved" className="gap-1.5 text-xs"><Bookmark className="h-3.5 w-3.5" /> Saved ({savedJobIds.size})</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6 mt-4">
            {/* Stats */}
            {jobs.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Jobs", value: jobs.length, icon: Briefcase, color: "text-primary" },
                  { label: "High Match (85%+)", value: jobs.filter(j => j.match_score >= 85).length, icon: Target, color: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Remote Options", value: jobs.filter(j => j.work_mode === "Remote").length, icon: Wifi, color: "text-blue-600 dark:text-blue-400" },
                  { label: "Saved", value: savedJobIds.size, icon: Heart, color: "text-rose-600 dark:text-rose-400" },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl border bg-card p-3.5 flex items-center gap-3">
                    <stat.icon className={`h-4 w-4 ${stat.color} shrink-0`} />
                    <div><p className="text-lg font-bold leading-none">{stat.value}</p><p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p></div>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            {jobs.length > 0 && (
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, company, location..." className="pl-10 text-sm" />
                  </div>
                  {activeFilters > 0 && <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-xs text-muted-foreground shrink-0"><X className="h-3.5 w-3.5" /> Clear</Button>}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <Select value={workModeFilter} onValueChange={setWorkModeFilter}>
                    <SelectTrigger className="w-[150px] h-8 text-xs"><Globe className="h-3 w-3 mr-1.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Modes</SelectItem><SelectItem value="Remote">Remote</SelectItem><SelectItem value="Hybrid">Hybrid</SelectItem><SelectItem value="On-site">On-site</SelectItem></SelectContent>
                  </Select>
                  <Select value={seniorityFilter} onValueChange={setSeniorityFilter}>
                    <SelectTrigger className="w-[160px] h-8 text-xs"><Layers className="h-3 w-3 mr-1.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Levels</SelectItem>{seniorities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger className="w-[200px] h-8 text-xs"><Building2 className="h-3 w-3 mr-1.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Industries</SelectItem>{industries.map(ind => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="ml-auto text-xs text-muted-foreground"><span className="font-semibold text-foreground">{filtered.length}</span> of <span className="font-semibold text-foreground">{jobs.length}</span></div>
                </div>
              </div>
            )}

            {/* Empty / Loading */}
            {!hasSearched && !loading && (
              <div className="rounded-2xl border-2 border-dashed bg-card/50 p-16 text-center">
                <Sparkles className="h-10 w-10 text-primary/40 mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">Discover Your Perfect Role</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">Our AI analyzes your resume to find the most relevant opportunities across top companies.</p>
                <Button onClick={fetchJobs} disabled={loading} variant="premium" className="gap-2"><Zap className="h-4 w-4" /> Start Job Discovery</Button>
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rounded-xl border bg-card p-5 animate-pulse space-y-3">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-muted" /><div className="flex-1 space-y-2"><div className="h-3.5 bg-muted rounded w-3/4" /><div className="h-2.5 bg-muted rounded w-1/2" /></div></div>
                    <div className="h-10 bg-muted rounded" /><div className="flex gap-2"><div className="h-5 bg-muted rounded-full w-16" /><div className="h-5 bg-muted rounded-full w-20" /></div>
                  </div>
                ))}
              </div>
            )}

            {!loading && hasSearched && filtered.length === 0 && jobs.length > 0 && (
              <div className="rounded-2xl border-2 border-dashed bg-card/50 p-16 text-center">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">No jobs match filters</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your search.</p>
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((job, i) => renderJobCard(job, i))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-6 mt-4">
            {savedJobsList.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed bg-card/50 p-16 text-center">
                <Bookmark className="h-8 w-8 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">No Saved Jobs</h3>
                <p className="text-sm text-muted-foreground">Discover jobs and save the ones you like.</p>
              </div>
            ) : (
              <>
                {/* Saved stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total Saved", value: savedJobsList.length, icon: Bookmark },
                    { label: "Applied", value: savedJobsList.filter((j: any) => j.status === "applied").length, icon: CheckCircle2 },
                    { label: "Interviewing", value: savedJobsList.filter((j: any) => j.status === "interviewing").length, icon: Users },
                    { label: "Avg Match", value: `${Math.round(savedJobsList.reduce((a: number, j: any) => a + (j.match_score || 0), 0) / savedJobsList.length)}%`, icon: Target },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-xl border bg-card p-3.5 flex items-center gap-3">
                      <stat.icon className="h-4 w-4 text-primary shrink-0" />
                      <div><p className="text-lg font-bold leading-none">{stat.value}</p><p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p></div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedAsJobs.map((job, i) => renderJobCard(job, i, true))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Scraper Tab */}
          <TabsContent value="scraper" className="space-y-6 mt-4">
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Radar className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-semibold">Real Job Scraper</h3>
                <Badge variant="secondary" className="text-[10px]">Powered by Firecrawl</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Search the web for real job listings or paste career page URLs to scrape directly.</p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Search Query</label>
                  <Input
                    value={scrapeQuery}
                    onChange={e => setScrapeQuery(e.target.value)}
                    placeholder="e.g. Senior React Engineer Remote"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Career Page URLs <span className="font-normal">(one per line, optional)</span></label>
                  <Textarea
                    value={scrapeUrls}
                    onChange={e => setScrapeUrls(e.target.value)}
                    placeholder={"https://careers.google.com\nhttps://stripe.com/jobs"}
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>
              </div>

              <Button onClick={scrapeJobs} disabled={scraping} variant="premium" className="gap-2">
                {scraping ? <><Loader2 className="h-4 w-4 animate-spin" /> Scraping web sources…</> : <><Radar className="h-4 w-4" /> Scrape Real Jobs</>}
              </Button>
            </div>

            {scrapeStats && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border bg-card p-3.5 flex items-center gap-3">
                  <Globe className="h-4 w-4 text-primary shrink-0" />
                  <div><p className="text-lg font-bold leading-none">{scrapeStats.sources}</p><p className="text-[10px] text-muted-foreground mt-0.5">Sources Scanned</p></div>
                </div>
                <div className="rounded-xl border bg-card p-3.5 flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-primary shrink-0" />
                  <div><p className="text-lg font-bold leading-none">{scrapeStats.found}</p><p className="text-[10px] text-muted-foreground mt-0.5">Jobs Found</p></div>
                </div>
              </div>
            )}

            {scraping && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border bg-card p-5 animate-pulse space-y-3">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-muted" /><div className="flex-1 space-y-2"><div className="h-3.5 bg-muted rounded w-3/4" /><div className="h-2.5 bg-muted rounded w-1/2" /></div></div>
                    <div className="h-10 bg-muted rounded" /><div className="flex gap-2"><div className="h-5 bg-muted rounded-full w-16" /><div className="h-5 bg-muted rounded-full w-20" /></div>
                  </div>
                ))}
              </div>
            )}

            {!scraping && scrapedJobs.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scrapedJobs.map((job, i) => (
                    <motion.div key={job.job_id} {...fade(i)} className="rounded-xl border bg-card p-5 card-hover group relative cursor-pointer" onClick={() => setSelectedJob(job)}>
                      {job.apply_url && (
                        <a href={job.apply_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary/60 transition-colors z-10">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      )}
                      <div className="flex items-start gap-3 mb-3 pr-8">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${companyColor(job.company)}`}>{job.company_logo_letter || job.company[0]}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold leading-tight line-clamp-2">{job.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{job.company}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">{job.short_description}</p>
                      <div className="p-2.5 rounded-lg bg-secondary/40 mb-3 space-y-1.5">
                        <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-muted-foreground shrink-0" /><span className="text-[11px] truncate">{job.location}</span></div>
                        {job.salary_range && job.salary_range !== "Not disclosed" && (
                          <div className="flex items-center gap-2"><DollarSign className="h-3 w-3 text-muted-foreground shrink-0" /><span className="text-[11px] truncate">{job.salary_range}</span></div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">Scraped</Badge>
                        {job.work_mode && <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${workModeColor(job.work_mode)}`}>{workModeIcon(job.work_mode)} {job.work_mode}</span>}
                        {job.seniority && <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${seniorityColor(job.seniority)}`}>{job.seniority}</span>}
                      </div>
                      {job.key_requirements?.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mt-2">
                          {job.key_requirements.slice(0, 3).map(r => (<span key={r} className="px-1.5 py-0.5 rounded text-[9px] bg-secondary text-secondary-foreground font-medium truncate max-w-[100px]">{r}</span>))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {!scraping && scrapedJobs.length === 0 && scrapeStats && (
              <div className="rounded-2xl border-2 border-dashed bg-card/50 p-12 text-center">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">No jobs found</h3>
                <p className="text-sm text-muted-foreground">Try different search terms or paste specific career page URLs.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Job Detail Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={open => { if (!open) setSelectedJob(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold shrink-0 ${companyColor(selectedJob.company)}`}>{selectedJob.company_logo_letter || selectedJob.company[0]}</div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-lg leading-tight">{selectedJob.title}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">{selectedJob.company}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-md border text-xs font-bold ${matchBg(selectedJob.match_score)} ${matchColor(selectedJob.match_score)}`}>{selectedJob.match_score}% Match</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${workModeColor(selectedJob.work_mode)}`}>{workModeIcon(selectedJob.work_mode)} {selectedJob.work_mode}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${seniorityColor(selectedJob.seniority)}`}>{selectedJob.seniority}</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="w-full">
                  <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                  <TabsTrigger value="requirements" className="flex-1">Requirements</TabsTrigger>
                  <TabsTrigger value="fit" className="flex-1">Your Fit</TabsTrigger>
                  {savedJobIds.has(selectedJob.job_id) && <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>}
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedJob.short_description}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: MapPin, label: "Location", value: selectedJob.location },
                      { icon: DollarSign, label: "Salary", value: selectedJob.salary_range },
                      { icon: Building2, label: "Industry", value: selectedJob.company_industry },
                      { icon: Users, label: "Company Size", value: selectedJob.company_size },
                      { icon: UserCircle, label: "Reports To", value: selectedJob.reports_to },
                      { icon: Users, label: "Team Size", value: selectedJob.team_size },
                      { icon: Calendar, label: "Posted", value: daysAgo(selectedJob.posted_date) },
                      { icon: Clock, label: "Deadline", value: selectedJob.application_deadline },
                    ].filter(item => item.value).map(item => (
                      <div key={item.label} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/40">
                        <item.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</p><p className="text-xs font-medium">{item.value}</p></div>
                      </div>
                    ))}
                  </div>
                  {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                    <div><h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Benefits</h4><div className="flex flex-wrap gap-2">{selectedJob.benefits.map(b => (<span key={b} className="px-2.5 py-1 rounded-lg bg-primary/5 text-xs text-primary border border-primary/10">{b}</span>))}</div></div>
                  )}
                  {selectedJob.tech_stack && selectedJob.tech_stack.length > 0 && (
                    <div><h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Tech Stack</h4><div className="flex flex-wrap gap-2">{selectedJob.tech_stack.map(t => (<Badge key={t} variant="outline" className="text-[11px]">{t}</Badge>))}</div></div>
                  )}
                  <p className="text-[10px] text-muted-foreground">Job ID: {selectedJob.job_id}</p>
                </TabsContent>

                <TabsContent value="requirements" className="space-y-4 mt-4">
                  {selectedJob.key_requirements?.length > 0 && (
                    <div><h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Key Requirements</h4><div className="space-y-2">{selectedJob.key_requirements.map((req, i) => (<div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/30"><ChevronRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span className="text-sm">{req}</span></div>))}</div></div>
                  )}
                </TabsContent>

                <TabsContent value="fit" className="space-y-4 mt-4">
                  {selectedJob.why_good_fit && (<div className="p-3 rounded-lg bg-primary/5 border border-primary/10"><h4 className="text-xs font-semibold flex items-center gap-1.5 mb-1"><Star className="h-3.5 w-3.5 text-primary" /> Why You're a Good Fit</h4><p className="text-sm text-muted-foreground">{selectedJob.why_good_fit}</p></div>)}
                  {selectedJob.matching_skills?.length > 0 && (<div><h4 className="text-xs font-semibold flex items-center gap-1.5 mb-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Matching Skills</h4><div className="flex flex-wrap gap-2">{selectedJob.matching_skills.map(s => (<span key={s} className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{s}</span>))}</div></div>)}
                  {selectedJob.missing_skills && selectedJob.missing_skills.length > 0 && (<div><h4 className="text-xs font-semibold flex items-center gap-1.5 mb-2"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Skills to Develop</h4><div className="flex flex-wrap gap-2">{selectedJob.missing_skills.map(s => (<span key={s} className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">{s}</span>))}</div></div>)}
                  {selectedJob.application_tips && (<div className="p-3 rounded-lg bg-secondary/40"><h4 className="text-xs font-semibold flex items-center gap-1.5 mb-1"><BookOpen className="h-3.5 w-3.5 text-muted-foreground" /> Application Tips</h4><p className="text-sm text-muted-foreground">{selectedJob.application_tips}</p></div>)}
                </TabsContent>

                {savedJobIds.has(selectedJob.job_id) && (
                  <TabsContent value="notes" className="space-y-4 mt-4">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Status</h4>
                      <div className="flex gap-2 flex-wrap">
                        {["saved", "applied", "interviewing", "offered", "rejected"].map(status => {
                          const current = savedJobsList.find((j: any) => j.job_id === selectedJob.job_id)?.status;
                          return (
                            <Button key={status} variant={current === status ? "default" : "outline"} size="sm" className="text-xs capitalize" onClick={() => updateJobStatus(selectedJob.job_id, status)}>
                              {status}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Notes</h4>
                      <Textarea
                        value={jobNotes[selectedJob.job_id] || ""}
                        onChange={e => setJobNotes(prev => ({ ...prev, [selectedJob.job_id]: e.target.value }))}
                        onBlur={() => updateJobNotes(selectedJob.job_id, jobNotes[selectedJob.job_id] || "")}
                        placeholder="Add notes about this job..."
                        rows={4}
                        className="text-sm"
                      />
                    </div>
                  </TabsContent>
                )}
              </Tabs>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                {selectedJob.career_page_url && (
                  <div className="flex items-center gap-2 flex-1">
                    <Button asChild className={`gap-2 flex-1 ${selectedJob.link_status === "expired" ? "opacity-60" : ""}`}>
                      <a href={selectedJob.career_page_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" /> 
                        {selectedJob.link_status === "expired" ? "Link May Be Expired" : "Apply"}
                      </a>
                    </Button>
                    {linkStatusIndicator(selectedJob.link_status)}
                  </div>
                )}
                <Button variant="outline" className="gap-2" onClick={() => saveJob(selectedJob)}>
                  <Heart className={`h-4 w-4 ${savedJobIds.has(selectedJob.job_id) ? "fill-rose-500 text-rose-500" : ""}`} />
                  {savedJobIds.has(selectedJob.job_id) ? "Saved" : "Save"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
