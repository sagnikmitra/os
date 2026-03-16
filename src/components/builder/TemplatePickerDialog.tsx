import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TemplateName, sampleResume } from "@/types/resume";
import { ResumePreview } from "./ResumePreview";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { TEMPLATE_META } from "@/lib/resume-audit";

const templateOptions = (Object.keys(TEMPLATE_META) as TemplateName[]).map((id) => TEMPLATE_META[id]);
const THUMBNAIL_WIDTH = 794;
const THUMBNAIL_HEIGHT = 1123;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TemplateName;
  onSelect: (template: TemplateName) => void;
}

function LiveTemplateThumbnail({ template }: { template: TemplateName }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);

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
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-white">
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

export function TemplatePickerDialog({ open, onOpenChange, template, onSelect }: Props) {
  const [hoveredTemplate, setHoveredTemplate] = useState<TemplateName | null>(null);
  const groups = (Array.from(new Set(templateOptions.map((item) => item.group))) as Array<(typeof templateOptions)[number]["group"]>).sort((a, b) => {
    const order = { Standard: 0, Designer: 1, LaTeX: 2 } as const;
    return order[a] - order[b];
  });

  const getFitTone = (fit: "excellent" | "strong" | "fair") => {
    if (fit === "excellent") return "bg-score-excellent/10 text-score-excellent border-score-excellent/20";
    if (fit === "strong") return "bg-score-warning/10 text-score-warning border-score-warning/20";
    return "bg-score-critical/10 text-score-critical border-score-critical/20";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-base font-semibold">Choose Template</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select a template style. Your content will be preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {groups.map(group => {
            const groupTemplates = templateOptions.filter(t => t.group === group);
            return (
              <div key={group} className="mb-6 last:mb-0">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">{group}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupTemplates.map(t => {
                    const isSelected = template === t.id;
                    const isHovered = hoveredTemplate === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => { onSelect(t.id); onOpenChange(false); }}
                        onMouseEnter={() => setHoveredTemplate(t.id)}
                        onMouseLeave={() => setHoveredTemplate(null)}
                        className={cn(
                          "group relative rounded-lg border-2 overflow-hidden transition-all duration-200 text-left",
                          isSelected
                            ? "border-primary shadow-md ring-2 ring-primary/20"
                            : "border-border hover:border-primary/40 hover:shadow-md"
                        )}
                      >
                        {/* Scaled-down live preview */}
                        <div className="w-full aspect-[794/1123] overflow-hidden bg-white relative">
                          <LiveTemplateThumbnail template={t.id} />
                          {/* Overlay on hover */}
                          {(isHovered && !isSelected) && (
                            <div className="absolute inset-0 bg-primary/5 transition-opacity" />
                          )}
                        </div>

                        {/* Label */}
                        <div className="px-3 py-2.5 bg-card border-t border-border/50">
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                                <Check className="h-2.5 w-2.5 text-primary-foreground" />
                              </div>
                            )}
                            <div className={isSelected ? "" : "pl-6"}>
                              <p className="text-xs font-semibold text-foreground">{t.label}</p>
                              <p className="text-[10px] text-muted-foreground leading-tight">{t.description}</p>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                <span className={cn("text-[9px] font-semibold rounded-full border px-1.5 py-0.5", getFitTone(t.atsFit))}>
                                  ATS {t.atsFit}
                                </span>
                                <span className={cn(
                                  "text-[9px] font-semibold rounded-full border px-1.5 py-0.5",
                                  t.parseRisk === "low"
                                    ? "bg-score-excellent/10 text-score-excellent border-score-excellent/20"
                                    : t.parseRisk === "medium"
                                    ? "bg-score-warning/10 text-score-warning border-score-warning/20"
                                    : "bg-score-critical/10 text-score-critical border-score-critical/20"
                                )}>
                                  Risk {t.parseRisk}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
