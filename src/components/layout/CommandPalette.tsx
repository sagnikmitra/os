import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Upload, Shield, FileSearch, Eye, Type, Bot, Briefcase, Layers, PenTool,
  FileText, Settings, Hammer, Home, FolderOpen, Download, GitBranch, Target, BarChart3,
  Mail, GraduationCap, Users, TrendingUp, BookOpen, Fingerprint, DollarSign, UserCircle, Sparkles, Route, Map, Rocket, Bell,
  Kanban, MailCheck, Building2, Network, Mic, Star, BadgeDollarSign, Scale, GitFork, Grid3X3, Newspaper, Linkedin, MessageSquare, Heart, FlaskConical, FileSignature, BookMarked, User,
  ArrowRight, Search, Command,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OPEN_COMMAND_PALETTE_EVENT } from "./command-palette-events";

const RECENT_KEY = "sgnk_recent_pages";
const MAX_RECENT = 5;

const groupMeta: Record<string, { color: string; bg: string }> = {
  Core: { color: "text-primary", bg: "bg-primary/10" },
  Resumes: { color: "text-blue-500", bg: "bg-blue-500/10" },
  Analyze: { color: "text-amber-500", bg: "bg-amber-500/10" },
  Jobs: { color: "text-emerald-500", bg: "bg-emerald-500/10" },
  Interview: { color: "text-violet-500", bg: "bg-violet-500/10" },
  Outreach: { color: "text-rose-500", bg: "bg-rose-500/10" },
  Growth: { color: "text-cyan-500", bg: "bg-cyan-500/10" },
  System: { color: "text-muted-foreground", bg: "bg-muted" },
};

