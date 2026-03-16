import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnalysisProvider } from "@/context/AnalysisContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ActiveResumeProvider } from "@/context/ActiveResumeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import { lazy, Suspense, useEffect } from "react";
import { PageLoader } from "@/components/layout/PageLoader";

// Route-level code splitting
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Upload = lazy(() => import("./pages/Upload"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MyResumes = lazy(() => import("./pages/MyResumes"));
const ResumeBuilder = lazy(() => import("./pages/ResumeBuilder"));
const Templates = lazy(() => import("./pages/Templates"));
const ExportCenter = lazy(() => import("./pages/ExportCenter"));
const JobMatch = lazy(() => import("./pages/JobMatch"));
const JDTailor = lazy(() => import("./pages/JDTailor"));
const Rewrites = lazy(() => import("./pages/Rewrites"));
const Settings = lazy(() => import("./pages/Settings"));
const CompareVersions = lazy(() => import("./pages/CompareVersions"));
const SharedResume = lazy(() => import("./pages/SharedResume"));
const Analytics = lazy(() => import("./pages/Analytics"));
const CompareAnalytics = lazy(() => import("./pages/CompareAnalytics"));
const CoverLetter = lazy(() => import("./pages/CoverLetter"));
const InterviewPrep = lazy(() => import("./pages/InterviewPrep"));
const CareerIntelligence = lazy(() => import("./pages/CareerIntelligence"));
const LearningRoadmap = lazy(() => import("./pages/LearningRoadmap"));
const PersonalBranding = lazy(() => import("./pages/PersonalBranding"));
const SalaryNegotiation = lazy(() => import("./pages/SalaryNegotiation"));
const Portfolios = lazy(() => import("./pages/Portfolios"));
const PortfolioBuilder = lazy(() => import("./pages/PortfolioBuilder"));
const PortfolioTemplates = lazy(() => import("./pages/PortfolioTemplates"));
const PortfolioEditor = lazy(() => import("./pages/PortfolioEditor"));
const Publish = lazy(() => import("./pages/Publish"));
const HRHub = lazy(() => import("./pages/HRHub"));
const ProfileHub = lazy(() => import("./pages/ProfileHub"));
const JobsForYou = lazy(() => import("./pages/JobsForYou"));
const JobGettingRoadmap = lazy(() => import("./pages/JobGettingRoadmap"));
const SmartRecommendations = lazy(() => import("./pages/SmartRecommendations"));
const Analysis = lazy(() => import("./pages/Analysis"));
const JobAlerts = lazy(() => import("./pages/JobAlerts"));
const ApplicationTracker = lazy(() => import("./pages/ApplicationTracker"));
const FollowUpEmail = lazy(() => import("./pages/FollowUpEmail"));
const CompanyResearch = lazy(() => import("./pages/CompanyResearch"));
const ReferralMapper = lazy(() => import("./pages/ReferralMapper"));
const MockInterview = lazy(() => import("./pages/MockInterview"));
const STARBuilder = lazy(() => import("./pages/STARBuilder"));
const SalaryBenchmark = lazy(() => import("./pages/SalaryBenchmark"));
const OfferComparison = lazy(() => import("./pages/OfferComparison"));
const CareerPathVisualizer = lazy(() => import("./pages/CareerPathVisualizer"));
const SkillGapHeatmap = lazy(() => import("./pages/SkillGapHeatmap"));
const MarketDigest = lazy(() => import("./pages/MarketDigest"));
const LinkedInOptimizer = lazy(() => import("./pages/LinkedInOptimizer"));
const ElevatorPitch = lazy(() => import("./pages/ElevatorPitch"));
const ThankYouNote = lazy(() => import("./pages/ThankYouNote"));
const ColdEmailTester = lazy(() => import("./pages/ColdEmailTester"));
const ReferenceLetterDrafter = lazy(() => import("./pages/ReferenceLetterDrafter"));
const CaseStudyBuilder = lazy(() => import("./pages/CaseStudyBuilder"));
const BioGenerator = lazy(() => import("./pages/BioGenerator"));
const Help = lazy(() => import("./pages/Help"));
const Features = lazy(() => import("./pages/Features"));
const Install = lazy(() => import("./pages/Install"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const ActivityLogsPage = lazy(() => import("./pages/ActivityLogs"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const P = ({ children }: { children: React.ReactNode }) => <ProtectedRoute>{children}</ProtectedRoute>;

const S = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

// Prefetch common lazy routes after initial load
function usePrefetchRoutes() {
  useEffect(() => {
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    const isSlowNetwork = !!connection?.effectiveType && /2g/.test(connection.effectiveType);

    if (connection?.saveData || isSlowNetwork) return;

    const warmCoreRoutes = () => {
      import("./pages/Upload");
      import("./pages/MyResumes");
      import("./pages/Analysis");
    };

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if ("requestIdleCallback" in window) {
      idleId = (window as Window & {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
      }).requestIdleCallback(warmCoreRoutes, { timeout: 2500 });
    } else {
      timeoutId = setTimeout(warmCoreRoutes, 3000);
    }

    return () => {
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);
}

function AppRoutes() {
  usePrefetchRoutes();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<S><Login /></S>} />
      <Route path="/signup" element={<S><Signup /></S>} />
      <Route path="/auth/callback" element={<S><AuthCallback /></S>} />
      <Route path="/forgot-password" element={<S><ForgotPassword /></S>} />
      <Route path="/reset-password" element={<S><ResetPassword /></S>} />
      <Route path="/shared/:token" element={<S><SharedResume /></S>} />

      {/* Protected routes with shared sidebar shell */}
      <Route element={<P><AppShell /></P>}>
        <Route path="/onboarding" element={<S><Onboarding /></S>} />
        <Route path="/upload" element={<S><Upload /></S>} />
        <Route path="/dashboard" element={<S><Dashboard /></S>} />
        <Route path="/my-resumes" element={<S><MyResumes /></S>} />
        <Route path="/templates" element={<S><Templates /></S>} />
        <Route path="/export" element={<S><ExportCenter /></S>} />
        
        {/* Unified Analysis Dashboard */}
        <Route path="/analysis" element={<S><Analysis /></S>} />
        
        {/* Redirects for consolidated Analysis views */}
        <Route path="/ats" element={<Navigate to="/analysis?tab=ats" replace />} />
        <Route path="/parsing" element={<Navigate to="/analysis?tab=parsing" replace />} />
        <Route path="/recruiter" element={<Navigate to="/analysis?tab=recruiter" replace />} />
        <Route path="/content" element={<Navigate to="/analysis?tab=content" replace />} />
        <Route path="/humanizer" element={<Navigate to="/analysis?tab=ai" replace />} />
        <Route path="/structure" element={<Navigate to="/analysis?tab=structure" replace />} />
        <Route path="/reports" element={<Navigate to="/analysis?tab=report" replace />} />
        <Route path="/recommendations" element={<Navigate to="/analysis?tab=recommendations" replace />} />
        <Route path="/improvement-roadmap" element={<Navigate to="/analysis?tab=roadmap" replace />} />

        {/* Existing Routes */}
        <Route path="/job-match" element={<S><JobMatch /></S>} />
        <Route path="/jd-tailor" element={<S><JDTailor /></S>} />
        <Route path="/rewrites" element={<S><Rewrites /></S>} />
        <Route path="/settings" element={<S><Settings /></S>} />
        <Route path="/analytics" element={<S><Analytics /></S>} />
        <Route path="/builder" element={<S><ResumeBuilder /></S>} />
        <Route path="/cover-letter" element={<S><CoverLetter /></S>} />
        <Route path="/interview-prep" element={<S><InterviewPrep /></S>} />
        <Route path="/career-intelligence" element={<S><CareerIntelligence /></S>} />
        <Route path="/learning-roadmap" element={<S><LearningRoadmap /></S>} />
        <Route path="/personal-branding" element={<S><PersonalBranding /></S>} />
        <Route path="/salary-negotiation" element={<S><SalaryNegotiation /></S>} />
        <Route path="/compare" element={<S><CompareVersions /></S>} />
        <Route path="/compare-analytics" element={<S><CompareAnalytics /></S>} />
        <Route path="/portfolios" element={<S><Portfolios /></S>} />
        <Route path="/portfolio-builder" element={<S><PortfolioBuilder /></S>} />
        <Route path="/portfolio-templates" element={<S><PortfolioTemplates /></S>} />
        <Route path="/portfolio-editor" element={<S><PortfolioEditor /></S>} />
        <Route path="/publish" element={<S><Publish /></S>} />
        <Route path="/jobs-for-you" element={<S><JobsForYou /></S>} />
        <Route path="/job-getting-roadmap" element={<S><JobGettingRoadmap /></S>} />
        <Route path="/hr-hub" element={<S><HRHub /></S>} />
        <Route path="/profile-hub" element={<S><ProfileHub /></S>} />
        <Route path="/smart-recommendations" element={<S><SmartRecommendations /></S>} />
        <Route path="/job-alerts" element={<S><JobAlerts /></S>} />
        <Route path="/application-tracker" element={<S><ApplicationTracker /></S>} />
        <Route path="/follow-up-email" element={<S><FollowUpEmail /></S>} />
        <Route path="/company-research" element={<S><CompanyResearch /></S>} />
        <Route path="/referral-mapper" element={<S><ReferralMapper /></S>} />
        <Route path="/mock-interview" element={<S><MockInterview /></S>} />
        <Route path="/star-builder" element={<S><STARBuilder /></S>} />
        <Route path="/salary-benchmark" element={<S><SalaryBenchmark /></S>} />
        <Route path="/offer-comparison" element={<S><OfferComparison /></S>} />
        <Route path="/career-path" element={<S><CareerPathVisualizer /></S>} />
        <Route path="/skill-gap" element={<S><SkillGapHeatmap /></S>} />
        <Route path="/market-digest" element={<S><MarketDigest /></S>} />
        <Route path="/linkedin-optimizer" element={<S><LinkedInOptimizer /></S>} />
        <Route path="/elevator-pitch" element={<S><ElevatorPitch /></S>} />
        <Route path="/thank-you-note" element={<S><ThankYouNote /></S>} />
        <Route path="/cold-email" element={<S><ColdEmailTester /></S>} />
        <Route path="/reference-letter" element={<S><ReferenceLetterDrafter /></S>} />
        <Route path="/case-study" element={<S><CaseStudyBuilder /></S>} />
        <Route path="/bio-generator" element={<S><BioGenerator /></S>} />
        <Route path="/help" element={<S><Help /></S>} />
        <Route path="/features" element={<S><Features /></S>} />
        <Route path="/install" element={<S><Install /></S>} />
        <Route path="/notifications" element={<S><NotificationsPage /></S>} />
        <Route path="/activity" element={<S><ActivityLogsPage /></S>} />
      </Route>

      <Route path="*" element={<S><NotFound /></S>} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
      <AuthProvider>
        <AnalysisProvider>
          <ActiveResumeProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ActiveResumeProvider>
        </AnalysisProvider>
      </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
