import {
  Upload,
  Shield,
  Briefcase,
  Layers,
  PenTool,
  Settings,
  Hammer,
  Home,
  FolderOpen,
  Download,
  GitBranch,
  Target,
  LogOut,
  Mail,
  GraduationCap,
  ChevronDown,
  TrendingUp,
  BookOpen,
  Fingerprint,
  DollarSign,
  UserCircle,
  Sparkles,
  Bell,
  Kanban,
  MailCheck,
  Building2,
  Network,
  Mic,
  Star,
  BadgeDollarSign,
  Scale,
  GitFork,
  Grid3X3,
  Newspaper,
  Linkedin,
  MessageSquare,
  Heart,
  FlaskConical,
  FileSignature,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  Palette,
  HelpCircle,
  X,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCommandPalette } from "./command-palette-events";
import { LucideIcon } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ActiveResumeSidebar } from "./ActiveResumeDropdown";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

const topItems: NavItem[] = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Upload & Analyze", url: "/upload", icon: Upload },
  { title: "Analysis Dashboard", url: "/analysis", icon: Shield },
  { title: "My Resumes", url: "/my-resumes", icon: FolderOpen },
];

const navGroups: NavGroup[] = [
  {
    label: "Build & Edit",
    icon: Hammer,
    items: [
      { title: "Resume Builder", url: "/builder", icon: Hammer },
      { title: "Templates", url: "/templates", icon: Palette },
      { title: "Compare Versions", url: "/compare", icon: GitBranch },
      { title: "Profiles", url: "/profile-hub", icon: UserCircle },
      { title: "Portfolios", url: "/portfolios", icon: Layers },
    ],
  },
  {
    label: "Jobs & Matching",
    icon: Briefcase,
    items: [
      { title: "Jobs For You", url: "/jobs-for-you", icon: Sparkles },
      { title: "Job Match", url: "/job-match", icon: Briefcase },
      { title: "JD Tailoring", url: "/jd-tailor", icon: Target },
      { title: "Rewrites", url: "/rewrites", icon: PenTool },
      { title: "Applications", url: "/application-tracker", icon: Kanban },
      { title: "Job Alerts", url: "/job-alerts", icon: Bell },
    ],
  },
  {
    label: "Interview & Salary",
    icon: Mic,
    items: [
      { title: "Interview Prep", url: "/interview-prep", icon: GraduationCap },
      { title: "Mock Interview", url: "/mock-interview", icon: Mic },
      { title: "STAR Stories", url: "/star-builder", icon: Star },
      { title: "Salary Data", url: "/salary-benchmark", icon: BadgeDollarSign },
      { title: "Compare Offers", url: "/offer-comparison", icon: Scale },
      { title: "Negotiation", url: "/salary-negotiation", icon: DollarSign },
    ],
  },
  {
    label: "Outreach",
    icon: Mail,
    items: [
      { title: "Cover Letter", url: "/cover-letter", icon: Mail },
      { title: "Follow-Up", url: "/follow-up-email", icon: MailCheck },
      { title: "Thank You Note", url: "/thank-you-note", icon: Heart },
      { title: "Cold Email A/B", url: "/cold-email", icon: FlaskConical },
      { title: "Elevator Pitch", url: "/elevator-pitch", icon: MessageSquare },
      { title: "Referral Map", url: "/referral-mapper", icon: Network },
      { title: "Reference Letter", url: "/reference-letter", icon: FileSignature },
    ],
  },
  {
    label: "Career Growth",
    icon: TrendingUp,
    items: [
      { title: "Career Intel", url: "/career-intelligence", icon: TrendingUp },
      { title: "Career Path", url: "/career-path", icon: GitFork },
      { title: "Skill Gap Map", url: "/skill-gap", icon: Grid3X3 },
      { title: "Learning Path", url: "/learning-roadmap", icon: BookOpen },
      { title: "LinkedIn", url: "/linkedin-optimizer", icon: Linkedin },
      { title: "Branding", url: "/personal-branding", icon: Fingerprint },
      { title: "Bio Generator", url: "/bio-generator", icon: User },
      { title: "Company Intel", url: "/company-research", icon: Building2 },
      { title: "Market Digest", url: "/market-digest", icon: Newspaper },
    ],
  },
];

const settingsMenuItems: NavItem[] = [
  { title: "Export", url: "/export", icon: Download },
  { title: "All Features", url: "/features", icon: Sparkles },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: HelpCircle },
];