const allRoutes = [
  { title: "Dashboard", url: "/dashboard", icon: Home, group: "Core", desc: "Overview & quick actions" },
  { title: "Upload Resume", url: "/upload", icon: Upload, group: "Core", desc: "Upload & analyze your resume" },
  { title: "My Resumes", url: "/my-resumes", icon: FolderOpen, group: "Resumes", desc: "View & manage saved resumes" },
  { title: "Profile Hub", url: "/profile-hub", icon: UserCircle, group: "Resumes", desc: "Candidate profiles" },
  { title: "Resume Builder", url: "/builder", icon: Hammer, group: "Resumes", desc: "Build from scratch or template" },
  { title: "Compare Versions", url: "/compare", icon: GitBranch, group: "Resumes", desc: "Side-by-side version compare" },
  { title: "ATS Score", url: "/ats", icon: Shield, group: "Analyze", desc: "ATS compatibility check" },
  { title: "Parsing Analysis", url: "/parsing", icon: FileSearch, group: "Analyze", desc: "Parser extraction accuracy" },
  { title: "Recruiter View", url: "/recruiter", icon: Eye, group: "Analyze", desc: "How recruiters see your resume" },
  { title: "Content Quality", url: "/content", icon: Type, group: "Analyze", desc: "Writing quality & impact" },
  { title: "Structure", url: "/structure", icon: Layers, group: "Analyze", desc: "Layout & section analysis" },
  { title: "Humanizer", url: "/humanizer", icon: Bot, group: "Analyze", desc: "AI-detection & tone check" },
  { title: "Improvement Roadmap", url: "/improvement-roadmap", icon: Route, group: "Analyze", desc: "Step-by-step improvement plan" },
  { title: "Jobs For You", url: "/jobs-for-you", icon: Sparkles, group: "Jobs", desc: "AI-matched job listings" },
  { title: "Job Alerts", url: "/job-alerts", icon: Bell, group: "Jobs", desc: "Automated job notifications" },
  { title: "Application Tracker", url: "/application-tracker", icon: Kanban, group: "Jobs", desc: "Track application status" },
  { title: "Company Research", url: "/company-research", icon: Building2, group: "Jobs", desc: "Research target companies" },
  { title: "Smart Recommendations", url: "/smart-recommendations", icon: Rocket, group: "Jobs", desc: "Personalized suggestions" },
  { title: "Job Roadmap", url: "/job-getting-roadmap", icon: Map, group: "Jobs", desc: "Strategic job search plan" },
  { title: "Job Match", url: "/job-match", icon: Briefcase, group: "Jobs", desc: "Match resume to job" },
  { title: "JD Tailoring", url: "/jd-tailor", icon: Target, group: "Jobs", desc: "Tailor resume to JD" },
  { title: "Rewrites", url: "/rewrites", icon: PenTool, group: "Jobs", desc: "AI-powered bullet rewrites" },
  { title: "Market Digest", url: "/market-digest", icon: Newspaper, group: "Jobs", desc: "Job market insights" },
  { title: "Interview Prep", url: "/interview-prep", icon: GraduationCap, group: "Interview", desc: "Prepare for interviews" },
  { title: "Mock Interview", url: "/mock-interview", icon: Mic, group: "Interview", desc: "Practice with AI interviewer" },
  { title: "STAR Builder", url: "/star-builder", icon: Star, group: "Interview", desc: "Build STAR responses" },
  { title: "Salary Benchmark", url: "/salary-benchmark", icon: BadgeDollarSign, group: "Interview", desc: "Market salary data" },
  { title: "Offer Comparison", url: "/offer-comparison", icon: Scale, group: "Interview", desc: "Compare job offers" },
  { title: "Salary Negotiation", url: "/salary-negotiation", icon: DollarSign, group: "Interview", desc: "Negotiation strategies" },
  { title: "Cover Letter", url: "/cover-letter", icon: Mail, group: "Outreach", desc: "Generate cover letters" },
  { title: "Follow-Up Email", url: "/follow-up-email", icon: MailCheck, group: "Outreach", desc: "Post-interview follow-ups" },
  { title: "Thank You Note", url: "/thank-you-note", icon: Heart, group: "Outreach", desc: "Interview thank-you notes" },
  { title: "Elevator Pitch", url: "/elevator-pitch", icon: MessageSquare, group: "Outreach", desc: "Craft your pitch" },
  { title: "Cold Email A/B", url: "/cold-email", icon: FlaskConical, group: "Outreach", desc: "A/B test cold emails" },
  { title: "Referral Mapper", url: "/referral-mapper", icon: Network, group: "Outreach", desc: "Map referral connections" },
  { title: "Reference Letter", url: "/reference-letter", icon: FileSignature, group: "Outreach", desc: "Draft reference letters" },
  { title: "Bio Generator", url: "/bio-generator", icon: User, group: "Outreach", desc: "Generate professional bios" },
  { title: "Case Study", url: "/case-study", icon: BookMarked, group: "Outreach", desc: "Build case studies" },
  { title: "Career Intelligence", url: "/career-intelligence", icon: TrendingUp, group: "Growth", desc: "Career trend insights" },
  { title: "Career Path", url: "/career-path", icon: GitFork, group: "Growth", desc: "Visualize career paths" },
  { title: "Skill Gap Heatmap", url: "/skill-gap", icon: Grid3X3, group: "Growth", desc: "Identify skill gaps" },
  { title: "LinkedIn Optimizer", url: "/linkedin-optimizer", icon: Linkedin, group: "Growth", desc: "Optimize LinkedIn profile" },
  { title: "Learning Roadmap", url: "/learning-roadmap", icon: BookOpen, group: "Growth", desc: "Personalized learning plan" },
  { title: "Personal Branding", url: "/personal-branding", icon: Fingerprint, group: "Growth", desc: "Build your brand" },
  { title: "Export Center", url: "/export", icon: Download, group: "System", desc: "Export & download" },
  { title: "Reports", url: "/reports", icon: FileText, group: "System", desc: "Generate reports" },
  { title: "HR Hub", url: "/hr-hub", icon: Users, group: "System", desc: "HR recruiter database" },
  { title: "Analytics", url: "/analytics", icon: BarChart3, group: "System", desc: "Usage analytics" },
  { title: "Settings", url: "/settings", icon: Settings, group: "System", desc: "App settings" },
];

const groups = ["Core", "Resumes", "Analyze", "Jobs", "Interview", "Outreach", "Growth", "System"];

function getRecentPages(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch { return []; }
}

