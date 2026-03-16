import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { helpFeatureCategories, type FeatureItem } from "./Help";
import { cn } from "@/lib/utils";
import {
  Search,
  Compass,
  Sparkles,
  Route,
  CheckCircle2,
  Rocket,
  Target,
  ArrowRight,
  Clock3,
  FolderOpen,
  BookOpen,
  WandSparkles,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

const fade = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04 },
});

const categorySummary: Record<string, string> = {
  "Getting Started": "Set up your account, upload your resume, and establish your baseline.",
  "Build & Edit": "Create multiple resume versions, optimize content, and manage templates.",
  "Deep Analysis": "Get detailed diagnostics on ATS, parsing, structure, and recruiter readability.",
  "Job Search": "Discover jobs, match against JDs, tailor content, and track applications.",
  Research: "Build company intelligence, monitor trends, and follow a strategic roadmap.",
  "Interview Prep": "Practice role-specific questions, run mock interviews, and improve responses.",
  "Salary & Offers": "Benchmark compensation, compare offers, and prepare negotiation scripts.",
  Outreach: "Generate high-quality communication assets for applications and networking.",
  "Career Growth": "Build long-term career strategy, skill plans, and personal brand assets.",
  System: "Handle exports, analytics, settings, and support capabilities.",
};

const userJourney = [
  {
    title: "Onboard and baseline",
    route: "/upload",
    detail: "Upload your resume and generate your first full AI analysis to establish a starting score.",
  },
  {
    title: "Fix high-impact issues",
    route: "/improvement-roadmap",
    detail: "Use ATS, parsing, content, and structure findings to prioritize improvements in order.",
  },
  {
    title: "Rebuild optimized versions",
    route: "/builder",
    detail: "Apply rewrites in Resume Builder, create role-specific versions, and compare progress.",
  },
  {
    title: "Execute job pipeline",
    route: "/jobs-for-you",
    detail: "Find opportunities, run JD matching/tailoring, and track applications to outcomes.",
  },
  {
    title: "Prepare interview and offers",
    route: "/interview-prep",
    detail: "Practice interview flow, generate outreach assets, and handle salary discussions.",
  },
];

const guidedTracks = [
  {
    title: "Fast Track: Resume to Applications",
    audience: "For users who want to apply quickly",
    eta: "45-90 minutes setup",
    steps: [
      { label: "Upload & Analyze", route: "/upload" },
      { label: "Fix Roadmap", route: "/improvement-roadmap" },
      { label: "Resume Builder", route: "/builder" },
      { label: "JD Tailoring", route: "/jd-tailor" },
      { label: "Applications", route: "/application-tracker" },
    ],
  },
  {
    title: "Interview Sprint",
    audience: "For users with interviews coming up",
    eta: "30-60 minutes per company",
    steps: [
      { label: "Company Intel", route: "/company-research" },
      { label: "Interview Prep", route: "/interview-prep" },
      { label: "Mock Interview", route: "/mock-interview" },
      { label: "STAR Stories", route: "/star-builder" },
      { label: "Thank You Note", route: "/thank-you-note" },
    ],
  },
  {
    title: "Career Pivot Plan",
    audience: "For users changing role or domain",
    eta: "2-5 sessions",
    steps: [
      { label: "Career Intelligence", route: "/career-intelligence" },
      { label: "Skill Gap Map", route: "/skill-gap" },
      { label: "Learning Path", route: "/learning-roadmap" },
      { label: "Personal Branding", route: "/personal-branding" },
      { label: "Bio + Case Study", route: "/bio-generator" },
    ],
  },
];

const spotlightFeatures = [
  {
    route: "/upload",
    badge: "Most Popular",
    outcome: "Get your first complete resume baseline in minutes.",
  },
  {
    route: "/jobs-for-you",
    badge: "High Impact",
    outcome: "Move from analysis to active job pipeline quickly.",
  },
  {
    route: "/interview-prep",
    badge: "Interview Ready",
    outcome: "Practice targeted questions before your next round.",
  },
];

