import { useState, useEffect, lazy, Suspense, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Search, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OPEN_COMMAND_PALETTE_EVENT, useCommandPalette } from "./command-palette-events";
import { ActiveResumeDropdownCompact } from "./ActiveResumeDropdown";

const SIDEBAR_STATE_KEY = "sgnk-sidebar-open";
const CommandPalette = lazy(() =>
  import("./CommandPalette").then((mod) => ({ default: mod.CommandPalette })),
);
const OnboardingTour = lazy(() =>
  import("./OnboardingTour").then((mod) => ({ default: mod.OnboardingTour })),
);

const mobileRouteLabels: Record<string, string> = {
  "/dashboard": "Home",
  "/upload": "Upload & Analyze",
  "/analysis": "Analysis Dashboard",
  "/my-resumes": "My Resumes",
  "/builder": "Resume Builder",
  "/profile-hub": "Profiles",
  "/compare": "Compare Versions",
  "/templates": "Templates",
  "/help": "Help & Guide",
  "/settings": "Settings",
};

export default function AppShell() {
  const { open: openSearch } = useCommandPalette();
  const { pathname } = useLocation();
  const [loadGlobalOverlays, setLoadGlobalOverlays] = useState(false);
  const bootstrappingOverlaysRef = useRef(false);
  const mobilePageLabel = mobileRouteLabels[pathname] || "Workspace";
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
    return stored !== null ? stored === "true" : true;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, String(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    const timer = setTimeout(() => setLoadGlobalOverlays(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const ensureOverlaysLoaded = () => {
      if (loadGlobalOverlays || bootstrappingOverlaysRef.current) return;
      bootstrappingOverlaysRef.current = true;
      setLoadGlobalOverlays(true);
      setTimeout(() => {
        bootstrappingOverlaysRef.current = false;
        document.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
      }, 120);
    };

    document.addEventListener(OPEN_COMMAND_PALETTE_EVENT, ensureOverlaysLoaded);
    return () => document.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, ensureOverlaysLoaded);
  }, [loadGlobalOverlays]);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {/* Mobile top bar */}
          <header
            className="sticky top-0 z-30 border-b border-border/65 bg-background/94 backdrop-blur-xl px-3 pb-2 md:hidden"
            style={{ paddingTop: "max(env(safe-area-inset-top), 0.55rem)" }}
          >
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 shrink-0 rounded-xl border border-border/60 bg-card/80 text-muted-foreground hover:text-foreground" />
              <div className="min-w-0 mr-auto">
                <p className="text-[11px] text-muted-foreground/80 truncate">sgnk CareerOS</p>
                <p className="text-[14px] font-semibold text-foreground truncate">{mobilePageLabel}</p>
              </div>

              <div className="flex items-center gap-0.5 rounded-xl border border-border/65 bg-card/80 p-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:bg-primary hover:text-primary-foreground shrink-0"
                  onClick={openSearch}
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </Button>

                <Link to="/notifications" className="shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                </Link>

                <ThemeToggle className="h-9 w-9" />
              </div>
            </div>

          </header>
          <div className="flex-1 flex flex-col overflow-hidden">
            <Outlet />
          </div>
        </div>
      </div>
      {loadGlobalOverlays && (
        <Suspense fallback={null}>
          <CommandPalette />
          <OnboardingTour />
        </Suspense>
      )}
    </SidebarProvider>
  );
}
