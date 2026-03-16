import { ResumeData } from "@/types/resume";
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, Target, Zap, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface Props {
  data: ResumeData;
}

// Circular gauge component
function ScoreGauge({ score, size = 100 }: { score: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "hsl(var(--score-excellent))" : score >= 60 ? "hsl(var(--score-warning))" : "hsl(var(--score-critical))";
  const grade = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B+" : score >= 60 ? "B" : score >= 50 ? "C" : "D";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" className="stroke-secondary" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={strokeWidth} fill="none"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums" style={{ color }}>{score}</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{grade}</span>
      </div>
    </div>
  );
}

// Check for action verbs at start of bullets
const ACTION_VERBS = new Set([
  "achieved", "built", "created", "delivered", "designed", "developed", "drove", "earned",
  "enabled", "engineered", "established", "exceeded", "expanded", "generated", "grew",
  "implemented", "improved", "increased", "launched", "led", "managed", "mentored",
  "negotiated", "optimized", "orchestrated", "owned", "pioneered", "reduced", "resolved",
  "scaled", "shipped", "spearheaded", "streamlined", "transformed", "automated",
]);

function hasActionVerb(bullet: string): boolean {
  const first = bullet.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
  return ACTION_VERBS.has(first);
}

function hasQuantification(bullet: string): boolean {
  return /\d+[%$xX]|\$[\d,]+|\d+\+?\s*(users|customers|clients|team|people|members|projects|products|revenue|sales|increase|decrease|reduction|growth|improvement)/i.test(bullet);
}

