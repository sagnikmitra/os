import { useEffect, useRef, useState } from "react";
import { sampleResume, TemplateName } from "@/types/resume";
import { ResumePreview } from "./ResumePreview";

interface Props {
  template: TemplateName;
  selected: boolean;
  onSelect: () => void;
}

const THUMBNAIL_WIDTH = 794;
const THUMBNAIL_HEIGHT = 1123;

export function TemplatePreviewCard({ template, selected, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.22);

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
    <button
      onClick={onSelect}
      className={`group relative rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg ${
        selected ? "border-primary shadow-md ring-2 ring-primary/20" : "border-border hover:border-primary/40"
      }`}
    >
      {/* Scaled-down live preview */}
      <div ref={containerRef} className="w-full aspect-[794/1123] overflow-hidden bg-white relative">
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
      <div className="p-2.5 bg-card text-left">
        <p className="text-xs font-semibold capitalize">{template}</p>
        {selected && (
          <span className="text-[10px] text-primary font-medium">Active</span>
        )}
      </div>
    </button>
  );
}
