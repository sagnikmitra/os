import { useState } from "react";
import { motion } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BookOpen, Copy } from "lucide-react";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export default function CaseStudyBuilder() {
  const [bulletPoint, setBulletPoint] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [caseStudy, setCaseStudy] = useState<any>(null);

  const handleBuild = async () => {
    if (!bulletPoint) { toast.error("Enter a bullet point or project"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("case-study-builder", { body: { bulletPoint, targetAudience } });
      if (error) throw error;
      setCaseStudy(data);
      toast.success("Case study built!");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  return (
    <AppLayout title="Project Case Study Builder" subtitle="Turn resume bullet points into detailed case studies">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <motion.div {...fade(0)} className="p-4 border rounded-lg bg-card space-y-3">
          <Textarea placeholder="Paste a resume bullet point or project description..." value={bulletPoint} onChange={e => setBulletPoint(e.target.value)} rows={3} />
          <Input placeholder="Target audience (e.g., Technical hiring manager, Portfolio readers)" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} />
          <Button className="w-full" onClick={handleBuild} disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Building...</> : <><BookOpen className="h-4 w-4 mr-2" /> Build Case Study</>}
          </Button>
        </motion.div>

        {caseStudy && (
          <div className="space-y-4">
            {["title", "overview", "challenge", "approach", "solution", "results", "lessons_learned", "technologies"].map((section, i) => (
              caseStudy[section] && (
                <motion.div key={section} {...fade(i)} className="p-4 border rounded-lg bg-card group relative">
                  <h3 className="font-semibold capitalize text-sm mb-2">{section.replace(/_/g, " ")}</h3>
                  {Array.isArray(caseStudy[section]) ? (
                    <ul className="text-sm space-y-1">{caseStudy[section].map((item: string, j: number) => <li key={j} className="text-muted-foreground">• {item}</li>)}</ul>
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{caseStudy[section]}</p>
                  )}
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" onClick={() => copy(Array.isArray(caseStudy[section]) ? caseStudy[section].join("\n") : caseStudy[section])}><Copy className="h-3 w-3" /></Button>
                </motion.div>
              )
            ))}
            <Button variant="outline" onClick={() => setCaseStudy(null)}>Build Another</Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
