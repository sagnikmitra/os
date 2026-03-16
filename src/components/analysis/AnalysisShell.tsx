import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion } from "@/lib/motion-stub";
import { getScoreLevel, getScoreLabel, type ScoreLevel } from "@/components/ScoreCard";

/* ─── Score Ring ─── */
interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function ScoreRing({ score, size = 72, strokeWidth = 6, label, className }: ScoreRingProps) {
  const level = getScoreLevel(score);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  const colorMap: Record<ScoreLevel, string> = {
    excellent: "hsl(var(--score-excellent))",
    strong: "hsl(var(--score-strong))",
    warning: "hsl(var(--score-warning))",
    risk: "hsl(var(--score-risk))",
    critical: "hsl(var(--score-critical))",
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={colorMap[level]} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-display font-bold tabular-nums leading-none", `score-${level}`, size >= 72 ? "text-xl" : "text-base")}>{score}</span>
        {label && <span className="text-[8px] uppercase tracking-widest text-muted-foreground mt-0.5">{label}</span>}
      </div>
    </div>
  );
}

/* ─── Section Navigator (sticky) ─── */
interface SectionNavProps {
  sections: { id: string; label: string; icon?: React.ReactNode; count?: number }[];
  className?: string;
}

export function SectionNav({ sections, className }: SectionNavProps) {
  const [active, setActive] = useState(sections[0]?.id || "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          // Pick the one closest to the top
          const top = visible.reduce((a, b) => a.boundingClientRect.top < b.boundingClientRect.top ? a : b);
          setActive(top.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={cn("flex items-center gap-1.5 overflow-x-auto scrollbar-thin py-1", className)}>
      {sections.map(s => (
        <button
          key={s.id}
          onClick={() => scrollTo(s.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0",
            active === s.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          {s.icon}
          {s.label}
          {s.count !== undefined && (
            <span className={cn(
              "text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-0.5 tabular-nums",
              active === s.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>{s.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── Check Summary Bar ─── */
interface CheckSummaryBarProps {
  passed: number;
  warned: number;
  failed: number;
  className?: string;
}

export function CheckSummaryBar({ passed, warned, failed, className }: CheckSummaryBarProps) {
  const total = passed + warned + failed;
  if (total === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="font-semibold uppercase tracking-widest">Check Results</span>
        <span className="tabular-nums">{passed}/{total} passed</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
        <motion.div
          className="bg-score-excellent h-full"
          initial={{ width: 0 }}
          animate={{ width: `${(passed / total) * 100}%` }}
          transition={{ duration: 0.8, delay: 0.1 }}
        />
        <motion.div
          className="bg-score-warning h-full"
          initial={{ width: 0 }}
          animate={{ width: `${(warned / total) * 100}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        <motion.div
          className="bg-score-critical h-full"
          initial={{ width: 0 }}
          animate={{ width: `${(failed / total) * 100}%` }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
      </div>
      <div className="flex items-center gap-4 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-score-excellent" /> {passed} passed</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-score-warning" /> {warned} warned</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-score-critical" /> {failed} failed</span>
      </div>
    </div>
  );
}

/* ─── Collapsible Analysis Section ─── */
interface AnalysisSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AnalysisSection({ id, title, subtitle, icon, badge, defaultOpen = true, children, className }: AnalysisSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div id={id} className={cn("rounded-xl border bg-card overflow-hidden scroll-mt-20", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 sm:p-5 flex items-center gap-3 text-left hover:bg-secondary/20 transition-colors"
      >
        {icon && <span className="text-primary shrink-0">{icon}</span>}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{subtitle}</p>}
        </div>
        {badge}
        <motion.svg
          width="16" height="16" viewBox="0 0 16 16"
          className="text-muted-foreground shrink-0"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="overflow-hidden"
      >
        <div className="border-t">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Inline Tip ─── */
export function InlineTip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground leading-relaxed", className)}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

/* ─── Filter Chips ─── */
interface FilterChipProps {
  options: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function FilterChips({ options, value, onChange, className }: FilterChipProps) {
  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      {options.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
            value === o.id
              ? "bg-primary text-primary-foreground"
              : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span className={cn("ml-1.5 tabular-nums", value === o.id ? "text-primary-foreground/70" : "text-muted-foreground/60")}>{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
