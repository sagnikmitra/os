import { ThemeToggle } from "@/components/ThemeToggle";
import { ActiveResumeDropdownCompact } from "./ActiveResumeDropdown";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Home, ArrowLeft, Search, Shield, FileSearch, Eye, Type, Layers, Bot, Route,
  Briefcase, Target, PenTool, Sparkles, Bell, Kanban, Building2, Newspaper,
  Rocket, Map, GraduationCap, Mic, Star, BadgeDollarSign, Scale, DollarSign,
  Mail, MailCheck, Heart, FlaskConical, MessageSquare, Network, FileSignature,
  TrendingUp, GitFork, Grid3X3, BookOpen, Linkedin, Fingerprint, User,
  BookMarked, Download, FileText, Users, BarChart3, Settings, Hammer,
  FolderOpen, Upload as UploadIcon, ChevronRight, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCommandPalette } from "./command-palette-events";
import { PageTransition } from "./PageTransition";
import { useState, useEffect } from "react";

interface RouteInfo {
  label: string;
  icon?: any;
  group?: { label: string; url: string };
}

const routeMap: Record<string, RouteInfo> = {
  "/dashboard": { label: "Home", icon: Home },
  "/upload": { label: "Upload & Analyze", icon: UploadIcon },
  "/my-resumes": { label: "My Resumes", icon: FolderOpen, group: { label: "Build", url: "/builder" } },
  "/builder": { label: "Resume Builder", icon: Hammer, group: { label: "Build", url: "/builder" } },
  "/profile-hub": { label: "Profiles", icon: User, group: { label: "Build", url: "/builder" } },
  "/compare": { label: "Compare Versions", icon: GitFork, group: { label: "Build", url: "/builder" } },
  "/templates": { label: "Templates", icon: Layers, group: { label: "Build", url: "/builder" } },
  "/portfolios": { label: "Portfolios", icon: BookMarked, group: { label: "Build", url: "/builder" } },
  "/ats": { label: "ATS Score", icon: Shield, group: { label: "Analysis", url: "/upload" } },
  "/parsing": { label: "Parsing Check", icon: FileSearch, group: { label: "Analysis", url: "/upload" } },
  "/recruiter": { label: "Recruiter View", icon: Eye, group: { label: "Analysis", url: "/upload" } },
  "/content": { label: "Content Quality", icon: Type, group: { label: "Analysis", url: "/upload" } },
  "/structure": { label: "Structure", icon: Layers, group: { label: "Analysis", url: "/upload" } },
  "/humanizer": { label: "AI Detection", icon: Bot, group: { label: "Analysis", url: "/upload" } },
  "/reports": { label: "Full Report", icon: FileText, group: { label: "Analysis", url: "/upload" } },
  "/improvement-roadmap": { label: "Fix Roadmap", icon: Route, group: { label: "Analysis", url: "/upload" } },
  "/jobs-for-you": { label: "Jobs For You", icon: Sparkles, group: { label: "Jobs", url: "/jobs-for-you" } },
  "/job-alerts": { label: "Job Alerts", icon: Bell, group: { label: "Jobs", url: "/jobs-for-you" } },
  "/application-tracker": { label: "Applications", icon: Kanban, group: { label: "Jobs", url: "/jobs-for-you" } },
  "/job-match": { label: "Job Match", icon: Briefcase, group: { label: "Jobs", url: "/jobs-for-you" } },
  "/jd-tailor": { label: "JD Tailoring", icon: Target, group: { label: "Jobs", url: "/jobs-for-you" } },
  "/rewrites": { label: "Rewrites", icon: PenTool, group: { label: "Jobs", url: "/jobs-for-you" } },
  "/company-research": { label: "Company Intel", icon: Building2, group: { label: "Research", url: "/company-research" } },
  "/market-digest": { label: "Market Digest", icon: Newspaper, group: { label: "Research", url: "/company-research" } },
  "/smart-recommendations": { label: "Recommendations", icon: Rocket, group: { label: "Research", url: "/company-research" } },
  "/job-getting-roadmap": { label: "Job Roadmap", icon: Map, group: { label: "Research", url: "/company-research" } },
  "/interview-prep": { label: "Question Prep", icon: GraduationCap, group: { label: "Interview", url: "/interview-prep" } },
  "/mock-interview": { label: "Mock Interview", icon: Mic, group: { label: "Interview", url: "/interview-prep" } },
  "/star-builder": { label: "STAR Stories", icon: Star, group: { label: "Interview", url: "/interview-prep" } },
  "/salary-benchmark": { label: "Salary Data", icon: BadgeDollarSign, group: { label: "Salary", url: "/salary-benchmark" } },
  "/offer-comparison": { label: "Compare Offers", icon: Scale, group: { label: "Salary", url: "/salary-benchmark" } },
  "/salary-negotiation": { label: "Negotiation", icon: DollarSign, group: { label: "Salary", url: "/salary-benchmark" } },
  "/cover-letter": { label: "Cover Letter", icon: Mail, group: { label: "Outreach", url: "/cover-letter" } },
  "/follow-up-email": { label: "Follow-Up", icon: MailCheck, group: { label: "Outreach", url: "/cover-letter" } },
  "/thank-you-note": { label: "Thank You", icon: Heart, group: { label: "Outreach", url: "/cover-letter" } },
  "/cold-email": { label: "Cold Email A/B", icon: FlaskConical, group: { label: "Outreach", url: "/cover-letter" } },
  "/elevator-pitch": { label: "Elevator Pitch", icon: MessageSquare, group: { label: "Outreach", url: "/cover-letter" } },
  "/referral-mapper": { label: "Referral Map", icon: Network, group: { label: "Outreach", url: "/cover-letter" } },
  "/reference-letter": { label: "Reference Letter", icon: FileSignature, group: { label: "Outreach", url: "/cover-letter" } },
  "/career-intelligence": { label: "Career Intel", icon: TrendingUp, group: { label: "Growth", url: "/career-intelligence" } },
  "/career-path": { label: "Career Path", icon: GitFork, group: { label: "Growth", url: "/career-intelligence" } },
  "/skill-gap": { label: "Skill Gap Map", icon: Grid3X3, group: { label: "Growth", url: "/career-intelligence" } },
  "/learning-roadmap": { label: "Learning Path", icon: BookOpen, group: { label: "Growth", url: "/career-intelligence" } },
  "/linkedin-optimizer": { label: "LinkedIn", icon: Linkedin, group: { label: "Growth", url: "/career-intelligence" } },
  "/personal-branding": { label: "Branding", icon: Fingerprint, group: { label: "Growth", url: "/career-intelligence" } },
  "/bio-generator": { label: "Bio Generator", icon: User, group: { label: "Growth", url: "/career-intelligence" } },
  "/case-study": { label: "Case Study", icon: BookMarked, group: { label: "Growth", url: "/career-intelligence" } },
  "/export": { label: "Export Center", icon: Download },
  "/analytics": { label: "Analytics", icon: BarChart3 },
  "/hr-hub": { label: "HR Hub", icon: Users },
  "/features": { label: "All Features", icon: Sparkles },
  "/help": { label: "Help & Guide", icon: BookOpen },
  "/settings": { label: "Settings", icon: Settings },
  "/install": { label: "Install App", icon: Download },
  "/notifications": { label: "Notifications", icon: Bell },
  "/activity": { label: "Activity Log", icon: BarChart3 },
};

