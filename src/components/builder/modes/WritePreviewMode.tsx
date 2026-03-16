import { ResumeData, TemplateName } from "@/types/resume";
import { ResumePreview } from "../ResumePreview";
import { LiveScoring } from "../LiveScoring";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface Props {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
  template: TemplateName;
  setTemplate: (t: TemplateName) => void;
  previewRef: React.RefObject<HTMLDivElement>;
  templateSelector: React.ReactNode;
}

export function WritePreviewMode({ data, setData, template, previewRef, templateSelector }: Props) {
  const [showScoring, setShowScoring] = useState(true);
  const uc = (field: string, val: string) => setData(prev => ({ ...prev, contact: { ...prev.contact, [field]: val } }));
  const uid = () => crypto.randomUUID();

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Writing Panel */}
      <div className="flex-1 overflow-y-auto bg-card p-6 space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Write Mode</h2>
          <button onClick={() => setShowScoring(!showScoring)} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
            {showScoring ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showScoring ? "Hide Score" : "Show Score"}
          </button>
        </div>

        {showScoring && (
          <div className="rounded-lg border p-3 bg-secondary/30">
            <LiveScoring data={data} />
          </div>
        )}

        {/* Name & Title */}
        <div className="space-y-3">
          <Input value={data.contact.name} onChange={e => uc("name", e.target.value)} placeholder="Your Full Name" className="text-lg font-semibold h-12 border-0 border-b rounded-none px-0 focus-visible:ring-0" />
          <Input value={data.contact.title} onChange={e => uc("title", e.target.value)} placeholder="Target Role / Job Title" className="text-sm h-9 border-0 border-b rounded-none px-0 focus-visible:ring-0 text-muted-foreground" />
        </div>

        {/* Contact Row */}
        <div className="grid grid-cols-2 gap-3">
          <Input value={data.contact.email} onChange={e => uc("email", e.target.value)} placeholder="Email" className="h-8 text-xs" />
          <Input value={data.contact.phone} onChange={e => uc("phone", e.target.value)} placeholder="Phone" className="h-8 text-xs" />
          <Input value={data.contact.location} onChange={e => uc("location", e.target.value)} placeholder="Location" className="h-8 text-xs" />
          <Input value={data.contact.linkedin} onChange={e => uc("linkedin", e.target.value)} placeholder="LinkedIn" className="h-8 text-xs" />
        </div>

        {/* Summary */}
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Professional Summary</Label>
          <Textarea value={data.summary} onChange={e => setData(prev => ({ ...prev, summary: e.target.value }))} placeholder="Write a compelling professional summary..." className="mt-2 min-h-[100px] text-sm border-0 border-b rounded-none px-0 focus-visible:ring-0 resize-none" />
        </div>

        {/* Experience */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Experience</Label>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setData(prev => ({ ...prev, experience: [...prev.experience, { id: uid(), company: "", title: "", location: "", startDate: "", endDate: "", current: false, bullets: [""] }] }))}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          {data.experience.map((exp, i) => (
            <div key={exp.id} className="space-y-2 pl-3 border-l-2 border-primary/20">
              <div className="flex items-center gap-2">
                <Input value={exp.title} onChange={e => setData(prev => ({ ...prev, experience: prev.experience.map((x, xi) => xi === i ? { ...x, title: e.target.value } : x) }))} placeholder="Job Title" className="h-8 text-sm font-medium border-0 px-0 focus-visible:ring-0" />
                <button onClick={() => setData(prev => ({ ...prev, experience: prev.experience.filter((_, xi) => xi !== i) }))} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <Input value={exp.company} onChange={e => setData(prev => ({ ...prev, experience: prev.experience.map((x, xi) => xi === i ? { ...x, company: e.target.value } : x) }))} placeholder="Company" className="h-7 text-xs border-0 px-0 focus-visible:ring-0" />
                <Input value={exp.startDate} onChange={e => setData(prev => ({ ...prev, experience: prev.experience.map((x, xi) => xi === i ? { ...x, startDate: e.target.value } : x) }))} placeholder="Start" className="h-7 text-xs border-0 px-0 focus-visible:ring-0 w-24" />
                <span className="self-center">–</span>
                <Input value={exp.endDate} onChange={e => setData(prev => ({ ...prev, experience: prev.experience.map((x, xi) => xi === i ? { ...x, endDate: e.target.value } : x) }))} placeholder="End" className="h-7 text-xs border-0 px-0 focus-visible:ring-0 w-24" />
              </div>
              {exp.bullets.map((b, bi) => (
                <div key={bi} className="flex gap-1">
                  <span className="text-muted-foreground mt-1.5 text-xs">•</span>
                  <Input value={b} onChange={e => setData(prev => ({ ...prev, experience: prev.experience.map((x, xi) => xi === i ? { ...x, bullets: x.bullets.map((bb, bbi) => bbi === bi ? e.target.value : bb) } : x) }))} placeholder="Achievement..." className="h-7 text-xs border-0 px-0 focus-visible:ring-0" />
                </div>
              ))}
              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground" onClick={() => setData(prev => ({ ...prev, experience: prev.experience.map((x, xi) => xi === i ? { ...x, bullets: [...x.bullets, ""] } : x) }))}>
                + bullet
              </Button>
            </div>
          ))}
        </div>

        {/* Education */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Education</Label>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setData(prev => ({ ...prev, education: [...prev.education, { id: uid(), institution: "", degree: "", field: "", startDate: "", endDate: "", gpa: "", honors: "" }] }))}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          {data.education.map((edu, i) => (
            <div key={edu.id} className="flex items-center gap-2">
              <Input value={edu.degree} onChange={e => setData(prev => ({ ...prev, education: prev.education.map((x, xi) => xi === i ? { ...x, degree: e.target.value } : x) }))} placeholder="Degree" className="h-8 text-sm border-0 px-0 focus-visible:ring-0" />
              <Input value={edu.institution} onChange={e => setData(prev => ({ ...prev, education: prev.education.map((x, xi) => xi === i ? { ...x, institution: e.target.value } : x) }))} placeholder="Institution" className="h-8 text-xs border-0 px-0 focus-visible:ring-0 text-muted-foreground" />
              <button onClick={() => setData(prev => ({ ...prev, education: prev.education.filter((_, xi) => xi !== i) }))} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>

        {/* Skills */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Skills</Label>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setData(prev => ({ ...prev, skills: [...prev.skills, { id: uid(), category: "", items: "" }] }))}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          {data.skills.map((sk, i) => (
            <div key={sk.id} className="flex gap-2">
              <Input value={sk.category} onChange={e => setData(prev => ({ ...prev, skills: prev.skills.map((x, xi) => xi === i ? { ...x, category: e.target.value } : x) }))} placeholder="Category" className="h-7 text-xs w-28 border-0 px-0 focus-visible:ring-0 font-medium" />
              <Input value={sk.items} onChange={e => setData(prev => ({ ...prev, skills: prev.skills.map((x, xi) => xi === i ? { ...x, items: e.target.value } : x) }))} placeholder="Skills..." className="h-7 text-xs border-0 px-0 focus-visible:ring-0" />
              <button onClick={() => setData(prev => ({ ...prev, skills: prev.skills.filter((_, xi) => xi !== i) }))} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 overflow-y-auto bg-secondary/30 p-6 flex flex-col items-center border-l">
        <div className="mb-4">{templateSelector}</div>
        <div className="shadow-xl rounded-lg overflow-hidden bg-white" style={{ width: 794, transform: "scale(0.65)", transformOrigin: "top center" }}>
          <div ref={previewRef}>
            <ResumePreview data={data} template={template} />
          </div>
        </div>
      </div>
    </div>
  );
}
