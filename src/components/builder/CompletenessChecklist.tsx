import { ResumeData } from "@/types/resume";
import { CheckCircle2, Circle, AlertCircle, Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  data: ResumeData;
}

interface CheckItem {
  label: string;
  done: boolean;
  priority: "required" | "recommended" | "optional";
  tip: string;
  section?: string;
}

export function CompletenessChecklist({ data }: Props) {
  const items: CheckItem[] = [
    { label: "Full name", done: !!data.contact.name.trim(), priority: "required", tip: "Add your full name", section: "contact" },
    { label: "Email address", done: !!data.contact.email.trim(), priority: "required", tip: "Add a professional email", section: "contact" },
    { label: "Phone number", done: !!data.contact.phone.trim(), priority: "required", tip: "Add a phone number", section: "contact" },
    { label: "Professional summary", done: data.summary.trim().split(/\s+/).filter(Boolean).length >= 10, priority: "required", tip: "Write at least 2-3 sentences", section: "summary" },
    { label: "Work experience", done: data.experience.length >= 1, priority: "required", tip: "Add your work experience", section: "experience" },
    { label: "Education", done: data.education.length >= 1, priority: "required", tip: "Add your education", section: "education" },
    { label: "Skills section", done: data.skills.length >= 1 && data.skills.some(s => s.items.trim().length > 0), priority: "required", tip: "Add relevant skills", section: "skills" },

    { label: "Location", done: !!data.contact.location.trim(), priority: "recommended", tip: "Add city/region", section: "contact" },
    { label: "Job title", done: !!data.contact.title.trim(), priority: "recommended", tip: "Add your current/target title", section: "contact" },
    { label: "2+ experience entries", done: data.experience.length >= 2, priority: "recommended", tip: "More experience strengthens your resume", section: "experience" },
    { label: "3+ bullets per role", done: data.experience.every(e => e.bullets.filter(Boolean).length >= 3) && data.experience.length > 0, priority: "recommended", tip: "Each role should have 3-5 impact bullets", section: "experience" },
    { label: "LinkedIn URL", done: !!data.contact.linkedin.trim(), priority: "recommended", tip: "Link your LinkedIn profile", section: "contact" },

    { label: "Portfolio/website", done: !!data.contact.portfolio.trim(), priority: "optional", tip: "Add portfolio if applicable", section: "contact" },
    { label: "Projects section", done: data.projects.length >= 1, priority: "optional", tip: "Showcase side projects", section: "projects" },
    { label: "Certifications", done: data.certifications.length >= 1, priority: "optional", tip: "Add relevant certifications", section: "certifications" },
  ];

  const doneCount = items.filter(i => i.done).length;
  const pct = Math.round((doneCount / items.length) * 100);
  const requiredItems = items.filter(i => i.priority === "required");
  const recommendedItems = items.filter(i => i.priority === "recommended");
  const optionalItems = items.filter(i => i.priority === "optional");
  const requiredDone = requiredItems.every(i => i.done);

  // Find next incomplete item for actionable tip
  const nextItem = items.find(i => !i.done);

  // Progress ring
  const ringSize = 48;
  const strokeWidth = 4;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const ringColor = pct >= 80 ? "hsl(var(--score-excellent))" : pct >= 50 ? "hsl(var(--score-warning))" : "hsl(var(--score-critical))";

  return (
    <div className="space-y-3">
      {/* Header with mini ring */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize} className="-rotate-90">
            <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} strokeWidth={strokeWidth} fill="none" className="stroke-secondary" />
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={radius}
              strokeWidth={strokeWidth} fill="none"
              stroke={ringColor}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute text-[11px] font-bold tabular-nums">{pct}%</span>
        </div>
        <div>
          <span className="text-xs font-semibold">Completeness</span>
          <p className="text-[10px] text-muted-foreground">{doneCount}/{items.length} items done</p>
        </div>
      </div>

      {/* Alert for required */}
      {!requiredDone && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/10">
          <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
          <span className="text-[10px] text-destructive leading-relaxed">Complete all required fields before exporting.</span>
        </div>
      )}

      {/* Next action tip */}
      {nextItem && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
          <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-primary font-medium">Next step:</span>
            <span className="text-[10px] text-primary/80 ml-1">{nextItem.tip}</span>
          </div>
        </div>
      )}

      <CheckGroup title="Required" items={requiredItems} />
      <CheckGroup title="Recommended" items={recommendedItems} />
      <CheckGroup title="Optional" items={optionalItems} />
    </div>
  );
}

function CheckGroup({ title, items }: { title: string; items: CheckItem[] }) {
  const done = items.filter(i => i.done).length;
  const allDone = done === items.length;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</span>
        <span className={cn(
          "text-[10px] tabular-nums font-medium",
          allDone ? "text-score-excellent" : "text-muted-foreground"
        )}>{done}/{items.length}</span>
      </div>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-[11px] py-0.5 group">
          {item.done ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-score-excellent shrink-0" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
          )}
          <span className={cn(
            "flex-1",
            item.done ? "text-foreground" : "text-muted-foreground"
          )}>{item.label}</span>
          {!item.done && (
            <ArrowRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-primary transition-colors" />
          )}
        </div>
      ))}
    </div>
  );
}
