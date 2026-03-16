import { PortfolioSection, PortfolioSectionType } from "@/types/portfolio";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface Props {
  sections: PortfolioSection[];
  onChange: (sections: PortfolioSection[]) => void;
}

const sectionLabels: Record<PortfolioSectionType, string> = {
  hero: "Hero",
  about: "About",
  experience: "Experience",
  projects: "Projects",
  skills: "Skills",
  testimonials: "Testimonials",
  certifications: "Certifications",
  awards: "Awards",
  publications: "Publications",
  contact: "Contact",
  "resume-download": "Resume Download",
  writing: "Writing",
};

export default function PortfolioSectionManager({ sections, onChange }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  const sorted = [...sections].sort((a, b) => a.order - b.order);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragRef.current = index;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const fromIndex = dragRef.current;
    if (fromIndex === null || fromIndex === dropIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const updated = [...sorted];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(dropIndex, 0, moved);
    onChange(updated.map((s, i) => ({ ...s, order: i })));
    setDragIndex(null);
    setOverIndex(null);
    dragRef.current = null;
  }, [sorted, onChange]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
    dragRef.current = null;
  }, []);

  const toggleVisibility = (id: string) => {
    onChange(sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)));
  };

  return (
    <div className="space-y-1">
      {sorted.map((section, i) => (
        <div
          key={section.id}
          draggable
          onDragStart={(e) => handleDragStart(e, i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDrop={(e) => handleDrop(e, i)}
          onDragEnd={handleDragEnd}
          className={`flex items-center gap-2 p-2.5 rounded-lg transition-all cursor-grab active:cursor-grabbing select-none ${
            dragIndex === i
              ? "opacity-40 bg-primary/10 border border-primary/30"
              : overIndex === i && dragIndex !== null
              ? "bg-primary/5 border border-primary/20 scale-[1.02]"
              : "bg-secondary/30 hover:bg-secondary/50 border border-transparent"
          }`}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          <span className="flex-1 text-xs font-medium">{sectionLabels[section.type]}</span>
          <button onClick={() => toggleVisibility(section.id)} className="p-0.5">
            {section.visible ? (
              <Eye className="h-3.5 w-3.5 text-primary" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
