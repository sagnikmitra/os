import { lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useAnalysis } from "@/context/AnalysisContext";
import { AnalysisRequiredState } from "@/components/AnalysisRequiredState";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import { cn } from "@/lib/utils";
import {
  Shield, FileSearch, Eye, Type, Bot, Layers,
  Sparkles, FileText, Route, BarChart3
} from "lucide-react";

// Import Analysis Components
import { ATSAnalysisContent } from "@/components/analysis/ATSContent";
import { ParsingContent } from "@/components/analysis/ParsingContent";
import { RecruiterContent } from "@/components/analysis/RecruiterContent";
import { ContentContent } from "@/components/analysis/ContentContent";
import { StructureContent } from "@/components/analysis/StructureContent";
import { RecommendationsContent } from "@/components/analysis/RecommendationsContent";
import { OverviewContent } from "@/components/analysis/OverviewContent";
import { PageLoader } from "@/components/layout/PageLoader";

const Humanizer = lazy(() => import("./Humanizer"));
const ImprovementRoadmap = lazy(() => import("./ImprovementRoadmap"));
const Reports = lazy(() => import("./Reports"));

type AnalysisTab = "overview" | "ats" | "parsing" | "recruiter" | "content" | "structure" | "humanizer" | "recommendations" | "roadmap" | "report";

const ANALYSIS_TABS: { id: AnalysisTab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "recommendations", label: "Recommendations", icon: <Sparkles className="h-4 w-4" /> },
  { id: "ats", label: "ATS Score", icon: <Shield className="h-4 w-4" /> },
  { id: "parsing", label: "Parsing Check", icon: <FileSearch className="h-4 w-4" /> },
  { id: "recruiter", label: "Recruiter View", icon: <Eye className="h-4 w-4" /> },
  { id: "content", label: "Content Quality", icon: <Type className="h-4 w-4" /> },
  { id: "structure", label: "Structure", icon: <Layers className="h-4 w-4" /> },
  { id: "humanizer", label: "AI Detection", icon: <Bot className="h-4 w-4" /> },
  { id: "roadmap", label: "Fix Roadmap", icon: <Route className="h-4 w-4" /> },
  { id: "report", label: "Full Report", icon: <FileText className="h-4 w-4" /> },
];

export default function Analysis() {
  const { analysis } = useAnalysis();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = "overview";
  const currentTab = (searchParams.get("tab") as AnalysisTab) || defaultTab;
  const isValidTab = ANALYSIS_TABS.some((tab) => tab.id === currentTab);

  // Enforce valid tab
  useEffect(() => {
    if (!isValidTab) {
      setSearchParams({ tab: defaultTab }, { replace: true });
    }
  }, [currentTab, isValidTab, setSearchParams]);

  // Warm heavy tabs so first switch feels instant.
  useEffect(() => {
    if (!analysis) return;

    const timer = window.setTimeout(() => {
      void import("./Humanizer");
      void import("./ImprovementRoadmap");
      void import("./Reports");
    }, 120);

    return () => window.clearTimeout(timer);
  }, [analysis]);

  if (!analysis) {
    return (
      <AppLayout title="Analysis Dashboard">
        <AnalysisRequiredState
          pageTitle="Deep Analysis Suite"
          description="Upload your resume to access ATS compatibility, content quality, recruiter views, and 20+ other deep AI diagnostics."
          icon={<Shield className="h-7 w-7 text-primary" />}
        />
      </AppLayout>
    );
  }

  const handleTabChange = (tabId: string) => {
    if (tabId === currentTab) return;
    setSearchParams({ tab: tabId }, { replace: true });
  };

  return (
    <AppLayout title="Analysis Dashboard" subtitle="Unified deep-dive metrics">
      <div className="page-container py-4 sm:py-6 max-w-7xl space-y-5 sm:space-y-6">
        <div className="rounded-xl border bg-card/70 px-4 py-3">
          <p className="text-sm font-semibold">Deep Analysis Workspace</p>
          <p className="text-xs text-muted-foreground mt-1">
            Switch tabs to inspect ATS, parsing, recruiter, content, structure, and recommendations.
          </p>
        </div>
        
        {/* Horizontal Tab Navigation */}
        <div className="sticky top-[86px] md:top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-background/90 backdrop-blur-md border-b border-border/40">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1">
            {ANALYSIS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
                  currentTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Tab Content */}
        <div className="pt-2 min-h-[60vh]">
          <AnimatePresence mode="wait">
            <Suspense fallback={<PageLoader />}>
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {currentTab === "overview" && (
                  <OverviewContent onNavigateToTab={handleTabChange} />
                )}
                {currentTab === "ats" && (
                  <div className="grid gap-6">
                    <ATSAnalysisContent />
                  </div>
                )}
                {currentTab === "parsing" && (
                  <div className="grid gap-6">
                    <ParsingContent />
                  </div>
                )}
                {currentTab === "recruiter" && (
                  <div className="grid gap-6">
                    <RecruiterContent />
                  </div>
                )}
                {currentTab === "content" && (
                  <div className="grid gap-6">
                    <ContentContent />
                  </div>
                )}
                {currentTab === "structure" && (
                  <div className="grid gap-6">
                    <StructureContent />
                  </div>
                )}
                {currentTab === "recommendations" && (
                  <div className="grid gap-6">
                    <RecommendationsContent />
                  </div>
                )}

                {currentTab === "humanizer" && (
                  <Humanizer embedded />
                )}
                {currentTab === "roadmap" && (
                  <ImprovementRoadmap embedded />
                )}
                {currentTab === "report" && (
                  <Reports embedded />
                )}
              </motion.div>
            </Suspense>
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
