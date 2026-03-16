import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { motion } from "@/lib/motion-stub";
import { useNavigate } from "react-router-dom";
import { usePortfolios } from "@/hooks/usePortfolios";
import { Loader2 } from "lucide-react";

const templates = [
  { id: "minimal-editorial", name: "Minimal Editorial", desc: "Clean, typography-first personal website", bestFor: "Designers, writers, strategists, consultants", style: "Minimal", density: "Low", caseStudies: false },
  { id: "product-designer", name: "Product Designer", desc: "Case-study-heavy, high-trust portfolio", bestFor: "Product designers, UX/UI professionals", style: "Modern", density: "Medium", caseStudies: true },
  { id: "creative-visual", name: "Creative Visual", desc: "Visual but elegant portfolio layout", bestFor: "UI designers, brand designers, creatives", style: "Creative", density: "Medium", caseStudies: true },
  { id: "technical-pro", name: "Technical Professional", desc: "Sharp, modern, engineer-friendly personal site", bestFor: "Developers, engineers, data professionals", style: "Technical", density: "Medium", caseStudies: false },
  { id: "executive", name: "Executive / Leadership", desc: "Authority-driven, premium, restrained", bestFor: "Senior leaders, consultants, founders", style: "Premium", density: "Low", caseStudies: false },
  { id: "startup-operator", name: "Startup Operator", desc: "Action-oriented, modern, high-agency layout", bestFor: "PMs, startup operators, founders", style: "Modern", density: "Medium", caseStudies: true },
  { id: "research-academic", name: "Research / Academic", desc: "Publication and writing-friendly structure", bestFor: "Researchers, analysts, academics", style: "Classic", density: "High", caseStudies: false },
  { id: "hybrid-professional", name: "Hybrid Professional", desc: "Balanced about, experience, work, writing, contact", bestFor: "General high-performing professionals", style: "Balanced", density: "Medium", caseStudies: true },
];

export default function PortfolioTemplates() {
  const navigate = useNavigate();
  const { createPortfolio } = usePortfolios();
  const [creating, setCreating] = useState<string | null>(null);

  const handleSelect = async (templateId: string) => {
    setCreating(templateId);
    const newId = await createPortfolio("My Portfolio", templateId);
    setCreating(null);
    if (newId) {
      navigate(`/portfolio-editor?id=${newId}`);
    }
  };

  return (
    <AppLayout title="Portfolio Templates">
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">Portfolio Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            8 world-class templates designed for different professions and styles.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-2xl border bg-card overflow-hidden hover:border-primary/40 transition-all cursor-pointer"
              onClick={() => !creating && handleSelect(t.id)}
            >
              <div className="aspect-[4/3] bg-muted/50 border-b flex items-center justify-center">
                {creating === t.id ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <span className="text-xs text-muted-foreground font-medium">{t.style}</span>
                )}
              </div>
              <div className="p-4 space-y-2">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{t.style}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{t.density} density</span>
                  {t.caseStudies && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">Case studies</span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground pt-1">Best for: {t.bestFor}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