function toChecklist(feature: FeatureItem): string[] {
  return feature.howTo
    .split(".")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export default function Features() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const allFeatures = useMemo(() => {
    return helpFeatureCategories.flatMap((category) =>
      category.features.map((feature) => ({ ...feature, category: category.label })),
    );
  }, []);

  const featureMap = useMemo(() => {
    const map = new Map<string, FeatureItem>();
    allFeatures.forEach((feature) => {
      map.set(feature.url, feature);
    });
    return map;
  }, [allFeatures]);

  const categoryFilters = useMemo(() => ["All", ...helpFeatureCategories.map((category) => category.label)], []);

  const filteredCategories = useMemo(() => {
    return helpFeatureCategories
      .filter((category) => activeCategory === "All" || category.label === activeCategory)
      .map((category) => ({
        ...category,
        features: category.features.filter((feature) => {
          if (!search.trim()) return true;
          const q = search.toLowerCase();
          return (
            feature.title.toLowerCase().includes(q) ||
            feature.description.toLowerCase().includes(q) ||
            feature.howTo.toLowerCase().includes(q) ||
            feature.url.toLowerCase().includes(q) ||
            feature.tags.some((tag) => tag.toLowerCase().includes(q))
          );
        }),
      }))
      .filter((category) => category.features.length > 0);
  }, [search, activeCategory]);

  const totalFeatures = helpFeatureCategories.reduce((sum, c) => sum + c.features.length, 0);
  const allFeatureRoutes = useMemo(() => {
    return Array.from(new Set(helpFeatureCategories.flatMap((category) => category.features.map((feature) => feature.url)))).sort();
  }, []);

  return (
    <AppLayout title="Features" subtitle="Intuitive feature discovery and complete user walkthroughs">
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        <motion.section
          {...fade(0)}
          className="relative overflow-hidden rounded-3xl border bg-card p-5 md:p-7 shadow-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/10 pointer-events-none" />
          <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2 max-w-3xl">
              <Badge className="rounded-full gap-1.5 px-3 py-1 bg-primary/15 text-primary hover:bg-primary/15 border border-primary/20">
                <WandSparkles className="h-3.5 w-3.5" />
                Product Tour
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Find the right feature, then execute the right workflow</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Built for fast adoption: discover every CareerOS capability, follow step-by-step flows, and jump straight
                into the tools that improve outcomes.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link to="/upload">
                  <Button className="gap-1.5">Start with Upload <ArrowRight className="h-4 w-4" /></Button>
                </Link>
                <Link to="/help">
                  <Button variant="outline" className="gap-1.5">Open Help Guide</Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
              <Card className="min-w-[112px] border-primary/20">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Features</p>
                  <p className="text-xl font-semibold">{totalFeatures}</p>
                </CardContent>
              </Card>
              <Card className="min-w-[112px] border-primary/20">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Categories</p>
                  <p className="text-xl font-semibold">{helpFeatureCategories.length}</p>
                </CardContent>
              </Card>
              <Card className="min-w-[112px] border-primary/20">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Routes</p>
                  <p className="text-xl font-semibold">{allFeatureRoutes.length}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="relative mt-4 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search features, workflows, tags, or routes..."
              className="pl-10 bg-background/80"
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max pb-1">
              {categoryFilters.map((category) => (
                <Button
                  key={category}
                  size="sm"
                  variant={activeCategory === category ? "default" : "outline"}
                  onClick={() => setActiveCategory(category)}
                  className={cn("rounded-full", activeCategory === category && "shadow-sm")}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section {...fade(1)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {spotlightFeatures.map((spotlight) => {
              const feature = featureMap.get(spotlight.route);
              if (!feature) return null;
              return (
                <Card key={spotlight.route} className="border-primary/20 bg-gradient-to-br from-primary/[0.08] to-background">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-[10px]">{spotlight.badge}</Badge>
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                    <CardDescription>{spotlight.outcome}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to={feature.url}>
                      <Button className="w-full gap-1.5">Open {feature.title} <ArrowRight className="h-3.5 w-3.5" /></Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.section>

        <motion.section {...fade(2)}>
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><Compass className="h-4 w-4 text-primary" /> Start Here: Core Workflow</CardTitle>
              <CardDescription>Recommended order to move from resume setup to interview and offer stage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {userJourney.map((step, index) => (
                <div key={step.title} className="rounded-xl border border-border/70 bg-background/80 p-3 md:p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold flex items-center gap-2"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary text-[11px]">{index + 1}</span>{step.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{step.detail}</p>
                    </div>
                    <Link to={step.route} className="shrink-0">
                      <Button size="sm" variant="outline" className="gap-1.5">
                        Open {step.route} <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.section>

        <motion.section {...fade(3)} id="tracks">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Rocket className="h-4 w-4 text-primary" /> Guided Walkthrough Tracks</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {guidedTracks.map((track) => (
              <Card key={track.title} className="hover:shadow-sm transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{track.title}</CardTitle>
                  <CardDescription>{track.audience}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {track.eta}</p>
                  <div className="space-y-2">
                    {track.steps.map((trackStep, idx) => (
                      <div key={`${track.title}-${trackStep.route}`} className="rounded-lg border p-2.5 bg-background/70">
                        <p className="text-xs font-medium">{idx + 1}. {trackStep.label}</p>
                        <Link to={trackStep.route} className="text-xs text-primary hover:underline">{trackStep.route}</Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        <motion.section {...fade(4)}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Feature Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredCategories.map((category) => (
              <Card key={category.label} className="hover:shadow-sm transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className={`h-7 w-7 rounded-lg ${category.bgColor} flex items-center justify-center`}>
                      <category.icon className={`h-4 w-4 ${category.color}`} />
                    </div>
                    {category.label}
                  </CardTitle>
                  <CardDescription>{categorySummary[category.label] ?? "Feature bundle"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">{category.features.length} features</p>
                  <div className="flex flex-wrap gap-1">
                    {category.features.slice(0, 4).map((feature) => (
                      <Badge key={feature.url} variant="secondary" className="text-[10px]">{feature.title}</Badge>
                    ))}
                    {category.features.length > 4 && <Badge variant="outline" className="text-[10px]">+{category.features.length - 4} more</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        <motion.section {...fade(5)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Complete Feature Walkthroughs</CardTitle>
              <CardDescription>
                Every feature includes what it does, how to use it, checkpoints, and direct route access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {filteredCategories.map((category) => (
                  <AccordionItem key={category.label} value={category.label}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div className="flex items-center gap-2">
                        <div className={`h-6 w-6 rounded-md ${category.bgColor} flex items-center justify-center`}>
                          <category.icon className={`h-3.5 w-3.5 ${category.color}`} />
                        </div>
                        <span className="font-semibold text-sm">{category.label}</span>
                        <Badge variant="outline" className="text-[10px]">{category.features.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
                        {category.features.map((feature) => {
                          const checkpoints = toChecklist(feature);
                          return (
                            <Card key={feature.url} className="h-full border-border/70">
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h3 className="text-sm font-semibold">{feature.title}</h3>
                                    <Link to={feature.url} className="text-xs text-primary hover:underline">{feature.url}</Link>
                                  </div>
                                  <feature.icon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <p className="text-xs text-muted-foreground">{feature.description}</p>

                                <div className="rounded-lg bg-secondary/40 p-2.5">
                                  <p className="text-[11px] font-medium mb-1.5 flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" /> Walkthrough</p>
                                  <p className="text-xs text-foreground/90">{feature.howTo}</p>
                                </div>

                                <div>
                                  <p className="text-[11px] font-medium mb-1.5 flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" /> Checkpoints</p>
                                  <div className="space-y-1">
                                    {checkpoints.length > 0 ? checkpoints.map((checkpoint) => (
                                      <p key={checkpoint} className="text-xs text-muted-foreground">• {checkpoint}</p>
                                    )) : <p className="text-xs text-muted-foreground">• Follow the route flow and confirm output quality before continuing.</p>}
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-1">
                                  {feature.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                                  ))}
                                </div>

                                <Link to={feature.url}>
                                  <Button size="sm" className="w-full gap-1.5">
                                    Open Feature <ArrowRight className="h-3.5 w-3.5" />
                                  </Button>
                                </Link>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section {...fade(6)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="border-primary/20">
              <CardContent className="p-4 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Process-first UX</p>
                  <p className="text-xs text-muted-foreground">Clear sequences, explicit checkpoints, and route-level jump points for every stage.</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-4 flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Outcome oriented</p>
                  <p className="text-xs text-muted-foreground">Promotes highest-impact tools first so users reach value faster.</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="p-4 flex items-start gap-3">
                <Route className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Complete coverage</p>
                  <p className="text-xs text-muted-foreground">All end-user features and routes are available in one discoverable surface.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        <motion.section {...fade(7)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Route className="h-4 w-4 text-primary" /> Complete Route Index (Feature Routes)</CardTitle>
              <CardDescription>
                Full route coverage for end-user features documented in this guide.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {allFeatureRoutes.map((path) => (
                  <Link key={path} to={path}>
                    <Badge variant="outline" className="font-mono text-[11px] hover:bg-secondary cursor-pointer">
                      {path}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {filteredCategories.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center">
              <FolderOpen className="h-9 w-9 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No features matched “{search}”. Try route names (e.g., <span className="font-mono">/job-match</span>) or keywords.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