function SidebarTopItem({ item, isActive, mobile = false }: { item: NavItem; isActive: boolean; mobile?: boolean }) {
  return (
    <NavLink
      to={item.url}
      end
      className={cn(
        "group relative flex items-center gap-2 rounded-xl border font-medium transition-all duration-150",
        mobile ? "px-3 py-2.5 text-[14px]" : "px-3 py-1.5 text-[13px]",
        isActive
          ? "border-sidebar-primary/20 bg-sidebar-primary/10 text-sidebar-primary shadow-[0_10px_20px_-18px_hsl(var(--sidebar-primary))]"
          : "border-transparent text-sidebar-foreground/75 hover:border-sidebar-border/60 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      )}
    >
      <span
        className={cn(
          "absolute left-1 top-1/2 -translate-y-1/2 rounded-full transition-all duration-150",
          mobile ? "h-5" : "h-4",
          isActive ? "w-0.5 bg-sidebar-primary" : "w-0 bg-transparent"
        )}
      />
      <item.icon className={cn(mobile ? "h-[18px] w-[18px] shrink-0" : "h-4 w-4 shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-muted")} />
      <span className="truncate">{item.title}</span>
      {isActive && <div className={cn("ml-auto rounded-full bg-sidebar-primary", mobile ? "h-2 w-2" : "h-1.5 w-1.5")} />}
    </NavLink>
  );
}

function SidebarTopItemCollapsed({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={item.url}
          end
          className={cn(
            "relative mx-auto flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-150",
            isActive
              ? "border-sidebar-primary/30 bg-sidebar-primary/12 text-sidebar-primary"
              : "border-transparent text-sidebar-foreground hover:border-sidebar-border/60 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {isActive && (
            <span className="absolute -right-0.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-sidebar-primary" />
          )}
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs font-medium">
        {item.title}
      </TooltipContent>
    </Tooltip>
  );
}

function SidebarNavGroup({
  group,
  isOpen,
  onToggle,
  pathname,
  mobile = false,
}: {
  group: NavGroup;
  isOpen: boolean;
  onToggle: () => void;
  pathname: string;
  mobile?: boolean;
}) {
  const hasActiveChild = group.items.some((i) => pathname === i.url);
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (isOpen && hasActiveChild && activeRef.current) {
      activeRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isOpen, hasActiveChild]);

  return (
    <div className="space-y-0.5">
      <button
        onClick={onToggle}
        className={cn(
          "group flex w-full items-center gap-1.5 rounded-xl border font-medium transition-all duration-150",
          mobile ? "px-2.5 py-2 text-[14px]" : "px-2.5 py-1 text-[13px]",
          hasActiveChild
            ? "border-sidebar-primary/15 bg-sidebar-primary/5 text-sidebar-primary"
            : "border-transparent text-sidebar-foreground/75 hover:border-sidebar-border/60 hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground"
        )}
      >
        <group.icon className={cn(mobile ? "h-[18px] w-[18px] shrink-0" : "h-4 w-4 shrink-0", hasActiveChild ? "text-sidebar-primary" : "text-sidebar-muted")} />
        <span className="flex-1 text-left">{group.label}</span>
        <span className={cn("font-medium text-sidebar-muted/80", mobile ? "text-[11px]" : "text-[10px]")}>{group.items.length}</span>
        <ChevronDown
          className={cn(
            "shrink-0 text-sidebar-muted/70 transition-transform duration-200",
            mobile ? "h-3.5 w-3.5" : "h-3 w-3",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <div className="sidebar-group-content" data-open={isOpen}>
        <div className="pb-0.5 pl-2 pr-1">
          <div className="ml-3 space-y-0.5 border-l border-sidebar-border/50 pl-2">
            {group.items.map((item, idx) => {
              const active = pathname === item.url;

              return (
                <NavLink
                  key={item.url}
                  to={item.url}
                  end
                  ref={active ? activeRef : undefined}
                  className={cn(
                    "nav-item-enter flex items-center gap-2 rounded-lg border px-2 font-medium transition-all duration-150",
                    mobile ? "py-1.5 text-[14px]" : "py-1 text-[13px]",
                    active
                      ? "border-sidebar-primary/20 bg-sidebar-primary/12 font-medium text-sidebar-primary"
                      : "border-transparent text-sidebar-foreground/75 hover:border-sidebar-border/60 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                  style={{ animationDelay: `${idx * 22}ms` }}
                >
                  <item.icon
                    className={cn(
                      mobile ? "h-[18px] w-[18px] shrink-0" : "h-4 w-4 shrink-0",
                      active ? "text-sidebar-primary" : "text-sidebar-muted/80"
                    )}
                  />
                  <span className="truncate">{item.title}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarNavGroupCollapsed({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const hasActiveChild = group.items.some((i) => pathname === i.url);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "relative mx-auto flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-150",
            hasActiveChild
              ? "border-sidebar-primary/30 bg-sidebar-primary/12 text-sidebar-primary"
              : "border-transparent text-sidebar-foreground hover:border-sidebar-border/60 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          )}
        >
          <group.icon className="h-4 w-4 shrink-0" />
          {hasActiveChild && (
            <span className="absolute -right-0.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-sidebar-primary" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={10}
        className="w-56 rounded-xl border border-border p-2 shadow-xl"
      >
        <div className="mb-1 flex items-center gap-2 rounded-lg border border-border/60 bg-accent/35 px-2 py-1.5">
          <group.icon className="h-3.5 w-3.5 text-primary" />
          <p className="text-[12px] font-semibold text-foreground">{group.label}</p>
          <span className="ml-auto text-[11px] text-muted-foreground">{group.items.length}</span>
        </div>

        <div className="space-y-1">
          {group.items.map((item) => {
            const active = pathname === item.url;

            return (
              <button
                key={item.url}
                onClick={() => {
                  navigate(item.url);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-[12px] transition-all duration-150",
                  active
                    ? "border-primary/20 bg-primary/10 font-medium text-primary"
                    : "border-transparent text-foreground/75 hover:border-border hover:bg-accent/45 hover:text-foreground"
                )}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.title}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AppSidebar() {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { open: openSearch } = useCommandPalette();
  const pathname = location.pathname;
  const [utilitiesOpen, setUtilitiesOpen] = useState(false);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach((g) => {
      initial[g.label] = g.items.some((i) => pathname === i.url);
    });

    const hasAnyOpen = Object.values(initial).some(Boolean);
    if (!hasAnyOpen && navGroups[0]) {
      initial[navGroups[0].label] = true;
    }

    return initial;
  });

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      navGroups.forEach((g) => {
        if (g.items.some((i) => pathname === i.url)) {
          next[g.label] = true;
        }
      });
      return next;
    });
  }, [pathname]);

  const toggleGroup = useCallback((label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }, []);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/30">
      <SidebarHeader className={cn("px-4 pt-3.5", collapsed ? "pb-2" : "pb-3")}>
        <div className="flex items-center justify-between gap-2">
          <Link to="/" className="group flex items-center gap-2">
            {!collapsed ? (
              <span className="font-display text-[14px] font-semibold leading-none tracking-[-0.01em] text-sidebar-accent-foreground">
                <span className="text-[12px] font-normal text-sidebar-muted">sgnk</span>{" "}
                CareerOS
              </span>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-sidebar-primary/20 bg-sidebar-primary/12">
                    <span className="font-display text-[10px] font-bold leading-none text-sidebar-primary">sC</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs font-medium">
                  sgnk CareerOS
                </TooltipContent>
              </Tooltip>
            )}
          </Link>

          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-sidebar-muted/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
              onClick={toggleSidebar}
              aria-label={isMobile ? "Close sidebar" : "Collapse sidebar"}
            >
              {isMobile ? <X className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
        {!collapsed && <div className="mt-3 h-px bg-gradient-to-r from-sidebar-border/40 via-sidebar-border/10 to-transparent" />}

      </SidebarHeader>

      <SidebarContent className={cn("overflow-y-auto scrollbar-thin pb-1", collapsed ? "px-1 py-1" : "px-2") }>
        <div className={cn("space-y-0.5", collapsed && "flex flex-col items-center gap-0.5") }>
          {topItems.map((item) =>
            collapsed ? (
              <SidebarTopItemCollapsed key={item.url} item={item} isActive={pathname === item.url} />
            ) : (
              <SidebarTopItem key={item.url} item={item} isActive={pathname === item.url} mobile={isMobile} />
            )
          )}
        </div>

        <div className={cn("mt-0.5", collapsed ? "mb-0" : "mb-0.5")}>
          <ActiveResumeSidebar collapsed={collapsed} />
        </div>
        <div className={cn("space-y-0.5", collapsed && "flex flex-col items-center gap-0.5") }>
          {navGroups.map((group) =>
            collapsed ? (
              <SidebarNavGroupCollapsed key={group.label} group={group} pathname={pathname} />
            ) : (
              <SidebarNavGroup
                key={group.label}
                group={group}
                isOpen={!!openGroups[group.label]}
                onToggle={() => toggleGroup(group.label)}
                pathname={pathname}
                mobile={isMobile}
              />
            )
          )}
        </div>
      </SidebarContent>

      <SidebarFooter className={cn("p-2", collapsed && "p-1.5")}>
        {!collapsed ? (
          <div className="overflow-hidden rounded-xl border border-sidebar-border/60 bg-sidebar-accent/25">
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                utilitiesOpen ? "max-h-[260px] opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="px-2 pb-2 pt-2">
                <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">
                  Utilities
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {settingsMenuItems.map((item) => {
                    const active = pathname === item.url;

                    return (
                      <NavLink
                        key={item.url}
                        to={item.url}
                        end
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg border px-2 font-medium transition-all duration-150",
                          isMobile ? "py-2 text-[12px]" : "py-1.5 text-[11px]",
                          active
                            ? "border-sidebar-primary/20 bg-sidebar-primary/10 text-sidebar-primary"
                            : "border-transparent text-sidebar-foreground/75 hover:border-sidebar-border/60 hover:bg-sidebar hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </NavLink>
                    );
                  })}
                </div>
                <button
                  onClick={openSearch}
                  className={cn(
                    "mt-2 flex w-full items-center gap-2 rounded-lg border border-sidebar-border/65 bg-sidebar px-2.5 text-[12px] text-sidebar-muted transition-colors hover:border-sidebar-primary/35 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    isMobile ? "py-2.5" : "py-2"
                  )}
                >
                  <Search className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">Search features, tools, pages…</span>
                  <kbd className="hidden h-4 items-center rounded border border-sidebar-border/65 bg-sidebar/80 px-1 font-mono text-[10px] text-sidebar-muted/70 sm:inline-flex">
                    ⌘K
                  </kbd>
                </button>
                {user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "mt-2 w-full justify-start gap-2 rounded-lg border border-sidebar-border/65 px-2 text-[11px] text-sidebar-muted hover:border-sidebar-primary/25 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isMobile ? "h-9 text-[12px]" : "h-8"
                    )}
                    onClick={signOut}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </Button>
                )}
              </div>
            </div>

            {user ? (
              <div className={cn("flex items-center gap-2 bg-sidebar/70 px-2.5", isMobile ? "py-2.5" : "py-2", utilitiesOpen && "border-t border-sidebar-border/55")}>
                <div className={cn("flex shrink-0 items-center justify-center rounded-full bg-sidebar-primary/15", isMobile ? "h-8 w-8" : "h-7 w-7")}>
                  <span className="text-[11px] font-bold text-sidebar-primary">
                    {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
                  </span>
                </div>

                <p className={cn("min-w-0 flex-1 truncate font-medium text-sidebar-accent-foreground", isMobile ? "text-[13px]" : "text-[12px]")}>
                  {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
                </p>

                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("rounded-md text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", isMobile ? "h-8 w-8" : "h-7 w-7")}
                  onClick={() => setUtilitiesOpen((prev) => !prev)}
                  aria-label={utilitiesOpen ? "Collapse utilities" : "Expand utilities"}
                >
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-150", utilitiesOpen && "rotate-180")} />
                </Button>
              </div>
            ) : (
              <div className={cn("flex items-center gap-2 bg-sidebar/70 px-2.5", isMobile ? "py-2.5" : "py-2", utilitiesOpen && "border-t border-sidebar-border/55")}>
                <p className={cn("min-w-0 flex-1 truncate font-medium text-sidebar-accent-foreground", isMobile ? "text-[13px]" : "text-[12px]")}>
                  Utilities
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("rounded-md text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", isMobile ? "h-8 w-8" : "h-7 w-7")}
                  onClick={() => setUtilitiesOpen((prev) => !prev)}
                  aria-label={utilitiesOpen ? "Collapse utilities" : "Expand utilities"}
                >
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-150", utilitiesOpen && "rotate-180")} />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <SidebarNavGroupCollapsed
              group={{ label: "Utilities", icon: Settings, items: settingsMenuItems }}
              pathname={pathname}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="mx-auto mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-sidebar-muted transition-all duration-150 hover:border-sidebar-border/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  onClick={openSearch}
                >
                  <Search className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs font-medium">
                Search (⌘K)
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {collapsed && !user && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="mx-auto mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-sidebar-muted transition-all duration-150 hover:border-sidebar-border/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={toggleSidebar}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs font-medium">
              Expand sidebar
            </TooltipContent>
          </Tooltip>
        )}

        {user && collapsed && (
          <div className="mt-1 rounded-xl">
            <div className="mx-auto flex flex-col items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-sidebar-muted transition-all duration-150 hover:border-sidebar-border/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    onClick={toggleSidebar}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs font-medium">
                  Expand sidebar
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-sidebar-muted transition-all duration-150 hover:border-sidebar-border/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    onClick={signOut}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs font-medium">
                  Sign Out
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
