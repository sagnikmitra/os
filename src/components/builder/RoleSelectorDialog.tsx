import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Target, Code, Briefcase, Palette, BarChart3, Megaphone, Settings, GraduationCap, Crown, TrendingUp, Users, Wrench } from "lucide-react";

export interface RoleProfile {
  id: string;
  label: string;
  icon: any;
  description: string;
  color: string;
  lens: string;
}

export const roleProfiles: RoleProfile[] = [
  { id: "software_engineer", label: "Software Engineer", icon: Code, description: "IC engineering, coding, system design", color: "text-blue-600 dark:text-blue-400", lens: "Technical depth, architecture decisions, system scale, open source, tech stack breadth" },
  { id: "product_manager", label: "Product Manager", icon: Target, description: "Product strategy, roadmap, user impact", color: "text-purple-600 dark:text-purple-400", lens: "Product sense, cross-functional influence, metrics ownership, go-to-market, user empathy" },
  { id: "designer", label: "UX/Product Designer", icon: Palette, description: "UX, product design, visual systems", color: "text-pink-600 dark:text-pink-400", lens: "Design process, user research, portfolio quality, visual craft, design systems" },
  { id: "data_analyst", label: "Data Analyst / Scientist", icon: BarChart3, description: "Data, analytics, ML, insights", color: "text-emerald-600 dark:text-emerald-400", lens: "Statistical rigor, data storytelling, tool stack (SQL, Python, R), business impact of insights" },
  { id: "marketing", label: "Marketing / Growth", icon: TrendingUp, description: "Growth, performance, brand, content", color: "text-amber-600 dark:text-amber-400", lens: "Campaign ROI, channel mastery, growth metrics, funnel optimization, brand voice" },
  { id: "sales", label: "Sales / BizDev", icon: Megaphone, description: "Revenue, partnerships, account management", color: "text-orange-600 dark:text-orange-400", lens: "Revenue generated, quota attainment, deal size, pipeline building, relationship sales" },
  { id: "operations", label: "Operations / Strategy", icon: Settings, description: "Ops, strategy, process, consulting", color: "text-cyan-600 dark:text-cyan-400", lens: "Process efficiency, cost reduction, cross-functional coordination, strategic frameworks" },
  { id: "executive", label: "Executive / Leadership", icon: Crown, description: "C-suite, VP, Director level", color: "text-rose-600 dark:text-rose-400", lens: "P&L ownership, board-level thinking, organizational transformation, executive presence" },
  { id: "fresher", label: "New Graduate / Fresher", icon: GraduationCap, description: "Entry level, internships, first role", color: "text-sky-600 dark:text-sky-400", lens: "Academic excellence, internship impact, projects, leadership in campus, skill signals" },
  { id: "hr_recruiter", label: "HR / Recruiter", icon: Users, description: "People ops, talent acquisition, L&D", color: "text-teal-600 dark:text-teal-400", lens: "Hiring funnel metrics, retention impact, culture initiatives, compensation structures" },
  { id: "startup_generalist", label: "Startup Generalist", icon: Wrench, description: "0→1 builder, early-stage, multi-functional", color: "text-violet-600 dark:text-violet-400", lens: "Speed of execution, breadth across functions, ownership mindset, tangible shipped outcomes" },
  { id: "general", label: "General / Undecided", icon: Briefcase, description: "No specific target role", color: "text-muted-foreground", lens: "Balanced evaluation across clarity, impact, formatting, and credibility" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: string;
  onSelect: (roleId: string) => void;
}

export function RoleSelectorDialog({ open, onOpenChange, selected, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const selectedProfile = roleProfiles.find(r => r.id === selected);
  const hoveredProfile = roleProfiles.find(r => r.id === hovered);
  const preview = hoveredProfile || selectedProfile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Set Analysis Lens
          </DialogTitle>
          <DialogDescription>
            Choose your target role to calibrate how your resume is evaluated. The analysis will adjust scoring, keyword expectations, and feedback to match.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {roleProfiles.map((role) => (
            <button
              key={role.id}
              onClick={() => { onSelect(role.id); onOpenChange(false); }}
              onMouseEnter={() => setHovered(role.id)}
              onMouseLeave={() => setHovered(null)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selected === role.id
                  ? "border-primary/50 bg-primary/10"
                  : "border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/60"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <role.icon className={`h-3.5 w-3.5 shrink-0 ${role.color}`} />
                <span className={`text-xs font-semibold ${selected === role.id ? "text-primary" : ""}`}>{role.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">{role.description}</p>
            </button>
          ))}
        </div>

        {preview && (
          <div className="mt-2 p-3 rounded-lg bg-secondary/40 border">
            <div className="flex items-center gap-2 mb-1">
              <preview.icon className={`h-3.5 w-3.5 ${preview.color}`} />
              <span className="text-xs font-semibold">{preview.label} — Evaluation Focus</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{preview.lens}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
