import { ResumeData, TemplateName } from "@/types/resume";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface Props {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
  template: TemplateName;
  previewRef: React.RefObject<HTMLDivElement>;
}

export function SimpleDocsMode({ data, setData }: Props) {
  const uc = (field: string, val: string) => setData(prev => ({ ...prev, contact: { ...prev.contact, [field]: val } }));
  const uid = () => crypto.randomUUID();

  return (
    <div className="flex-1 overflow-y-auto flex justify-center bg-secondary/20">
      <div className="w-full max-w-[700px] bg-card shadow-lg my-8 rounded-lg border">
        {/* Document-like editing surface */}
        <div className="p-10 space-y-6">
          {/* Header */}
          <div className="text-center space-y-1 pb-4 border-b">
            <input
              value={data.contact.name}
              onChange={e => uc("name", e.target.value)}
              placeholder="Your Name"
              className="w-full text-center text-2xl font-bold bg-transparent border-0 outline-none placeholder:text-muted-foreground/40"
            />
            <input
              value={data.contact.title}
              onChange={e => uc("title", e.target.value)}
              placeholder="Job Title"
              className="w-full text-center text-sm text-muted-foreground bg-transparent border-0 outline-none placeholder:text-muted-foreground/30"
            />
            <div className="flex justify-center gap-4 mt-2">
              <input value={data.contact.email} onChange={e => uc("email", e.target.value)} placeholder="email" className="text-xs text-muted-foreground bg-transparent border-0 outline-none text-center w-32 placeholder:text-muted-foreground/30" />
              <input value={data.contact.phone} onChange={e => uc("phone", e.target.value)} placeholder="phone" className="text-xs text-muted-foreground bg-transparent border-0 outline-none text-center w-32 placeholder:text-muted-foreground/30" />
              <input value={data.contact.location} onChange={e => uc("location", e.target.value)} placeholder="location" className="text-xs text-muted-foreground bg-transparent border-0 outline-none text-center w-32 placeholder:text-muted-foreground/30" />
            </div>
          </div>

          {/* Summary */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Summary</h3>
            <textarea
              value={data.summary}
              onChange={e => setData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Write your professional summary..."
              className="w-full bg-transparent border-0 outline-none text-sm leading-relaxed resize-none min-h-[60px] placeholder:text-muted-foreground/30"
            />
          </div>

          {/* Experience */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Experience</h3>
              <button onClick={() => setData(prev => ({ ...prev, experience: [...prev.experience, { id: uid(), company: "", title: "", location: "", startDate: "", endDate: "", current: false, bullets: [""] }] }))} className="text-xs text-primary hover:underline">+ Add</button>
            </div>
            {data.experience.map((exp, i) => (
              <div key={exp.id} className="mb-4 group relative">
                <button onClick={() => setData(prev => ({ ...prev, experience: prev.experience.filter((_, xi) => xi !== i) }))} className="absolute -right-2 -top-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><X className="h-3 w-3" /></button>
                <div className="flex items-baseline gap-2">
                  <input value={exp.title} onChange={e => setData(prev => ({ ...prev, experience: prev.experience.map((x, xi) => xi === i ? { ...x, title: e.target.value } : x) }))} placeholder="Title" className="font-medium text-sm bg-transparent border-0 outline-none placeholder:text-muted-foreground/30" />
                  <span className="text-muted-foreground text-xs">at</span>
                  <input value={exp.company} onChange={e => setData(prev => ({ ...prev, experience: prev.experience.map((x, xi) => xi === i ? { ...x, company: e.target.value } : x) }))} placeholder="Company" className="text-sm bg-transparent border-0 outline-none placeholder:text-muted-foreground/30" />
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                  <input value={exp.startDate} onChange={e => setData(prev => ({ ...prev, experience: prev.experience.map((x, xi) => xi === i ? { ...x, startDate: e.target.value } : x) }))} placeholder="Start" className="bg-transparent border-0 outline-none w-20 placeholder:text-muted-foreground/30" />
                  <span>–</span>
                  <input value={exp.endDate} onChange={e => setData(prev => ({ ...prev, experience: prev.experience.map((x, xi) => xi === i ? { ...x, endDate: e.target.value } : x) }))} placeholder="End" className="bg-transparent border-0 outline-none w-20 placeholder:text-muted-foreground/30" />
                </div>
                <div className="mt-1.5 space-y-0.5">
                  {exp.bullets.map((b, bi) => (
                    <div key={bi} className="flex items-start gap-1.5">
                      <span className="text-muted-foreground text-xs mt-0.5">•</span>
                      <input value={b} onChange={e => setData(prev => ({ ...prev, experience: prev.experience.map((x, xi) => xi === i ? { ...x, bullets: x.bullets.map((bb, bbi) => bbi === bi ? e.target.value : bb) } : x) }))} placeholder="Achievement..." className="flex-1 text-xs bg-transparent border-0 outline-none placeholder:text-muted-foreground/30" />
                    </div>
                  ))}
                  <button onClick={() => setData(prev => ({ ...prev, experience: prev.experience.map((x, xi) => xi === i ? { ...x, bullets: [...x.bullets, ""] } : x) }))} className="text-[10px] text-muted-foreground hover:text-primary ml-3">+ bullet</button>
                </div>
              </div>
            ))}
          </div>

          {/* Education */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Education</h3>
              <button onClick={() => setData(prev => ({ ...prev, education: [...prev.education, { id: uid(), institution: "", degree: "", field: "", startDate: "", endDate: "", gpa: "", honors: "" }] }))} className="text-xs text-primary hover:underline">+ Add</button>
            </div>
            {data.education.map((edu, i) => (
              <div key={edu.id} className="mb-3 group relative">
                <button onClick={() => setData(prev => ({ ...prev, education: prev.education.filter((_, xi) => xi !== i) }))} className="absolute -right-2 -top-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><X className="h-3 w-3" /></button>
                <input value={edu.degree} onChange={e => setData(prev => ({ ...prev, education: prev.education.map((x, xi) => xi === i ? { ...x, degree: e.target.value } : x) }))} placeholder="Degree" className="font-medium text-sm bg-transparent border-0 outline-none placeholder:text-muted-foreground/30" />
                <input value={edu.institution} onChange={e => setData(prev => ({ ...prev, education: prev.education.map((x, xi) => xi === i ? { ...x, institution: e.target.value } : x) }))} placeholder="Institution" className="text-xs text-muted-foreground bg-transparent border-0 outline-none block placeholder:text-muted-foreground/30" />
              </div>
            ))}
          </div>

          {/* Skills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Skills</h3>
              <button onClick={() => setData(prev => ({ ...prev, skills: [...prev.skills, { id: uid(), category: "", items: "" }] }))} className="text-xs text-primary hover:underline">+ Add</button>
            </div>
            {data.skills.map((sk, i) => (
              <div key={sk.id} className="flex gap-2 mb-1 group">
                <input value={sk.category} onChange={e => setData(prev => ({ ...prev, skills: prev.skills.map((x, xi) => xi === i ? { ...x, category: e.target.value } : x) }))} placeholder="Category" className="text-xs font-medium bg-transparent border-0 outline-none w-24 placeholder:text-muted-foreground/30" />
                <span className="text-muted-foreground text-xs">:</span>
                <input value={sk.items} onChange={e => setData(prev => ({ ...prev, skills: prev.skills.map((x, xi) => xi === i ? { ...x, items: e.target.value } : x) }))} placeholder="Skills..." className="flex-1 text-xs bg-transparent border-0 outline-none placeholder:text-muted-foreground/30" />
                <button onClick={() => setData(prev => ({ ...prev, skills: prev.skills.filter((_, xi) => xi !== i) }))} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