function addRecentPage(url: string) {
  const recent = getRecentPages().filter((u) => u !== url);
  recent.unshift(url);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

type RouteItem = (typeof allRoutes)[number];

function PaletteRouteItem({
  item,
  active,
  onSelect,
  showGroupBadge = false,
}: {
  item: RouteItem;
  active: boolean;
  onSelect: (url: string) => void;
  showGroupBadge?: boolean;
}) {
  const meta = groupMeta[item.group];

  return (
    <CommandItem
      value={`${item.title} ${item.group} ${item.desc}`}
      onSelect={() => onSelect(item.url)}
      className={cn(
        "group/route cursor-pointer gap-3 rounded-xl border px-3 py-2 transition-all duration-150",
        active
          ? "border-primary/20 bg-primary/8 text-primary"
          : "border-transparent text-foreground/90 hover:border-border/70 hover:bg-accent/45"
      )}
    >
      <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg shrink-0", meta.bg)}>
        <item.icon className={cn("h-4 w-4", meta.color)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{item.title}</span>
          {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
        </div>
        <p className="truncate text-[11px] text-muted-foreground/75">{item.desc}</p>
      </div>

      {showGroupBadge ? (
        <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold", meta.bg, meta.color)}>
          {item.group}
        </span>
      ) : (
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 opacity-0 transition-all duration-150 group-data-[selected=true]/route:translate-x-0.5 group-data-[selected=true]/route:opacity-100" />
      )}
    </CommandItem>
  );
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/") {
      addRecentPage(location.pathname);
    }
  }, [location.pathname]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const openPalette = () => setOpen(true);
    document.addEventListener("keydown", down);
    document.addEventListener(OPEN_COMMAND_PALETTE_EVENT, openPalette);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, openPalette);
    };
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const handleSelect = useCallback((url: string) => {
    setOpen(false);
    navigate(url);
  }, [navigate]);

  const recentPages = useMemo(() => {
    const urls = getRecentPages();
    return urls
      .map((url) => allRoutes.find((r) => r.url === url))
      .filter(Boolean) as typeof allRoutes;
  }, [open]);

  const isSearching = query.trim().length > 0;
  const recentSet = useMemo(() => new Set(recentPages.map((r) => r.url)), [recentPages]);
  const groupedRoutes = useMemo(() => {
    return groups
      .map((group) => {
        let items = allRoutes.filter((route) => route.group === group);
        if (!isSearching) {
          items = items.filter((route) => !recentSet.has(route.url));
        }
        return { group, items };
      })
      .filter(({ items }) => items.length > 0);
  }, [isSearching, recentSet]);

  const isActive = (url: string) => location.pathname === url;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search pages, tools, and features..."
        className="h-12 text-sm"
      />

      <CommandList className="max-h-[min(68vh,560px)] scroll-smooth py-1">
        <CommandEmpty>
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <Search className="h-4 w-4 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground/70">No results found</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Try a different keyword or browse below</p>
            </div>
          </div>
        </CommandEmpty>

        {/* Recent */}
        {!isSearching && recentPages.length > 0 && (
          <div className="hidden md:block">
            <CommandGroup heading="Recent">
              {recentPages.map((item) => {
                return (
                  <PaletteRouteItem
                    key={`recent-${item.url}`}
                    item={item}
                    active={isActive(item.url)}
                    onSelect={handleSelect}
                    showGroupBadge
                  />
                );
              })}
            </CommandGroup>
            <CommandSeparator className="my-1.5" />
          </div>
        )}

        {/* All groups */}
        {groupedRoutes.map(({ group, items }, i) => {
          return (
            <div key={group}>
              {i > 0 && <CommandSeparator className="my-1.5" />}
              <CommandGroup heading={group}>
                {items.map((item) => {
                  return (
                    <PaletteRouteItem
                      key={item.url}
                      item={item}
                      active={isActive(item.url)}
                      onSelect={handleSelect}
                    />
                  );
                })}
              </CommandGroup>
            </div>
          );
        })}
      </CommandList>

      {/* Footer */}
      <div className="border-t border-border/50 bg-card/35 px-4 py-2.5 text-[10px] text-muted-foreground/65">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3.5">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold">↑↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold">↵</kbd>
              <span>open</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold">esc</kbd>
              <span>close</span>
            </span>
          </div>
          <span className="hidden items-center gap-1.5 sm:flex">
            <Command className="h-3.5 w-3.5" />
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold">K</kbd>
            <span>toggle</span>
          </span>
        </div>
      </div>
    </CommandDialog>
  );
}
