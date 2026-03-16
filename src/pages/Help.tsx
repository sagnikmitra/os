import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "@/lib/motion-stub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { resetTour } from "@/components/layout/OnboardingTour";
import AppLayout from "@/components/layout/AppLayout";
import {
  Upload, Shield, FileSearch, Eye, Type, Bot, Briefcase, Layers, PenTool,
  FileText, Settings, Hammer, Home, FolderOpen, Download, GitBranch, Target, BarChart3,
  Mail, GraduationCap, Users, TrendingUp, BookOpen, Fingerprint, DollarSign, UserCircle, Sparkles, Route, Map, Rocket, Bell,
  Kanban, MailCheck, Building2, Network, Mic, Star, BadgeDollarSign, Scale, GitFork, Grid3X3, Newspaper, Linkedin, MessageSquare, Heart, FlaskConical, FileSignature, BookMarked, User,
  Search, Palette, ChevronRight, RotateCcw, HelpCircle,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface FeatureItem {
  title: string;
  description: string;
  howTo: string;
  url: string;
  icon: LucideIcon;
  tags: string[];
}

export interface FeatureCategory {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  features: FeatureItem[];
}

export const helpFeatureCategories: FeatureCategory[] = [
  {
    label: "Getting Started",
    icon: Home,
    color: "text-primary",
    bgColor: "bg-primary/10",
    features: [
      { title: "Dashboard", description: "Your career command center with quick access to all tools, recent activity, and progress overview.", howTo: "Sign in and you'll land here. Use quick-access toolbar icons to jump to any tool instantly.", url: "/dashboard", icon: Home, tags: ["overview", "home"] },
      { title: "Upload & Analyze", description: "Upload your resume (PDF/DOCX) and get instant AI analysis across 9 quality dimensions.", howTo: "Click 'Upload & Analyze', drag your resume file or click to browse, then wait for the AI to process it.", url: "/upload", icon: Upload, tags: ["upload", "analyze", "scan"] },
      { title: "My Resumes", description: "Manage all your saved resumes with version history, tags, sharing links, and primary resume selection.", howTo: "Go to 'My Resumes' to see all saved versions. Star one as primary, add tags, or share via public link.", url: "/my-resumes", icon: FolderOpen, tags: ["saved", "versions", "manage"] },
    ],
  },
  {
    label: "Build & Edit",
    icon: Hammer,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    features: [
      { title: "Resume Builder", description: "Full-featured resume editor with 5 editing modes and 10 professional templates including LaTeX styles.", howTo: "Open the builder, choose a template, then edit sections. Switch between Write+Preview, Inline Edit, Visual Composer, or Simple Docs mode.", url: "/builder", icon: Hammer, tags: ["build", "editor", "create"] },
      { title: "Profiles", description: "Create multiple career profiles for different industries or roles, each with its own resume data.", howTo: "Navigate to Profiles and create profiles for each target role. Switch between them when building resumes.", url: "/profile-hub", icon: UserCircle, tags: ["profiles", "roles"] },
      { title: "Compare Versions", description: "Side-by-side comparison of two resume versions showing differences in content and scores.", howTo: "Select two saved resumes and compare them visually. See what changed and how scores improved.", url: "/compare", icon: GitBranch, tags: ["compare", "diff", "versions"] },
      { title: "Templates", description: "Browse and preview all 10 resume templates — from ATS-safe classics to creative LaTeX designs.", howTo: "Browse the gallery, preview each template, then click 'Use Template' to start building with it.", url: "/templates", icon: Palette, tags: ["templates", "design"] },
      { title: "Portfolios", description: "Build and publish professional portfolio websites with 8 industry-specific templates.", howTo: "Create a new portfolio, choose a template, fill in your projects and bio, then publish with a custom URL.", url: "/portfolios", icon: Layers, tags: ["portfolio", "website"] },
    ],
  },
  {
    label: "Deep Analysis",
    icon: Shield,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    features: [
      { title: "ATS Score", description: "Check how well your resume passes through Applicant Tracking Systems used by 99% of Fortune 500.", howTo: "Upload a resume first, then navigate to ATS Score to see your compatibility rating and specific improvements.", url: "/ats", icon: Shield, tags: ["ats", "compatibility"] },
      { title: "Parsing Check", description: "Simulate how resume parsers extract your data — catch broken fields before they cost you.", howTo: "After analysis, check Parsing to see how each section was extracted and identify formatting issues.", url: "/parsing", icon: FileSearch, tags: ["parsing", "format"] },
      { title: "Recruiter View", description: "6-second scan simulation showing what recruiters actually notice vs. what they miss.", howTo: "View the heatmap overlay to see high-attention zones. Fix sections recruiters are likely to skip.", url: "/recruiter", icon: Eye, tags: ["recruiter", "scan"] },
      { title: "Content Quality", description: "Analyze bullet points for weak verbs, missing metrics, vague claims, and actionable rewrite suggestions.", howTo: "Review each bullet with its quality rating. Click 'Rewrite' on weak bullets to get AI-improved versions.", url: "/content", icon: Type, tags: ["content", "bullets", "quality"] },
      { title: "Structure Analysis", description: "Evaluate resume layout, section order, spacing, and information hierarchy for maximum impact.", howTo: "Check the structure diagram to see section ordering recommendations and layout improvements.", url: "/structure", icon: Layers, tags: ["structure", "layout"] },
      { title: "AI Detection", description: "Detect AI-generated or robotic language and get humanized rewrites that sound authentic.", howTo: "View the humanizer score, then click on flagged phrases to get natural-sounding alternatives.", url: "/humanizer", icon: Bot, tags: ["ai", "humanizer", "authentic"] },
      { title: "Full Report", description: "Comprehensive PDF report combining all 9 analysis dimensions with scores, charts, and recommendations.", howTo: "After analysis, go to Full Report to view everything in one place. Download as PDF for offline review.", url: "/reports", icon: FileText, tags: ["report", "pdf", "full"] },
      { title: "Fix Roadmap", description: "Prioritized action plan showing which fixes will have the biggest impact on your scores.", howTo: "Follow the prioritized checklist — highest-impact fixes first. Click each item to jump to the relevant tool.", url: "/improvement-roadmap", icon: Route, tags: ["roadmap", "fixes", "priorities"] },
    ],
  },
  {
    label: "Job Search",
    icon: Briefcase,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    features: [
      { title: "Jobs For You", description: "AI-matched job listings based on your resume, skills, and preferences with match scores.", howTo: "Set your preferences (role, location, salary range), then browse AI-curated matches. Save interesting jobs.", url: "/jobs-for-you", icon: Sparkles, tags: ["jobs", "search", "match"] },
      { title: "Job Alerts", description: "Set up automated alerts for new jobs matching your criteria. Get notified on your schedule.", howTo: "Create an alert with keywords, location, and frequency. You'll receive notifications when new matches appear.", url: "/job-alerts", icon: Bell, tags: ["alerts", "notifications"] },
      { title: "Applications", description: "Kanban-style application tracker — move jobs through Applied, Interview, Offer, and Rejected stages.", howTo: "Save jobs from search results, then track them through your pipeline by dragging cards between columns.", url: "/application-tracker", icon: Kanban, tags: ["tracker", "kanban", "pipeline"] },
      { title: "Job Match", description: "Compare your resume against a specific job description to see gaps, matches, and tailoring tips.", howTo: "Paste a job description, then see a detailed gap analysis with keyword matches and missing skills.", url: "/job-match", icon: Briefcase, tags: ["match", "gap analysis"] },
      { title: "JD Tailoring", description: "Automatically rewrite your resume bullets to better match a target job description.", howTo: "Paste the JD, select which sections to tailor, then review and apply the AI-suggested rewrites.", url: "/jd-tailor", icon: Target, tags: ["tailor", "customize"] },
      { title: "Rewrites", description: "AI-powered bullet point rewriter — transform weak bullets into achievement-focused statements.", howTo: "Select bullets to rewrite, choose the tone (professional, executive, technical), then review suggestions.", url: "/rewrites", icon: PenTool, tags: ["rewrite", "bullets"] },
    ],
  },
  {
    label: "Research",
    icon: Building2,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    features: [
      { title: "Company Intel", description: "Research target companies — culture, ratings, recent news, interview tips, and team information.", howTo: "Enter a company name to get a comprehensive research brief. Use insights to tailor your application.", url: "/company-research", icon: Building2, tags: ["company", "research"] },
      { title: "Market Digest", description: "Weekly market intelligence — hiring trends, hot skills, salary movements, and industry news.", howTo: "Check your personalized digest for industry trends relevant to your target roles and skills.", url: "/market-digest", icon: Newspaper, tags: ["market", "trends", "news"] },
      { title: "Recommendations", description: "AI-generated personalized recommendations for improving your job search strategy.", howTo: "Review your smart recommendations and follow the suggested next steps to improve your chances.", url: "/smart-recommendations", icon: Rocket, tags: ["recommendations", "tips"] },
      { title: "Job Roadmap", description: "Step-by-step strategic roadmap for landing your target role in 30/60/90 days.", howTo: "Enter your target role and current situation. Get a timeline-based action plan with weekly milestones.", url: "/job-getting-roadmap", icon: Map, tags: ["roadmap", "strategy"] },
    ],
  },
  {
    label: "Interview Prep",
    icon: Mic,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    features: [
      { title: "Question Prep", description: "AI-generated interview questions based on your resume and target role with model answers.", howTo: "Select your target role and the questions are generated from your resume. Practice with the model answers.", url: "/interview-prep", icon: GraduationCap, tags: ["questions", "prep"] },
      { title: "Mock Interview", description: "Interactive AI mock interview with real-time scoring, feedback, and improvement suggestions.", howTo: "Start a mock session, answer questions verbally or by typing, then review your performance scores.", url: "/mock-interview", icon: Mic, tags: ["mock", "practice", "simulate"] },
      { title: "STAR Stories", description: "Build structured behavioral interview answers using the Situation-Task-Action-Result framework.", howTo: "Enter a scenario from your experience. The AI helps structure it into a compelling STAR-format story.", url: "/star-builder", icon: Star, tags: ["star", "behavioral"] },
    ],
  },
  {
    label: "Salary & Offers",
    icon: DollarSign,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    features: [
      { title: "Salary Data", description: "Market salary benchmarks for your role, experience level, and location with percentile ranges.", howTo: "Enter your role and location to see salary ranges at 25th, 50th, 75th, and 90th percentiles.", url: "/salary-benchmark", icon: BadgeDollarSign, tags: ["salary", "benchmark", "data"] },
      { title: "Compare Offers", description: "Side-by-side offer comparison factoring in salary, equity, benefits, commute, and total compensation.", howTo: "Add multiple job offers with their details. See a normalized comparison of total compensation value.", url: "/offer-comparison", icon: Scale, tags: ["offers", "compare", "compensation"] },
      { title: "Negotiation", description: "AI-crafted negotiation scripts and strategies personalized to your specific offer situation.", howTo: "Enter your offer details and desired outcome. Get a custom negotiation script with talking points.", url: "/salary-negotiation", icon: DollarSign, tags: ["negotiation", "strategy"] },
    ],
  },
  {
    label: "Outreach",
    icon: Mail,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    features: [
      { title: "Cover Letter", description: "AI-generated cover letters tailored to each specific job description and company.", howTo: "Paste the job description and company info. Choose a tone, then review and edit the generated letter.", url: "/cover-letter", icon: Mail, tags: ["cover letter", "application"] },
      { title: "Follow-Up", description: "Post-interview follow-up emails that reference specific conversation points.", howTo: "Enter interview details and key discussion points. Get a personalized follow-up email draft.", url: "/follow-up-email", icon: MailCheck, tags: ["follow-up", "email"] },
      { title: "Thank You", description: "Professional thank-you notes for after interviews, networking events, or referrals.", howTo: "Select the occasion, add context, and generate a polished thank-you note in seconds.", url: "/thank-you-note", icon: Heart, tags: ["thank you", "gratitude"] },
      { title: "Cold Email A/B", description: "Generate and A/B test cold outreach emails with predicted open rates and response rates.", howTo: "Enter the target person and purpose. Get two email variants with predicted engagement metrics.", url: "/cold-email", icon: FlaskConical, tags: ["cold email", "outreach", "ab test"] },
      { title: "Elevator Pitch", description: "Craft compelling 30-second elevator pitches for networking and career conversations.", howTo: "Describe your background and target. Get a polished pitch you can memorize and deliver naturally.", url: "/elevator-pitch", icon: MessageSquare, tags: ["pitch", "networking"] },
      { title: "Referral Map", description: "Map your professional network to identify potential referral paths to target companies.", howTo: "Enter target companies and your connections. See potential referral chains and introduction templates.", url: "/referral-mapper", icon: Network, tags: ["referral", "network", "connections"] },
      { title: "Reference Letter", description: "Draft professional reference letters or recommendation requests.", howTo: "Enter the relationship context and target role. Get a draft letter or request email to send.", url: "/reference-letter", icon: FileSignature, tags: ["reference", "recommendation"] },
    ],
  },
  {
    label: "Career Growth",
    icon: TrendingUp,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    features: [
      { title: "Career Intel", description: "Industry intelligence on career trajectories, emerging roles, and growth opportunities.", howTo: "Enter your current role to see typical career progressions, emerging opportunities, and growth areas.", url: "/career-intelligence", icon: TrendingUp, tags: ["career", "intelligence"] },
      { title: "Career Path", description: "Interactive visualization of potential career trajectories from your current position.", howTo: "See a visual map of possible career paths with timelines, salary progressions, and required skills.", url: "/career-path", icon: GitFork, tags: ["career path", "visualization"] },
      { title: "Skill Gap Map", description: "Heatmap showing your skills vs. market demand with priority recommendations.", howTo: "Compare your skills against job market requirements. Focus on high-demand skills you're missing.", url: "/skill-gap", icon: Grid3X3, tags: ["skills", "gap", "heatmap"] },
      { title: "Learning Path", description: "Personalized learning roadmap with courses, certifications, and resources for skill development.", howTo: "Based on your skill gaps, get a curated learning plan with free and paid resources ranked by ROI.", url: "/learning-roadmap", icon: BookOpen, tags: ["learning", "courses", "development"] },
      { title: "LinkedIn", description: "AI analysis and optimization suggestions for your LinkedIn profile.", howTo: "Upload your LinkedIn PDF or paste your profile URL. Get specific rewrite suggestions for each section.", url: "/linkedin-optimizer", icon: Linkedin, tags: ["linkedin", "optimize", "profile"] },
      { title: "Branding", description: "Personal branding strategy with consistent messaging across all professional channels.", howTo: "Define your professional brand pillars. Get messaging templates for LinkedIn, resume, bio, and more.", url: "/personal-branding", icon: Fingerprint, tags: ["branding", "personal brand"] },
      { title: "Bio Generator", description: "Generate professional bios in multiple lengths and tones for different platforms.", howTo: "Enter your details and select the platform (LinkedIn, Twitter, conference). Get multiple bio variations.", url: "/bio-generator", icon: User, tags: ["bio", "about me"] },
      { title: "Case Study", description: "Build professional case studies showcasing your key projects and achievements.", howTo: "Describe a project or achievement. Get a structured case study with metrics, approach, and outcomes.", url: "/case-study", icon: BookMarked, tags: ["case study", "projects"] },
    ],
  },
  {
    label: "System",
    icon: Settings,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    features: [
      { title: "Export Center", description: "Export resumes in multiple formats — PDF, DOCX, LaTeX, JSON — with template-specific rendering.", howTo: "Select a resume, choose the format and template, then download. LaTeX exports require a LaTeX compiler.", url: "/export", icon: Download, tags: ["export", "download", "pdf"] },
      { title: "Analytics", description: "Track your resume performance over time — score trends, improvement velocity, and engagement.", howTo: "View charts showing how your scores have changed across analyses. Identify trends and progress.", url: "/analytics", icon: BarChart3, tags: ["analytics", "charts", "progress"] },
      { title: "HR Hub", description: "Database of HR contacts and recruiters with filtering by company, industry, and specialization.", howTo: "Search for recruiters by company or industry. Save favorites and export contact lists.", url: "/hr-hub", icon: Users, tags: ["hr", "recruiters", "contacts"] },
      { title: "Settings", description: "Account settings, appearance preferences, theme selection, and tour replay.", howTo: "Manage your profile, switch between light/dark theme, or replay the onboarding tour.", url: "/settings", icon: Settings, tags: ["settings", "account", "theme"] },
    ],
  },
];

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export default function Help() {
  const [search, setSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const filteredCategories = helpFeatureCategories.map((cat) => ({
    ...cat,
    features: cat.features.filter((f) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.tags.some((t) => t.includes(q))
      );
    }),
  })).filter((cat) => cat.features.length > 0);

  const totalFeatures = helpFeatureCategories.reduce((sum, c) => sum + c.features.length, 0);
  const totalCategories = helpFeatureCategories.length;

  return (
    <AppLayout title="Help & Features" subtitle={`${totalFeatures} tools across ${totalCategories} categories`}>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <motion.div {...fade(0)}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Help & Features Guide
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {totalFeatures} tools across {totalCategories} categories — everything in sgnk CareerOS
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 rounded-lg shrink-0" onClick={resetTour}>
              <RotateCcw className="h-3.5 w-3.5" />
              Replay Tour
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search features… (e.g. 'ats', 'interview', 'salary')"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl"
            />
          </div>
        </motion.div>

        {/* Categories */}
        <div className="space-y-2">
          {filteredCategories.map((cat, ci) => {
            const isExpanded = expandedCategory === cat.label || !!search;

            return (
              <motion.div key={cat.label} {...fade(ci + 1)} className="rounded-xl border bg-card overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded && !search ? null : cat.label)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
                >
                  <div className={`w-8 h-8 rounded-lg ${cat.bgColor} flex items-center justify-center`}>
                    <cat.icon className={`h-4 w-4 ${cat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[13px] font-semibold leading-tight">{cat.label}</h2>
                    <p className="text-[11px] text-muted-foreground">{cat.features.length} tool{cat.features.length !== 1 ? "s" : ""}</p>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="border-t divide-y divide-border/50">
                    {cat.features.map((feature) => (
                      <div key={feature.url} className="px-4 py-3 hover:bg-secondary/20 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-md ${cat.bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
                            <feature.icon className={`h-3.5 w-3.5 ${cat.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-[13px] font-semibold">{feature.title}</h3>
                              <div className="flex gap-1">
                                {feature.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0 h-[18px]">{tag}</Badge>
                                ))}
                              </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed mb-1.5">{feature.description}</p>
                            <div className="flex items-start gap-2 bg-secondary/40 rounded-md px-2.5 py-1.5">
                              <Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                              <p className="text-[11px] text-foreground/80 leading-relaxed"><span className="font-medium">How to use:</span> {feature.howTo}</p>
                            </div>
                          </div>
                          <Link to={feature.url} className="shrink-0">
                            <Button variant="ghost" size="sm" className="gap-1 text-[11px] h-7 px-2">
                              Open <ChevronRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {search && filteredCategories.length === 0 && (
          <div className="text-center py-16">
            <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No features found for "{search}"</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
