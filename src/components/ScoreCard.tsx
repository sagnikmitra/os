import { cn } from "@/lib/utils";
import { motion } from "@/lib/motion-stub";

export type ScoreLevel = "excellent" | "strong" | "warning" | "risk" | "critical";

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 85) return "excellent";
  if (score >= 70) return "strong";
  if (score >= 50) return "warning";
  if (score >= 30) return "risk";
  return "critical";
}

export function getScoreLabel(level: ScoreLevel): string {
  return { excellent: "Excellent", strong: "Strong", warning: "Needs Work", risk: "High Risk", critical: "Critical" }[level];
}

interface ScoreCardProps {
  title: string;
  score: number;
  description?: string;
  icon?: React.ReactNode;
  compact?: boolean;
}

export function ScoreCard({ title, score, description, icon, compact }: ScoreCardProps) {
  const level = getScoreLevel(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -2, transition: { duration: 0.25 } }}
      className={cn(
        "rounded-2xl border bg-card p-3.5 sm:p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/[0.04] group",
        `score-border-${level}`
      )}
    >
      {/* Title row with badge */}
      <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          {icon && <span className="text-muted-foreground group-hover:text-primary transition-colors duration-300 shrink-0">{icon}</span>}
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight truncate">{title}</span>
        </div>
        <span className={cn(
          "text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg shrink-0 whitespace-nowrap",
          `score-${level} score-bg-${level}`
        )}>
          {getScoreLabel(level)}
        </span>
      </div>

      {/* Score */}
      <div className="flex items-baseline gap-1.5 sm:gap-2">
        <span className={cn("font-display text-2xl sm:text-3xl font-bold stat-number", `score-${level}`)}>{score}</span>
        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground/50">/ 100</span>
      </div>

      {/* Description */}
      {!compact && description && <p className="text-[11px] sm:text-xs text-muted-foreground mt-2 sm:mt-2.5 leading-relaxed line-clamp-2">{description}</p>}

      {/* Progress bar */}
      {!compact && (
        <div className="mt-3 sm:mt-4 h-1 sm:h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={cn("h-full rounded-full", {
              "bg-score-excellent": level === "excellent",
              "bg-score-strong": level === "strong",
              "bg-score-warning": level === "warning",
              "bg-score-risk": level === "risk",
              "bg-score-critical": level === "critical",
            })}
          />
        </div>
      )}
    </motion.div>
  );
}

export function SeverityBadge({ level, label }: { level: ScoreLevel; label?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg whitespace-nowrap",
      `score-${level} score-bg-${level}`
    )}>
      {label || getScoreLabel(level)}
    </span>
  );
}
