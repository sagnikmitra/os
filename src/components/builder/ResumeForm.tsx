import { ResumeData, ExperienceEntry, EducationEntry, SkillCategory, ProjectEntry, CertificationEntry, AwardEntry, LanguageEntry, VolunteerEntry, PublicationEntry, TemplateName } from "@/types/resume";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, X, Briefcase, GraduationCap, Zap, FolderOpen, Award, Globe,
  Heart, BookOpen, BadgeCheck, User, FileText, ChevronDown, Wand2, Loader2, Sparkles, ImagePlus, Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { GenerateFromTextDialog } from "./GenerateFromTextDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
  template: TemplateName;
  onSwitchTemplate: (template: TemplateName) => void;
}

const uid = () => crypto.randomUUID();

async function compressImageToDataUrl(file: File): Promise<string> {
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unable to load image"));
      img.src = imageUrl;
    });

    const maxSide = 560;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(120, Math.round(image.width * scale));
    const height = Math.max(120, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Unable to process image");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", 0.84);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

// AI Rewrite button for individual bullets
function AIRewriteButton({
  bullet,
  context,
  onRewrite,
}: {
  bullet: string;
  context: string;
  onRewrite: (rewritten: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleRewrite = async () => {
    if (!bullet.trim()) return;
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("rewrite-bullets", {
        body: { bullets: [bullet], style: "humanize", context },
      });
      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);
      if (result?.rewrites?.[0]?.rewritten) {
        onRewrite(result.rewrites[0].rewritten);
        toast.success("Bullet rewritten!");
      }
    } catch (err: any) {
      toast.error(err.message || "Rewrite failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRewrite}
      disabled={loading || !bullet.trim()}
      className={cn(
        "shrink-0 p-1 rounded transition-all",
        loading ? "text-primary animate-pulse" : "text-muted-foreground/40 hover:text-primary hover:bg-primary/10",
        !bullet.trim() && "opacity-0 pointer-events-none"
      )}
      title="Rewrite with AI"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
    </button>
  );
}

// AI Rewrite button for text areas (summary, descriptions)
function AIRewriteTextButton({
  text,
  context,
  onRewrite,
  label = "Rewrite",
}: {
  text: string;
  context: string;
  onRewrite: (rewritten: string) => void;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleRewrite = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("rewrite-bullets", {
        body: { bullets: [text], style: "humanize", context },
      });
      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);
      if (result?.rewrites?.[0]?.rewritten) {
        onRewrite(result.rewrites[0].rewritten);
        toast.success("Text rewritten!");
      }
    } catch (err: any) {
      toast.error(err.message || "Rewrite failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 text-[10px] gap-1 text-primary/70 hover:text-primary"
      onClick={handleRewrite}
      disabled={loading || !text.trim()}
    >
      {loading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
      {loading ? "Rewriting..." : label}
    </Button>
  );
}

// Collapsible section component
function Section({
  icon: Icon,
  title,
  count,
  defaultOpen = false,
  children,
  onGenerate,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  onGenerate?: () => void;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/50">
      <div className="flex items-center">
        <button
          onClick={() => setOpen(!open)}
          className="flex-1 flex items-center gap-2.5 px-4 py-2.5 hover:bg-muted/30 transition-colors group"
        >
          <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="text-[11px] font-medium text-foreground flex-1 text-left">{title}</span>
          {badge && (
            <span className="text-[9px] font-medium text-primary bg-primary/10 rounded px-1.5 py-0.5">{badge}</span>
          )}
          {count !== undefined && count > 0 && (
            <span className="text-[9px] font-medium text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 tabular-nums">
              {count}
            </span>
          )}
          <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
        {onGenerate && (
          <button
            onClick={onGenerate}
            className="px-3 py-3 text-muted-foreground hover:text-primary transition-colors"
            title={`Generate ${title} from text`}
          >
            <Wand2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function FieldGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 }) {
  return (
    <div className={cn("grid gap-2.5", cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3")}>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );
}

function EntryCard({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2.5 relative group">
      <button
        onClick={onRemove}
        className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {children}
    </div>
  );
}

export function ResumeForm({ data, setData, template, onSwitchTemplate }: Props) {
  const [genDialog, setGenDialog] = useState<{ open: boolean; section: string; label: string }>({ open: false, section: "", label: "" });
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const u = <K extends keyof ResumeData>(key: K, val: ResumeData[K]) => setData(prev => ({ ...prev, [key]: val }));
  const uc = (field: string, val: string) => setData(prev => ({ ...prev, contact: { ...prev.contact, [field]: val } }));

  const handlePhotoFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image is too large. Use an image under 4MB.");
      return;
    }
    setPhotoUploading(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      uc("photoUrl", dataUrl);
      toast.success("Profile photo added.");
    } catch {
      toast.error("Could not process this image.");
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const addExp = () => u("experience", [...data.experience, { id: uid(), company: "", title: "", location: "", startDate: "", endDate: "", current: false, bullets: [""] }]);
  const rmExp = (i: number) => u("experience", data.experience.filter((_, idx) => idx !== i));
  const updExp = (i: number, f: Partial<ExperienceEntry>) => u("experience", data.experience.map((e, idx) => idx === i ? { ...e, ...f } : e));
  const addBullet = (i: number) => updExp(i, { bullets: [...data.experience[i].bullets, ""] });
  const rmBullet = (i: number, bi: number) => updExp(i, { bullets: data.experience[i].bullets.filter((_, idx) => idx !== bi) });
  const updBullet = (i: number, bi: number, v: string) => updExp(i, { bullets: data.experience[i].bullets.map((b, idx) => idx === bi ? v : b) });

  const addEdu = () => u("education", [...data.education, { id: uid(), institution: "", degree: "", field: "", startDate: "", endDate: "", gpa: "", honors: "" }]);
  const rmEdu = (i: number) => u("education", data.education.filter((_, idx) => idx !== i));
  const updEdu = (i: number, f: Partial<EducationEntry>) => u("education", data.education.map((e, idx) => idx === i ? { ...e, ...f } : e));

  const addSkill = () => u("skills", [...data.skills, { id: uid(), category: "", items: "" }]);
  const rmSkill = (i: number) => u("skills", data.skills.filter((_, idx) => idx !== i));
  const updSkill = (i: number, f: Partial<SkillCategory>) => u("skills", data.skills.map((e, idx) => idx === i ? { ...e, ...f } : e));

  const addProj = () => u("projects", [...data.projects, { id: uid(), name: "", description: "", url: "", technologies: "", bullets: [""] }]);
  const rmProj = (i: number) => u("projects", data.projects.filter((_, idx) => idx !== i));
  const updProj = (i: number, f: Partial<ProjectEntry>) => u("projects", data.projects.map((e, idx) => idx === i ? { ...e, ...f } : e));

  const addCert = () => u("certifications", [...data.certifications, { id: uid(), name: "", issuer: "", date: "" }]);
  const rmCert = (i: number) => u("certifications", data.certifications.filter((_, idx) => idx !== i));
  const updCert = (i: number, f: Partial<CertificationEntry>) => u("certifications", data.certifications.map((e, idx) => idx === i ? { ...e, ...f } : e));

  const addAward = () => u("awards", [...data.awards, { id: uid(), title: "", issuer: "", date: "", description: "" }]);
  const rmAward = (i: number) => u("awards", data.awards.filter((_, idx) => idx !== i));
  const updAward = (i: number, f: Partial<AwardEntry>) => u("awards", data.awards.map((e, idx) => idx === i ? { ...e, ...f } : e));

  const addLang = () => u("languages", [...data.languages, { id: uid(), language: "", proficiency: "" }]);
  const rmLang = (i: number) => u("languages", data.languages.filter((_, idx) => idx !== i));
  const updLang = (i: number, f: Partial<LanguageEntry>) => u("languages", data.languages.map((e, idx) => idx === i ? { ...e, ...f } : e));

  const addVol = () => u("volunteer", [...data.volunteer, { id: uid(), organization: "", role: "", startDate: "", endDate: "", description: "" }]);
  const rmVol = (i: number) => u("volunteer", data.volunteer.filter((_, idx) => idx !== i));
  const updVol = (i: number, f: Partial<VolunteerEntry>) => u("volunteer", data.volunteer.map((e, idx) => idx === i ? { ...e, ...f } : e));

  const addPub = () => u("publications", [...data.publications, { id: uid(), title: "", publisher: "", date: "", url: "" }]);
  const rmPub = (i: number) => u("publications", data.publications.filter((_, idx) => idx !== i));
  const updPub = (i: number, f: Partial<PublicationEntry>) => u("publications", data.publications.map((e, idx) => idx === i ? { ...e, ...f } : e));

  const openGen = (section: string, label: string) => setGenDialog({ open: true, section, label });

  const handleGenerated = (result: any) => {
    const section = genDialog.section;
    if (section === "contact") {
      setData(prev => ({ ...prev, contact: { ...prev.contact, ...result } }));
    } else if (section === "summary") {
      u("summary", result.summary || "");
    } else if (section === "experience") {
      const entries = (result.entries || []).map((e: any) => ({ id: uid(), company: e.company || "", title: e.title || "", location: e.location || "", startDate: e.startDate || "", endDate: e.endDate || "", current: e.current || false, bullets: e.bullets || [""] }));
      u("experience", [...data.experience, ...entries]);
    } else if (section === "education") {
      const entries = (result.entries || []).map((e: any) => ({ id: uid(), institution: e.institution || "", degree: e.degree || "", field: e.field || "", startDate: e.startDate || "", endDate: e.endDate || "", gpa: e.gpa || "", honors: e.honors || "" }));
      u("education", [...data.education, ...entries]);
    } else if (section === "skills") {
      const cats = (result.categories || []).map((c: any) => ({ id: uid(), category: c.category || "", items: c.items || "" }));
      u("skills", [...data.skills, ...cats]);
    } else if (section === "projects") {
      const entries = (result.entries || []).map((e: any) => ({ id: uid(), name: e.name || "", description: e.description || "", url: e.url || "", technologies: e.technologies || "", bullets: e.bullets || [""] }));
      u("projects", [...data.projects, ...entries]);
    } else if (section === "certifications") {
      const entries = (result.entries || []).map((e: any) => ({ id: uid(), name: e.name || "", issuer: e.issuer || "", date: e.date || "" }));
      u("certifications", [...data.certifications, ...entries]);
    } else if (section === "awards") {
      const entries = (result.entries || []).map((e: any) => ({ id: uid(), title: e.title || "", issuer: e.issuer || "", date: e.date || "", description: e.description || "" }));
      u("awards", [...data.awards, ...entries]);
    } else if (section === "languages") {
      const entries = (result.entries || []).map((e: any) => ({ id: uid(), language: e.language || "", proficiency: e.proficiency || "" }));
      u("languages", [...data.languages, ...entries]);
    } else if (section === "volunteer") {
      const entries = (result.entries || []).map((e: any) => ({ id: uid(), organization: e.organization || "", role: e.role || "", startDate: e.startDate || "", endDate: e.endDate || "", description: e.description || "" }));
      u("volunteer", [...data.volunteer, ...entries]);
    } else if (section === "publications") {
      const entries = (result.entries || []).map((e: any) => ({ id: uid(), title: e.title || "", publisher: e.publisher || "", date: e.date || "", url: e.url || "" }));
      u("publications", [...data.publications, ...entries]);
    }
  };

  const inputCls = "h-9 text-[11px] sm:text-[12px] bg-background border-border/60 focus:border-primary/50 transition-colors";
  const textareaCls = "text-[11px] sm:text-[12px] min-h-[86px] bg-background border-border/60 focus:border-primary/50 transition-colors";

  // Context for AI rewrite
  const aiContext = [data.contact.title, data.contact.name].filter(Boolean).join(" — ");
  const summaryWordCount = data.summary.trim().split(/\s+/).filter(Boolean).length;
  const summaryStatus = summaryWordCount >= 30 && summaryWordCount <= 60 ? "ideal" : summaryWordCount >= 20 ? "ok" : summaryWordCount > 60 ? "long" : "short";
  const uploadedPhotoFromDevice = data.contact.photoUrl.startsWith("data:");
  const photoUrlInputValue = uploadedPhotoFromDevice ? "" : data.contact.photoUrl;
  const templateSupportsPhoto = template === "designer-photo" || template === "minimal-photo";
  const photoHiddenByTemplate = !!data.contact.photoUrl.trim() && !templateSupportsPhoto;

  return (
    <div className="text-[13px] leading-[1.35]">
      {/* Contact */}
      <Section icon={User} title="Contact Info" defaultOpen onGenerate={() => openGen("contact", "Contact Info")}
        badge={[data.contact.name, data.contact.email, data.contact.phone].filter(Boolean).length >= 3 ? undefined : "Incomplete"}
      >
        <FieldGrid>
          <Field label="Full Name"><Input value={data.contact.name} onChange={e => uc("name", e.target.value)} placeholder="John Doe" className={inputCls} /></Field>
          <Field label="Job Title"><Input value={data.contact.title} onChange={e => uc("title", e.target.value)} placeholder="Software Engineer" className={inputCls} /></Field>
        </FieldGrid>
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Profile Photo (Optional)</Label>
            <span className="text-[9px] text-muted-foreground leading-relaxed">For photo-based templates</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-lg border border-border/60 overflow-hidden bg-background flex items-center justify-center shrink-0">
              {data.contact.photoUrl ? (
                <img src={data.contact.photoUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] text-muted-foreground">No photo</span>
              )}
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-[auto_auto_1fr] gap-2 items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-[11px] gap-1.5"
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
              >
                {photoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                {photoUploading ? "Uploading..." : "Upload Photo"}
              </Button>
              {data.contact.photoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px] gap-1.5 text-muted-foreground hover:text-destructive"
                  onClick={() => uc("photoUrl", "")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              )}
              <Input
                value={photoUrlInputValue}
                onChange={e => uc("photoUrl", e.target.value)}
                placeholder="Or paste image URL"
                className={inputCls}
              />
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handlePhotoFile(e.target.files?.[0])}
              />
            </div>
          </div>
          {uploadedPhotoFromDevice && (
            <p className="text-[9px] text-muted-foreground mt-2.5 leading-relaxed">Photo uploaded from device.</p>
          )}
          {photoHiddenByTemplate && (
            <div className="mt-2 rounded-md border border-score-warning/30 bg-score-warning/10 px-2.5 py-2">
              <p className="text-[10px] text-score-warning leading-relaxed">
                Photo is saved, but this template does not render profile photos.
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px]"
                  onClick={() => {
                    onSwitchTemplate("minimal-photo");
                    toast.success("Switched to Minimal Photo template.");
                  }}
                >
                  Use Minimal Photo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px]"
                  onClick={() => {
                    onSwitchTemplate("designer-photo");
                    toast.success("Switched to Designer Photo template.");
                  }}
                >
                  Use Designer Photo
                </Button>
              </div>
            </div>
          )}
        </div>
        <FieldGrid>
          <Field label="Email"><Input value={data.contact.email} onChange={e => uc("email", e.target.value)} placeholder="john@email.com" className={inputCls} /></Field>
          <Field label="Phone"><Input value={data.contact.phone} onChange={e => uc("phone", e.target.value)} placeholder="+1 234 567 8900" className={inputCls} /></Field>
        </FieldGrid>
        <Field label="Location"><Input value={data.contact.location} onChange={e => uc("location", e.target.value)} placeholder="San Francisco, CA" className={inputCls} /></Field>
        <FieldGrid>
          <Field label="LinkedIn"><Input value={data.contact.linkedin} onChange={e => uc("linkedin", e.target.value)} placeholder="linkedin.com/in/..." className={inputCls} /></Field>
          <Field label="Portfolio"><Input value={data.contact.portfolio} onChange={e => uc("portfolio", e.target.value)} placeholder="yoursite.com" className={inputCls} /></Field>
        </FieldGrid>
      </Section>

      {/* Summary */}
      <Section icon={FileText} title="Summary" defaultOpen onGenerate={() => openGen("summary", "Summary")}>
        <Textarea value={data.summary} onChange={e => u("summary", e.target.value)} placeholder="A brief professional summary highlighting your key strengths, core competencies, and career objectives in 2-3 sentences..." className={textareaCls} />
        <div className="flex items-start justify-between gap-3 pt-0.5">
          <div className="flex items-center gap-2.5">
            <span className={cn(
              "text-[10px] tabular-nums font-medium",
              summaryStatus === "ideal" ? "text-score-excellent" :
              summaryStatus === "ok" ? "text-score-warning" :
              summaryStatus === "long" ? "text-score-warning" :
              "text-muted-foreground"
            )}>
              {summaryWordCount} words
            </span>
            <span className="text-[10px] text-muted-foreground leading-relaxed">
              {summaryStatus === "ideal" ? "✓ Perfect length" :
               summaryStatus === "ok" ? "• Good, aim for 30-60" :
               summaryStatus === "long" ? "• Consider trimming" :
               "• Aim for 30-60 words"}
            </span>
          </div>
          <AIRewriteTextButton
            text={data.summary}
            context={aiContext}
            onRewrite={(rewritten) => u("summary", rewritten)}
            label="Rewrite with AI"
          />
        </div>
      </Section>

      {/* Experience */}
      <Section icon={Briefcase} title="Experience" count={data.experience.length} onGenerate={() => openGen("experience", "Experience")}>
        <div className="space-y-3">
          {data.experience.length === 0 && (
            <div className="text-center py-6 border border-dashed border-border/60 rounded-lg bg-muted/10">
              <Briefcase className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-[11px] text-muted-foreground mb-1">No experience entries yet</p>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">Add your work history or generate from text using the ✦ button above</p>
            </div>
          )}
          {data.experience.map((exp, i) => (
            <EntryCard key={exp.id} onRemove={() => rmExp(i)}>
              <FieldGrid>
                <Field label="Job Title"><Input value={exp.title} onChange={e => updExp(i, { title: e.target.value })} placeholder="Software Engineer" className={inputCls} /></Field>
                <Field label="Company"><Input value={exp.company} onChange={e => updExp(i, { company: e.target.value })} placeholder="Acme Corp" className={inputCls} /></Field>
              </FieldGrid>
              <FieldGrid cols={3}>
                <Field label="Location"><Input value={exp.location} onChange={e => updExp(i, { location: e.target.value })} placeholder="Remote" className={inputCls} /></Field>
                <Field label="Start"><Input value={exp.startDate} onChange={e => updExp(i, { startDate: e.target.value })} placeholder="Jan 2022" className={inputCls} /></Field>
                <Field label="End"><Input value={exp.endDate} onChange={e => updExp(i, { endDate: e.target.value })} placeholder="Present" disabled={exp.current} className={inputCls} /></Field>
              </FieldGrid>
              <Field label="Link / URL"><Input value={exp.url || ""} onChange={e => updExp(i, { url: e.target.value })} placeholder="https://company.com" className={inputCls} /></Field>
              <div className="flex items-center gap-2">
                <Checkbox checked={exp.current} onCheckedChange={(c) => updExp(i, { current: !!c, endDate: c ? "Present" : "" })} id={`cur-${i}`} />
                <Label htmlFor={`cur-${i}`} className="text-[10px] text-muted-foreground">Currently working here</Label>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Bullet Points</Label>
                  <span className={cn(
                    "text-[9px] tabular-nums",
                    exp.bullets.filter(Boolean).length >= 3 ? "text-score-excellent" :
                    exp.bullets.filter(Boolean).length >= 1 ? "text-score-warning" :
                    "text-muted-foreground"
                  )}>
                    {exp.bullets.filter(Boolean).length} / 3-5 recommended
                  </span>
                </div>
                {exp.bullets.map((b, bi) => (
                  <div key={bi} className="flex gap-1 items-center">
                    <span className="text-[10px] text-muted-foreground/50 w-4 text-right shrink-0">{bi + 1}</span>
                    <Input value={b} onChange={e => updBullet(i, bi, e.target.value)} placeholder="Achieved X by doing Y resulting in Z..." className={inputCls + " flex-1"} />
                    <AIRewriteButton
                      bullet={b}
                      context={`${exp.title} at ${exp.company}. ${aiContext}`}
                      onRewrite={(rewritten) => updBullet(i, bi, rewritten)}
                    />
                    <button onClick={() => rmBullet(i, bi)} className="text-muted-foreground/40 hover:text-destructive shrink-0"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground" onClick={() => addBullet(i)}><Plus className="h-2.5 w-2.5" /> Add bullet</Button>
              </div>
            </EntryCard>
          ))}
          <Button variant="outline" size="sm" className="w-full gap-1.5 h-8 text-[11px] border-dashed" onClick={addExp}><Plus className="h-3 w-3" /> Add Experience</Button>
        </div>
      </Section>

      {/* Education */}
      <Section icon={GraduationCap} title="Education" count={data.education.length} onGenerate={() => openGen("education", "Education")}>
        <div className="space-y-3">
          {data.education.map((edu, i) => (
            <EntryCard key={edu.id} onRemove={() => rmEdu(i)}>
              <FieldGrid>
                <Field label="Institution"><Input value={edu.institution} onChange={e => updEdu(i, { institution: e.target.value })} className={inputCls} /></Field>
                <Field label="Degree"><Input value={edu.degree} onChange={e => updEdu(i, { degree: e.target.value })} placeholder="Bachelor of Science" className={inputCls} /></Field>
              </FieldGrid>
              <FieldGrid cols={3}>
                <Field label="Field"><Input value={edu.field} onChange={e => updEdu(i, { field: e.target.value })} placeholder="Computer Science" className={inputCls} /></Field>
                <Field label="Start"><Input value={edu.startDate} onChange={e => updEdu(i, { startDate: e.target.value })} className={inputCls} /></Field>
                <Field label="End"><Input value={edu.endDate} onChange={e => updEdu(i, { endDate: e.target.value })} className={inputCls} /></Field>
              </FieldGrid>
              <FieldGrid>
                <Field label="GPA"><Input value={edu.gpa} onChange={e => updEdu(i, { gpa: e.target.value })} placeholder="3.8/4.0" className={inputCls} /></Field>
                <Field label="Honors"><Input value={edu.honors} onChange={e => updEdu(i, { honors: e.target.value })} placeholder="Magna Cum Laude" className={inputCls} /></Field>
              </FieldGrid>
              <Field label="Degree Verification / Link"><Input value={edu.url || ""} onChange={e => updEdu(i, { url: e.target.value })} placeholder="https://..." className={inputCls} /></Field>
            </EntryCard>
          ))}
          <Button variant="outline" size="sm" className="w-full gap-1.5 h-8 text-[11px] border-dashed" onClick={addEdu}><Plus className="h-3 w-3" /> Add Education</Button>
        </div>
      </Section>

      {/* Skills */}
      <Section icon={Zap} title="Skills" count={data.skills.length} onGenerate={() => openGen("skills", "Skills")}>
        <div className="space-y-2">
          {data.skills.map((sk, i) => (
            <div key={sk.id} className="grid grid-cols-1 sm:grid-cols-[110px_1fr_auto] gap-2 items-start group">
              <Input value={sk.category} onChange={e => updSkill(i, { category: e.target.value })} placeholder="Category" className={cn(inputCls)} />
              <Input value={sk.items} onChange={e => updSkill(i, { items: e.target.value })} placeholder="React, TypeScript, Node.js..." className={cn(inputCls)} />
              <button onClick={() => rmSkill(i)} className="text-muted-foreground/50 hover:text-destructive justify-self-end mt-1.5 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full gap-1.5 h-8 text-[11px] border-dashed" onClick={addSkill}><Plus className="h-3 w-3" /> Add Skill Category</Button>
        </div>
      </Section>

      {/* Projects */}
      <Section icon={FolderOpen} title="Projects" count={data.projects.length} onGenerate={() => openGen("projects", "Projects")}>
        <div className="space-y-3">
          {data.projects.map((proj, i) => (
            <EntryCard key={proj.id} onRemove={() => rmProj(i)}>
              <FieldGrid>
                <Field label="Name"><Input value={proj.name} onChange={e => updProj(i, { name: e.target.value })} className={inputCls} /></Field>
                <Field label="URL"><Input value={proj.url} onChange={e => updProj(i, { url: e.target.value })} className={inputCls} /></Field>
              </FieldGrid>
              <Field label="Technologies"><Input value={proj.technologies} onChange={e => updProj(i, { technologies: e.target.value })} placeholder="React, Node.js, PostgreSQL" className={inputCls} /></Field>
              <div>
                <Field label="Description"><Textarea value={proj.description} onChange={e => updProj(i, { description: e.target.value })} className={cn(textareaCls, "min-h-[40px]")} /></Field>
                <div className="flex justify-end mt-1">
                  <AIRewriteTextButton
                    text={proj.description}
                    context={`Project: ${proj.name}. ${aiContext}`}
                    onRewrite={(rewritten) => updProj(i, { description: rewritten })}
                    label="Rewrite"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Bullets</Label>
                {proj.bullets.map((b, bi) => (
                  <div key={bi} className="flex gap-1 items-center">
                    <Input value={b} onChange={e => updProj(i, { bullets: proj.bullets.map((x, xi) => xi === bi ? e.target.value : x) })} className={cn(inputCls, "flex-1")} />
                    <AIRewriteButton
                      bullet={b}
                      context={`Project: ${proj.name}. ${aiContext}`}
                      onRewrite={(rewritten) => updProj(i, { bullets: proj.bullets.map((x, xi) => xi === bi ? rewritten : x) })}
                    />
                    <button onClick={() => updProj(i, { bullets: proj.bullets.filter((_, xi) => xi !== bi) })} className="text-muted-foreground/40 hover:text-destructive shrink-0"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground" onClick={() => updProj(i, { bullets: [...proj.bullets, ""] })}><Plus className="h-2.5 w-2.5" /> Add bullet</Button>
              </div>
            </EntryCard>
          ))}
          <Button variant="outline" size="sm" className="w-full gap-1.5 h-8 text-[11px] border-dashed" onClick={addProj}><Plus className="h-3 w-3" /> Add Project</Button>
        </div>
      </Section>

      {/* Certifications */}
      <Section icon={BadgeCheck} title="Certifications" count={data.certifications.length} onGenerate={() => openGen("certifications", "Certifications")}>
        <div className="space-y-2">
          {data.certifications.map((c, i) => (
            <div key={c.id} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_96px_1.4fr_auto] gap-2 items-start group">
              <Input value={c.name} onChange={e => updCert(i, { name: e.target.value })} placeholder="Certification" className={cn(inputCls)} />
              <Input value={c.issuer} onChange={e => updCert(i, { issuer: e.target.value })} placeholder="Issuer" className={cn(inputCls)} />
              <Input value={c.date} onChange={e => updCert(i, { date: e.target.value })} placeholder="2024" className={cn(inputCls)} />
              <Input value={c.url || ""} onChange={e => updCert(i, { url: e.target.value })} placeholder="Credentials URL" className={cn(inputCls)} />
              <button onClick={() => rmCert(i)} className="text-muted-foreground/50 hover:text-destructive justify-self-end mt-1.5 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full gap-1.5 h-8 text-[11px] border-dashed" onClick={addCert}><Plus className="h-3 w-3" /> Add Certification</Button>
        </div>
      </Section>

      {/* Awards */}
      <Section icon={Award} title="Awards" count={data.awards.length} onGenerate={() => openGen("awards", "Awards")}>
        <div className="space-y-3">
          {data.awards.map((a, i) => (
            <EntryCard key={a.id} onRemove={() => rmAward(i)}>
              <FieldGrid cols={3}>
                <Field label="Title"><Input value={a.title} onChange={e => updAward(i, { title: e.target.value })} className={inputCls} /></Field>
                <Field label="Issuer"><Input value={a.issuer} onChange={e => updAward(i, { issuer: e.target.value })} className={inputCls} /></Field>
                <Field label="Date"><Input value={a.date} onChange={e => updAward(i, { date: e.target.value })} className={inputCls} /></Field>
              </FieldGrid>
              <div>
                <FieldGrid cols={2}>
                  <Field label="Description"><Input value={a.description} onChange={e => updAward(i, { description: e.target.value })} placeholder="Brief description" className={inputCls} /></Field>
                  <Field label="Link"><Input value={a.url || ""} onChange={e => updAward(i, { url: e.target.value })} placeholder="https://..." className={inputCls} /></Field>
                </FieldGrid>
              </div>
            </EntryCard>
          ))}
          <Button variant="outline" size="sm" className="w-full gap-1.5 h-8 text-[11px] border-dashed" onClick={addAward}><Plus className="h-3 w-3" /> Add Award</Button>
        </div>
      </Section>

      {/* Languages */}
      <Section icon={Globe} title="Languages" count={data.languages.length} onGenerate={() => openGen("languages", "Languages")}>
        <div className="space-y-2">
          {data.languages.map((l, i) => (
            <div key={l.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-start group">
              <Input value={l.language} onChange={e => updLang(i, { language: e.target.value })} placeholder="Language" className={cn(inputCls)} />
              <Input value={l.proficiency} onChange={e => updLang(i, { proficiency: e.target.value })} placeholder="Native / Fluent" className={cn(inputCls)} />
              <button onClick={() => rmLang(i)} className="text-muted-foreground/50 hover:text-destructive justify-self-end mt-1.5 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full gap-1.5 h-8 text-[11px] border-dashed" onClick={addLang}><Plus className="h-3 w-3" /> Add Language</Button>
        </div>
      </Section>

      {/* Volunteer */}
      <Section icon={Heart} title="Volunteer" count={data.volunteer.length} onGenerate={() => openGen("volunteer", "Volunteer")}>
        <div className="space-y-3">
          {data.volunteer.map((v, i) => (
            <EntryCard key={v.id} onRemove={() => rmVol(i)}>
              <FieldGrid>
                <Field label="Organization"><Input value={v.organization} onChange={e => updVol(i, { organization: e.target.value })} className={inputCls} /></Field>
                <Field label="Role"><Input value={v.role} onChange={e => updVol(i, { role: e.target.value })} className={inputCls} /></Field>
              </FieldGrid>
              <FieldGrid>
                <Field label="Start"><Input value={v.startDate} onChange={e => updVol(i, { startDate: e.target.value })} className={inputCls} /></Field>
                <Field label="End"><Input value={v.endDate} onChange={e => updVol(i, { endDate: e.target.value })} className={inputCls} /></Field>
              </FieldGrid>
              <Field label="Link"><Input value={v.url || ""} onChange={e => updVol(i, { url: e.target.value })} placeholder="https://..." className={inputCls} /></Field>
              <div>
                <Field label="Description"><Textarea value={v.description} onChange={e => updVol(i, { description: e.target.value })} className={cn(textareaCls, "min-h-[40px]")} /></Field>
                <div className="flex justify-end mt-1">
                  <AIRewriteTextButton
                    text={v.description}
                    context={`Volunteer at ${v.organization}. ${aiContext}`}
                    onRewrite={(rewritten) => updVol(i, { description: rewritten })}
                    label="Rewrite"
                  />
                </div>
              </div>
            </EntryCard>
          ))}
          <Button variant="outline" size="sm" className="w-full gap-1.5 h-8 text-[11px] border-dashed" onClick={addVol}><Plus className="h-3 w-3" /> Add Volunteer</Button>
        </div>
      </Section>

      {/* Publications */}
      <Section icon={BookOpen} title="Publications" count={data.publications.length} onGenerate={() => openGen("publications", "Publications")}>
        <div className="space-y-3">
          {data.publications.map((p, i) => (
            <EntryCard key={p.id} onRemove={() => rmPub(i)}>
              <Field label="Title"><Input value={p.title} onChange={e => updPub(i, { title: e.target.value })} className={inputCls} /></Field>
              <FieldGrid cols={3}>
                <Field label="Publisher"><Input value={p.publisher} onChange={e => updPub(i, { publisher: e.target.value })} className={inputCls} /></Field>
                <Field label="Date"><Input value={p.date} onChange={e => updPub(i, { date: e.target.value })} className={inputCls} /></Field>
                <Field label="URL"><Input value={p.url} onChange={e => updPub(i, { url: e.target.value })} className={inputCls} /></Field>
              </FieldGrid>
            </EntryCard>
          ))}
          <Button variant="outline" size="sm" className="w-full gap-1.5 h-8 text-[11px] border-dashed" onClick={addPub}><Plus className="h-3 w-3" /> Add Publication</Button>
        </div>
      </Section>

      {/* Generate from text dialog */}
      <GenerateFromTextDialog
        open={genDialog.open}
        onOpenChange={(open) => setGenDialog(prev => ({ ...prev, open }))}
        section={genDialog.section}
        sectionLabel={genDialog.label}
        onGenerated={handleGenerated}
      />
    </div>
  );
}