export function LiveScoring({ data }: Props) {
  const analysis = useMemo(() => {
    const checks: { label: string; status: "pass" | "warn" | "fail"; category: string; tip?: string }[] = [];

    // Contact
    const contactFields = [data.contact.name, data.contact.email, data.contact.phone, data.contact.location, data.contact.title];
    const contactFilled = contactFields.filter(Boolean).length;
    checks.push({ label: "Contact info", status: contactFilled >= 4 ? "pass" : contactFilled >= 3 ? "warn" : "fail", category: "basics", tip: "Include name, email, phone, location & title" });

    // LinkedIn
    checks.push({ label: "LinkedIn URL", status: data.contact.linkedin ? "pass" : "warn", category: "basics", tip: "Add LinkedIn for recruiter reach" });

    // Summary
    const wordCount = data.summary.trim().split(/\s+/).filter(Boolean).length;
    checks.push({ label: `Summary (${wordCount} words)`, status: wordCount >= 25 ? "pass" : wordCount >= 10 ? "warn" : "fail", category: "content", tip: "Aim for 30-60 words" });

    // Experience
    checks.push({ label: `Experience (${data.experience.length} roles)`, status: data.experience.length >= 2 ? "pass" : data.experience.length >= 1 ? "warn" : "fail", category: "content", tip: "2-4 roles is ideal" });

    // Total bullets
    const allBullets = data.experience.flatMap(e => e.bullets.filter(b => b.trim()));
    const totalBullets = allBullets.length;
    checks.push({ label: `Bullets (${totalBullets})`, status: totalBullets >= 10 ? "pass" : totalBullets >= 5 ? "warn" : "fail", category: "content", tip: "Aim for 3-5 bullets per role" });

    // Action verbs
    const actionCount = allBullets.filter(hasActionVerb).length;
    const actionPct = totalBullets > 0 ? Math.round((actionCount / totalBullets) * 100) : 0;
    checks.push({ label: `Action verbs (${actionPct}%)`, status: actionPct >= 70 ? "pass" : actionPct >= 40 ? "warn" : "fail", category: "quality", tip: "Start bullets with strong action verbs" });

    // Quantified bullets
    const quantCount = allBullets.filter(hasQuantification).length;
    const quantPct = totalBullets > 0 ? Math.round((quantCount / totalBullets) * 100) : 0;
    checks.push({ label: `Quantified impact (${quantPct}%)`, status: quantPct >= 40 ? "pass" : quantPct >= 15 ? "warn" : "fail", category: "quality", tip: "Add numbers: %, $, users, etc." });

    // Bullet length
    const longBullets = allBullets.filter(b => b.length > 150).length;
    checks.push({ label: "Bullet brevity", status: longBullets === 0 ? "pass" : longBullets <= 2 ? "warn" : "fail", category: "quality", tip: "Keep bullets under 150 characters" });

    // Education
    checks.push({ label: "Education", status: data.education.length >= 1 ? "pass" : "fail", category: "basics", tip: "Add at least one education entry" });

    // Skills
    const skillItems = data.skills.reduce((s, sk) => s + sk.items.split(",").filter(i => i.trim()).length, 0);
    checks.push({ label: `Skills (${skillItems})`, status: skillItems >= 8 ? "pass" : skillItems >= 3 ? "warn" : "fail", category: "content", tip: "8-15 skills is optimal for ATS" });

    // Projects (bonus)
    if (data.projects.length > 0) {
      checks.push({ label: `Projects (${data.projects.length})`, status: "pass", category: "bonus" });
    }

    // Certifications (bonus)
    if (data.certifications.length > 0) {
      checks.push({ label: `Certifications (${data.certifications.length})`, status: "pass", category: "bonus" });
    }

    // Calculate weighted score
    const weights = { pass: 1, warn: 0.4, fail: 0 };
    const totalWeight = checks.length;
    const earned = checks.reduce((s, c) => s + weights[c.status], 0);
    const score = Math.round((earned / totalWeight) * 100);

    return { checks, score, actionPct, quantPct, totalBullets, wordCount, skillItems };
  }, [data]);

  const { checks, score, actionPct, quantPct } = analysis;
  const passCount = checks.filter(c => c.status === "pass").length;
  const warnCount = checks.filter(c => c.status === "warn").length;
  const failCount = checks.filter(c => c.status === "fail").length;

  const categories = [
    { id: "basics", label: "Essentials", icon: Target },
    { id: "content", label: "Content", icon: BarChart3 },
    { id: "quality", label: "Quality", icon: Zap },
    { id: "bonus", label: "Bonus", icon: TrendingUp },
  ];

  return (
    <div className="space-y-4">
      {/* Score Gauge */}
      <div className="flex flex-col items-center gap-2">
        <ScoreGauge score={score} size={96} />
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-score-excellent" />{passCount}</span>
          <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-score-warning" />{warnCount}</span>
          <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-score-critical" />{failCount}</span>
        </div>
      </div>

      {/* Category Checks */}
      {categories.map(cat => {
        const catChecks = checks.filter(c => c.category === cat.id);
        if (catChecks.length === 0) return null;
        return (
          <div key={cat.id} className="space-y-1">
            <div className="flex items-center gap-1.5 mb-1.5">
              <cat.icon className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{cat.label}</span>
            </div>
            {catChecks.map((c) => (
              <div key={c.label} className="flex items-center gap-2 text-[11px] group py-0.5">
                {c.status === "pass" ? <CheckCircle2 className="h-3.5 w-3.5 text-score-excellent shrink-0" /> :
                 c.status === "warn" ? <AlertTriangle className="h-3.5 w-3.5 text-score-warning shrink-0" /> :
                 <XCircle className="h-3.5 w-3.5 text-score-critical shrink-0" />}
                <span className={cn(
                  "flex-1",
                  c.status === "pass" ? "text-foreground" : "text-muted-foreground"
                )}>{c.label}</span>
              </div>
            ))}
          </div>
        );
      })}

      {/* Quick tip */}
      {failCount > 0 && (
        <div className="p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
          <p className="text-[10px] text-destructive leading-relaxed">
            <strong>Tip:</strong> {checks.find(c => c.status === "fail")?.tip || "Complete required fields to improve your score."}
          </p>
        </div>
      )}
      {failCount === 0 && warnCount > 0 && (
        <div className="p-2.5 rounded-lg bg-score-warning/5 border border-score-warning/10">
          <p className="text-[10px] text-score-warning leading-relaxed">
            <strong>Next:</strong> {checks.find(c => c.status === "warn")?.tip || "Polish remaining items to maximize your score."}
          </p>
        </div>
      )}
      {failCount === 0 && warnCount === 0 && (
        <div className="p-2.5 rounded-lg bg-score-excellent/5 border border-score-excellent/10">
          <p className="text-[10px] text-score-excellent leading-relaxed">
            <strong>🎉 Excellent!</strong> Your resume hits all key marks. Consider tailoring it per job description.
          </p>
        </div>
      )}
    </div>
  );
}
