import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Search, FileText, Eye, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/layout/AppLayout";
import { ResumePreview } from "@/components/builder/ResumePreview";
import { sampleResume, TemplateName } from "@/types/resume";

interface Template {
  id: string;
  name: string;
  family: string;
  description: string;
  atsScore: string;
  style: string;
  industries: string[];
  pages: string;
  density: string;
  recommended?: boolean;
  previewTemplate?: TemplateName;
}

const templates: Template[] = [
  { id: "ats-classic-1", name: "ATS Standard", family: "ATS Classic", description: "Maximum machine readability. Single column, clean hierarchy.", atsScore: "A+", style: "Conservative", industries: ["All"], pages: "1-2", density: "Medium", previewTemplate: "classic" },
  { id: "ats-classic-2", name: "ATS Professional", family: "ATS Classic", description: "Enterprise-grade ATS safety with polished professional feel.", atsScore: "A+", style: "Professional", industries: ["Enterprise", "Finance"], pages: "1-2", density: "Medium", recommended: true, previewTemplate: "professional" },
  { id: "modern-1", name: "Modern Clean", family: "Modern Professional", description: "Contemporary elegance with excellent readability.", atsScore: "A", style: "Modern", industries: ["Tech", "Product"], pages: "1-2", density: "Medium", previewTemplate: "modern" },
  { id: "modern-2", name: "Modern Accent", family: "Modern Professional", description: "Subtle color accents with modern typography.", atsScore: "A", style: "Accented", industries: ["Tech", "Design"], pages: "1", density: "Light", previewTemplate: "modern" },
  { id: "executive-1", name: "Executive Brief", family: "Executive", description: "Calm authority for senior leaders. Strong summary emphasis.", atsScore: "A", style: "Premium", industries: ["All"], pages: "2", density: "Dense", recommended: true, previewTemplate: "executive" },
  { id: "executive-2", name: "Leadership Classic", family: "Executive", description: "Traditional leadership resume with impact-first presentation.", atsScore: "A", style: "Traditional", industries: ["Enterprise"], pages: "2", density: "Dense", previewTemplate: "executive" },
  { id: "consulting-1", name: "Strategy Consultant", family: "Consulting / MBA", description: "Highly structured for strategy and consulting candidates.", atsScore: "A+", style: "Structured", industries: ["Consulting", "Finance"], pages: "1", density: "Dense", previewTemplate: "professional" },
  { id: "tech-1", name: "Software Engineer", family: "Technical", description: "Optimized for engineers with tech stack grouping and projects.", atsScore: "A+", style: "Technical", industries: ["Tech", "Engineering"], pages: "1-2", density: "Medium", recommended: true, previewTemplate: "minimal" },
  { id: "tech-2", name: "Data Science", family: "Technical", description: "For data professionals with publications and tool stacks.", atsScore: "A+", style: "Analytical", industries: ["Data", "ML/AI"], pages: "1-2", density: "Medium", previewTemplate: "minimal" },
  { id: "design-1", name: "Product Designer", family: "Product / Design", description: "Design-forward with portfolio prominence.", atsScore: "B+", style: "Visual", industries: ["Design", "UX"], pages: "1-2", density: "Light", previewTemplate: "creative" },
  { id: "design-2", name: "Designer Pro", family: "Product / Design", description: "ATS-aware designer layout with case-study-first storytelling.", atsScore: "A", style: "Portfolio Ready", industries: ["Design", "Product"], pages: "1-2", density: "Medium", recommended: true, previewTemplate: "designer-pro" },
  { id: "design-3", name: "Designer Profile Photo", family: "Product / Design", description: "Designer resume with optional profile photo and featured work.", atsScore: "B+", style: "Visual Profile", industries: ["Design", "Brand"], pages: "1-2", density: "Light", previewTemplate: "designer-photo" },
  { id: "design-4", name: "Minimal Profile Photo", family: "Product / Design", description: "Clean minimal profile layout with optional photo support.", atsScore: "A", style: "Minimal Profile", industries: ["Design", "Creative Ops"], pages: "1-2", density: "Medium", previewTemplate: "minimal-photo" },
  { id: "latex-1", name: "LaTeX Precision", family: "Minimal LaTeX", description: "Publication-grade precision. Zero fluff, exact spacing.", atsScore: "A+", style: "Precise", industries: ["Tech", "Research"], pages: "1", density: "Dense", recommended: true, previewTemplate: "minimal" },
  { id: "latex-2", name: "Academic CV", family: "Minimal LaTeX", description: "For researchers and academics. Publications, grants, teaching.", atsScore: "A+", style: "Academic", industries: ["Research", "Academia"], pages: "2+", density: "Dense", previewTemplate: "classic" },
  { id: "startup-1", name: "Startup Builder", family: "Startup / Growth", description: "Emphasizes ownership, shipping, and growth outcomes.", atsScore: "A", style: "Dynamic", industries: ["Startup", "Growth"], pages: "1", density: "Light", previewTemplate: "modern" },
  { id: "creative-1", name: "Creative Pro", family: "Creative Professional", description: "Visual flair that stays professionally credible.", atsScore: "B+", style: "Creative", industries: ["Design", "Marketing"], pages: "1", density: "Light", previewTemplate: "creative" },
  { id: "compact-1", name: "One-Page Sharp", family: "Compact One-Page", description: "Perfectly optimized for single-page. Early-career focus.", atsScore: "A+", style: "Compact", industries: ["All"], pages: "1", density: "Medium", previewTemplate: "minimal" },
  { id: "twopage-1", name: "Strategic Two-Page", family: "Strategic Two-Page", description: "For experienced candidates needing depth without chaos.", atsScore: "A", style: "Detailed", industries: ["All"], pages: "2", density: "Dense", previewTemplate: "professional" },
];

