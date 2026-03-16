import { ResumeData, TemplateName } from "@/types/resume";
import { ResumePreview } from "../ResumePreview";
import { LiveScoring } from "../LiveScoring";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useRef, useCallback } from "react";
import { GripVertical, Eye, EyeOff, Palette } from "lucide-react";

interface Props {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
  template: TemplateName;
  setTemplate: (t: TemplateName) => void;
  previewRef: React.RefObject<HTMLDivElement>;
  templateSelector: React.ReactNode;
}

type SectionKey = "summary" | "experience" | "education" | "skills" | "projects" | "certifications" | "awards" | "languages" | "volunteer" | "publications";

const defaultSections: { key: SectionKey; label: string; visible: boolean }[] = [
  { key: "summary", label: "Summary", visible: true },
  { key: "experience", label: "Experience", visible: true },
  { key: "education", label: "Education", visible: true },
  { key: "skills", label: "Skills", visible: true },
  { key: "projects", label: "Projects", visible: true },
  { key: "certifications", label: "Certifications", visible: true },
  { key: "awards", label: "Awards", visible: false },
  { key: "languages", label: "Languages", visible: false },
  { key: "volunteer", label: "Volunteering", visible: false },
  { key: "publications", label: "Publications", visible: false },
];

export function VisualComposerMode({ data, setData, template, setTemplate, previewRef, templateSelector }: Props) {
  const [sections, setSections] = useState(defaultSections);
  const [density, setDensity] = useState([50]);
  const [fontSize, setFontSize] = useState([14]);
  const [accentColor, setAccentColor] = useState("indigo");
  const [showDividers, setShowDividers] = useState(true);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragRef.current = index;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
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
    setSections(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(dropIndex, 0, moved);
      return updated;
    });
    setDragIndex(null);
    setOverIndex(null);
    dragRef.current = null;
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
    dragRef.current = null;
  }, []);

  const toggleSection = (index: number) => {
    setSections(prev => prev.map((s, i) => i === index ? { ...s, visible: !s.visible } : s));
  };

  const accentColors = [
    { id: "indigo", label: "Indigo", class: "bg-primary" },
    { id: "slate", label: "Slate", class: "bg-foreground" },
    { id: "emerald", label: "Emerald", class: "bg-score-excellent" },
    { id: "amber", label: "Amber", class: "bg-score-warning" },
    { id: "rose", label: "Rose", class: "bg-destructive" },
  ];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Composer Panel */}
      <div className="w-[320px] shrink-0 border-r overflow-y-auto bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Visual Composer</h3>
          </div>
          <p className="text-xs text-muted-foreground">Drag sections to reorder. Toggle visibility.</p>
        </div>

        {/* Section Ordering with Drag & Drop */}
        <div className="p-4 border-b space-y-1">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">Section Order & Visibility</Label>
          {sections.map((section, i) => (
            <div
              key={section.key}
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
              <span className="flex-1 text-xs font-medium">{section.label}</span>
              <button onClick={() => toggleSection(i)} className="p-0.5">
                {section.visible ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            </div>
          ))}
        </div>

        {/* Style Controls */}
        <div className="p-4 border-b space-y-4">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Style Controls</Label>

          <div className="space-y-2">
            <div className="flex justify-between text-xs"><span>Density</span><span className="text-muted-foreground">{density[0]}%</span></div>
            <Slider value={density} onValueChange={setDensity} min={20} max={100} step={5} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs"><span>Font Size</span><span className="text-muted-foreground">{fontSize[0]}px</span></div>
            <Slider value={fontSize} onValueChange={setFontSize} min={10} max={18} step={1} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs">Section Dividers</span>
            <Switch checked={showDividers} onCheckedChange={setShowDividers} />
          </div>

          <div className="space-y-2">
            <span className="text-xs">Accent Color</span>
            <div className="flex gap-2">
              {accentColors.map(c => (
                <button key={c.id} onClick={() => setAccentColor(c.id)} className={`w-6 h-6 rounded-full ${c.class} transition-all ${accentColor === c.id ? "ring-2 ring-offset-2 ring-ring" : "opacity-60 hover:opacity-100"}`} title={c.label} />
              ))}
            </div>
          </div>
        </div>

        {/* Template */}
        <div className="p-4 border-b space-y-2">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Template</Label>
          {templateSelector}
        </div>

        {/* Scoring */}
        <div className="p-4">
          <LiveScoring data={data} />
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-y-auto bg-secondary/30 p-8 flex flex-col items-center">
        <div className="shadow-xl rounded-lg overflow-hidden bg-white" style={{ width: 794 }}>
          <div ref={previewRef}>
            <ResumePreview data={data} template={template} />
          </div>
        </div>
      </div>
    </div>
  );
}