function getRecentPages(): string[] {
  try { return JSON.parse(localStorage.getItem("sgnk_recent_pages") || "[]"); }
  catch { return []; }
}

export default function AppLayout({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { open: openSearch } = useCommandPalette();
  const route = routeMap[pathname];
  const pageLabel = route?.label || title;
  const PageIcon = route?.icon;
  const group = route?.group;
  const isHome = pathname === "/dashboard";
  const canGoBack = !isHome && window.history.length > 1;

  const [recentChips, setRecentChips] = useState<{ url: string; label: string; icon?: any }[]>([]);
  useEffect(() => {
    const recents = getRecentPages()
      .filter(u => u !== pathname && routeMap[u])
      .slice(0, 3)
      .map(u => ({ url: u, label: routeMap[u].label, icon: routeMap[u].icon }));
    setRecentChips(recents);
  }, [pathname]);

  return (
    <>
      {/* ── Top bar ── */}
      <header className="hidden md:flex h-14 items-center justify-between border-b border-sidebar-border/40 bg-sidebar backdrop-blur-xl px-4 lg:px-6 sticky top-0 z-20">
        <div className="flex items-center gap-2 shrink-0">
          {canGoBack && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground/60 hover:bg-secondary/80 hover:text-foreground transition-all"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Go back</TooltipContent>
            </Tooltip>
          )}

          <nav className="flex items-center min-w-0 overflow-hidden gap-1" aria-label="Breadcrumb">
            <div className="flex min-w-0 items-center gap-1 rounded-2xl border border-border/40 bg-card/45 px-2.5 h-9 shadow-sm">
              {!isHome && (
                <Link
                  to="/dashboard"
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1 rounded-md hover:bg-secondary/60"
                >
                  <Home className="h-3.5 w-3.5" />
                </Link>
              )}

              {group && !isHome && (
                <>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                  <Link
                    to={group.url}
                    className="hidden lg:inline text-[11px] text-muted-foreground hover:text-foreground transition-colors truncate px-1.5 py-0.5 rounded-md hover:bg-secondary/60 font-medium tracking-tight"
                  >
                    {group.label}
                  </Link>
                </>
              )}

              {pageLabel && (
                <>
                  {!isHome && <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />}
                  <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-bold text-foreground truncate px-3 h-7 rounded-lg bg-secondary/40 border border-border/30 shadow-sm">
                    {PageIcon && <PageIcon className="h-3.5 w-3.5 text-primary shrink-0 opacity-80" />}
                    <span className="truncate">{pageLabel}</span>
                  </span>
                </>
              )}
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          {/* ── Search Bar ── */}
          <div className="flex items-center">
            <button
              onClick={openSearch}
              className="flex items-center gap-3 w-[260px] lg:w-[320px] px-3.5 h-9 rounded-2xl border border-sidebar-border/50 bg-background/40 text-muted-foreground/60 transition-all hover:bg-background/60 hover:border-sidebar-primary/30 group shadow-inner"
            >
              <Search className="h-4 w-4 transition-colors group-hover:text-sidebar-primary" />
              <span className="text-[12px] font-medium tracking-tight flex-1 text-left truncate">Search resources...</span>
              <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded-md border border-sidebar-border/40 bg-sidebar/50 px-1.5 font-mono text-[9px] text-muted-foreground/50">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          {recentChips.length > 0 && (
            <div className="hidden xl:flex items-center gap-0.5 shrink-0 rounded-2xl border border-border/65 bg-card/75 px-2 h-9">
              <Clock className="h-3.5 w-3.5 text-muted-foreground/35 mr-1 shrink-0" />
              {recentChips.map((chip) => {
                const ChipIcon = chip.icon;
                return (
                  <Tooltip key={chip.url}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => navigate(chip.url)}
                        className="flex items-center justify-center h-7 w-7 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-secondary/80 transition-colors"
                      >
                        {ChipIcon && <ChipIcon className="h-3.5 w-3.5" />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">{chip.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          )}

          <div className="w-[180px] lg:w-[220px]">
            <ActiveResumeDropdownCompact />
          </div>

          <div className="flex items-center gap-1 rounded-2xl border border-sidebar-border/50 bg-sidebar/60 p-1 h-9 shadow-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/notifications">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-muted-foreground/70 hover:bg-sidebar-primary hover:text-sidebar-primary-foreground transition-all"
                  >
                    <Bell className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Notifications</TooltipContent>
            </Tooltip>
            <div className="w-px h-3.5 bg-sidebar-border/30 mx-0.5" />
            <ThemeToggle className="h-7 w-7 rounded-lg" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto scrollbar-thin min-h-0 relative">
        <div className="flex flex-col" style={{ minHeight: "100%" }}>
          <PageTransition className="flex-1">
            {children}
          </PageTransition>

          <footer className="hidden md:block border-t border-border/60 bg-background/80 py-2 px-6 shrink-0">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/85">
              <span>sgnk CareerOS</span>
              <span className="text-muted-foreground/40">·</span>
              <span>Built by Sagnik Mitra</span>
              <span className="text-muted-foreground/40">·</span>
              <a href="https://sgnk.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">sgnk.ai</a>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
