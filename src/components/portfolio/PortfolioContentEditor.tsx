import { PortfolioData } from "@/types/portfolio";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  data: PortfolioData;
  onChange: (data: PortfolioData) => void;
}

export default function PortfolioContentEditor({ data, onChange }: Props) {
  const update = <K extends keyof PortfolioData>(key: K, value: PortfolioData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const addProject = () => {
    update("projects", [
      ...data.projects,
      { id: genId(), title: "", description: "", imageUrl: "", tags: [], url: "", featured: false },
    ]);
  };

  const addExperience = () => {
    update("experience", [
      ...data.experience,
      { id: genId(), company: "", role: "", period: "", description: "", highlights: [] },
    ]);
  };

  const addSkill = () => {
    update("skills", [
      ...data.skills,
      { id: genId(), category: "", items: [] },
    ]);
  };

  return (
    <Tabs defaultValue="hero" className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1 bg-secondary/50">
        <TabsTrigger value="hero" className="text-xs">Hero</TabsTrigger>
        <TabsTrigger value="about" className="text-xs">About</TabsTrigger>
        <TabsTrigger value="experience" className="text-xs">Experience</TabsTrigger>
        <TabsTrigger value="projects" className="text-xs">Projects</TabsTrigger>
        <TabsTrigger value="skills" className="text-xs">Skills</TabsTrigger>
        <TabsTrigger value="contact" className="text-xs">Contact</TabsTrigger>
      </TabsList>

      <TabsContent value="hero" className="p-4 space-y-3">
        <div>
          <Label className="text-xs">Headline</Label>
          <Input value={data.hero.headline} onChange={(e) => update("hero", { ...data.hero, headline: e.target.value })} placeholder="Your name or positioning" />
        </div>
        <div>
          <Label className="text-xs">Subheadline</Label>
          <Textarea value={data.hero.subheadline} onChange={(e) => update("hero", { ...data.hero, subheadline: e.target.value })} placeholder="Brief intro" rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">CTA Text</Label>
            <Input value={data.hero.ctaText} onChange={(e) => update("hero", { ...data.hero, ctaText: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">CTA URL</Label>
            <Input value={data.hero.ctaUrl} onChange={(e) => update("hero", { ...data.hero, ctaUrl: e.target.value })} />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="about" className="p-4 space-y-3">
        <div>
          <Label className="text-xs">Section Title</Label>
          <Input value={data.about.title} onChange={(e) => update("about", { ...data.about, title: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Bio</Label>
          <Textarea value={data.about.bio} onChange={(e) => update("about", { ...data.about, bio: e.target.value })} rows={4} placeholder="Tell your story" />
        </div>
      </TabsContent>

      <TabsContent value="experience" className="p-4 space-y-4">
        {data.experience.map((exp, i) => (
          <div key={exp.id} className="p-3 rounded-xl border bg-card space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update("experience", data.experience.filter((_, j) => j !== i))}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <Input value={exp.role} onChange={(e) => {
              const updated = [...data.experience];
              updated[i] = { ...updated[i], role: e.target.value };
              update("experience", updated);
            }} placeholder="Role" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={exp.company} onChange={(e) => {
                const updated = [...data.experience];
                updated[i] = { ...updated[i], company: e.target.value };
                update("experience", updated);
              }} placeholder="Company" />
              <Input value={exp.period} onChange={(e) => {
                const updated = [...data.experience];
                updated[i] = { ...updated[i], period: e.target.value };
                update("experience", updated);
              }} placeholder="2020 – Present" />
            </div>
            <Textarea value={exp.description} onChange={(e) => {
              const updated = [...data.experience];
              updated[i] = { ...updated[i], description: e.target.value };
              update("experience", updated);
            }} placeholder="Description" rows={2} />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addExperience} className="gap-1.5 w-full">
          <Plus className="h-3.5 w-3.5" /> Add Experience
        </Button>
      </TabsContent>

      <TabsContent value="projects" className="p-4 space-y-4">
        {data.projects.map((p, i) => (
          <div key={p.id} className="p-3 rounded-xl border bg-card space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update("projects", data.projects.filter((_, j) => j !== i))}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <Input value={p.title} onChange={(e) => {
              const updated = [...data.projects];
              updated[i] = { ...updated[i], title: e.target.value };
              update("projects", updated);
            }} placeholder="Project title" />
            <Textarea value={p.description} onChange={(e) => {
              const updated = [...data.projects];
              updated[i] = { ...updated[i], description: e.target.value };
              update("projects", updated);
            }} placeholder="Description" rows={2} />
            <div className="grid grid-cols-2 gap-2">
              <Input value={p.url} onChange={(e) => {
                const updated = [...data.projects];
                updated[i] = { ...updated[i], url: e.target.value };
                update("projects", updated);
              }} placeholder="URL" />
              <Input value={p.tags.join(", ")} onChange={(e) => {
                const updated = [...data.projects];
                updated[i] = { ...updated[i], tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) };
                update("projects", updated);
              }} placeholder="Tags (comma separated)" />
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addProject} className="gap-1.5 w-full">
          <Plus className="h-3.5 w-3.5" /> Add Project
        </Button>
      </TabsContent>

      <TabsContent value="skills" className="p-4 space-y-4">
        {data.skills.map((s, i) => (
          <div key={s.id} className="p-3 rounded-xl border bg-card space-y-2">
            <div className="flex justify-between items-center">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update("skills", data.skills.filter((_, j) => j !== i))}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <Input value={s.category} onChange={(e) => {
              const updated = [...data.skills];
              updated[i] = { ...updated[i], category: e.target.value };
              update("skills", updated);
            }} placeholder="Category" />
            <Input value={s.items.join(", ")} onChange={(e) => {
              const updated = [...data.skills];
              updated[i] = { ...updated[i], items: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) };
              update("skills", updated);
            }} placeholder="Skills (comma separated)" />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addSkill} className="gap-1.5 w-full">
          <Plus className="h-3.5 w-3.5" /> Add Skill Category
        </Button>
      </TabsContent>

      <TabsContent value="contact" className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Email</Label>
            <Input value={data.contact.email} onChange={(e) => update("contact", { ...data.contact, email: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Phone</Label>
            <Input value={data.contact.phone} onChange={(e) => update("contact", { ...data.contact, phone: e.target.value })} />
          </div>
        </div>
        <div>
          <Label className="text-xs">Location</Label>
          <Input value={data.contact.location} onChange={(e) => update("contact", { ...data.contact, location: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">LinkedIn</Label>
            <Input value={data.contact.linkedin} onChange={(e) => update("contact", { ...data.contact, linkedin: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">GitHub</Label>
            <Input value={data.contact.github} onChange={(e) => update("contact", { ...data.contact, github: e.target.value })} />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}