const families = [...new Set(templates.map((t) => t.family))];
const atsLevels = ["A+", "A", "B+"];
const atsColors: Record<string, string> = {
  "A+": "bg-score-excellent/10 text-score-excellent border-score-excellent/20",
  "A": "bg-primary/10 text-primary border-primary/20",
  "B+": "bg-score-warning/10 text-score-warning border-score-warning/20",
};

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.03, duration: 0.3 } });
const THUMBNAIL_WIDTH = 794;
const THUMBNAIL_HEIGHT = 1123;

function LiveTemplateThumbnail({ template, className }: { template: TemplateName; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.24);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const width = el.clientWidth;
      if (width <= 0) return;
      setScale(width / THUMBNAIL_WIDTH);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-white ${className || ""}`}>
      <div
        className="pointer-events-none absolute left-1/2 top-0 origin-top"
        style={{
          width: THUMBNAIL_WIDTH,
          height: THUMBNAIL_HEIGHT,
          transform: `translateX(-50%) scale(${scale})`,
        }}
      >
        <ResumePreview data={sampleResume} template={template} simple />
      </div>
    </div>
  );
}

export default function Templates() {
  const [search, setSearch] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [selectedAts, setSelectedAts] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = templates.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.family.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedFamily && t.family !== selectedFamily) return false;
    if (selectedAts && t.atsScore !== selectedAts) return false;
    return true;
  });

  const hasActiveFilters = !!selectedFamily || !!selectedAts;
  const recommended = filtered.filter(t => t.recommended);

  return (
    <AppLayout title="Template Gallery" subtitle={`${templates.length} professional templates`}>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
        <motion.div {...fade(0)}>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-1">Template Gallery</h1>
          <p className="text-sm text-muted-foreground">
            {templates.length} world-class templates for every industry, role, and seniority level.
          </p>
        </motion.div>

        {/* Search + Filter Toggle */}
        <motion.div {...fade(1)} className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
          </div>
          <Button
            variant={showFilters || hasActiveFilters ? "default" : "outline"}
            size="sm"
            className="gap-1.5 rounded-lg h-10"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {hasActiveFilters && <Badge className="text-[9px] bg-primary-foreground/20 text-primary-foreground ml-1 px-1.5 py-0">{(selectedFamily ? 1 : 0) + (selectedAts ? 1 : 0)}</Badge>}
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums hidden sm:inline">
            {filtered.length} of {templates.length}
          </span>
        </motion.div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filter by</h3>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={() => { setSelectedFamily(null); setSelectedAts(null); }}>
                      <X className="h-3 w-3" /> Clear all
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-2">Family</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button onClick={() => setSelectedFamily(null)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${!selectedFamily ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30"}`}>All</button>
                      {families.map((f) => (
                        <button key={f} onClick={() => setSelectedFamily(selectedFamily === f ? null : f)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedFamily === f ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30"}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-2">ATS Safety</p>
                    <div className="flex items-center gap-1.5">
                      {atsLevels.map((lvl) => (
                        <button key={lvl} onClick={() => setSelectedAts(selectedAts === lvl ? null : lvl)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedAts === lvl ? atsColors[lvl] + " border" : "bg-card border-border text-muted-foreground hover:border-primary/20"}`}>
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recommended Row */}
        {!hasActiveFilters && !search && recommended.length > 0 && (
          <motion.div {...fade(2)}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">⭐ Recommended for you</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {recommended.map((t) => (
                <Link key={t.id} to="/builder" className="rounded-xl border-2 border-primary/20 bg-primary/[0.02] p-3 hover:border-primary/40 hover:shadow-sm transition-all flex items-center gap-3">
                  <div className="w-10 h-14 rounded-lg bg-white border overflow-hidden shrink-0">
                    <LiveTemplateThumbnail template={t.previewTemplate || "modern"} className="h-full w-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{t.family}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${atsColors[t.atsScore]}`}>{t.atsScore}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((t, i) => (
            <motion.div key={t.id} {...fade(i + 3)}>
              <div
                className="rounded-xl border bg-card overflow-hidden hover:shadow-md hover:border-primary/15 transition-all group"
                onMouseEnter={() => setHoveredId(t.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="relative bg-white border-b overflow-hidden" style={{ height: 220 }}>
                  <LiveTemplateThumbnail template={t.previewTemplate || "modern"} className="h-full w-full" />
                  <div className={`absolute inset-0 bg-foreground/60 flex items-center justify-center gap-2 transition-opacity duration-200 ${hoveredId === t.id ? "opacity-100" : "opacity-0"}`}>
                    <Link to="/builder">
                      <Button size="sm" className="gap-1.5 text-xs shadow-lg">
                        <Eye className="h-3.5 w-3.5" /> Use Template
                      </Button>
                    </Link>
                  </div>
                  {t.recommended && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 shadow-sm">⭐ Recommended</Badge>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-display text-sm font-semibold">{t.name}</h3>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${atsColors[t.atsScore]}`}>ATS {t.atsScore}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed line-clamp-2">{t.description}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">{t.pages} page</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">{t.density}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">{t.style}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">No templates match your filters.</p>
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setSelectedFamily(null); setSelectedAts(null); }}>
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
