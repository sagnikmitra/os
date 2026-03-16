import { useState } from "react";
import { motion } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Copy, Download } from "lucide-react";
import ResumeSourceSelector from "@/components/ResumeSourceSelector";
import { useResumeSource } from "@/hooks/useResumeSource";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export default function ReferenceLetterDrafter() {
  const resume = useResumeSource();
  const [recommenderName, setRecommenderName] = useState("");
  const [recommenderTitle, setRecommenderTitle] = useState("");
  const [relationship, setRelationship] = useState("manager");
  const [targetRole, setTargetRole] = useState("");
  const [achievements, setAchievements] = useState("");
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState("");

  const handleGenerate = async () => {
    if (!recommenderName) { toast.error("Recommender name required"); return; }
    setLoading(true);
    try {
      const resumeText = resume.getResumeText();
      const { data, error } = await supabase.functions.invoke("reference-letter", { body: { recommenderName, recommenderTitle, relationship, targetRole, achievements, resumeText } });
      if (error) throw error;
      setLetter(data.letter);
      toast.success("Letter drafted!");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  const copy = () => { navigator.clipboard.writeText(letter); toast.success("Copied!"); };
  const download = () => { const blob = new Blob([letter], { type: "text/plain" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `Reference_Letter_${recommenderName}.txt`; a.click(); };

  return (
    <AppLayout title="Reference Letter Drafter" subtitle="AI drafts for recommenders to customize">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
        <motion.div {...fade(0)} className="p-4 border rounded-lg bg-card space-y-3">
          <ResumeSourceSelector {...resume} textareaRows={3} />
          <Input placeholder="Recommender's name *" value={recommenderName} onChange={e => setRecommenderName(e.target.value)} />
          <Input placeholder="Recommender's title" value={recommenderTitle} onChange={e => setRecommenderTitle(e.target.value)} />
          <Select value={relationship} onValueChange={setRelationship}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manager">Direct Manager</SelectItem>
              <SelectItem value="senior-colleague">Senior Colleague</SelectItem>
              <SelectItem value="professor">Professor</SelectItem>
              <SelectItem value="mentor">Mentor</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Target role/program" value={targetRole} onChange={e => setTargetRole(e.target.value)} />
          <Textarea placeholder="Key achievements to highlight..." value={achievements} onChange={e => setAchievements(e.target.value)} rows={4} />
          <Button className="w-full" onClick={handleGenerate} disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Drafting...</> : <><FileText className="h-4 w-4 mr-2" /> Draft Letter</>}
          </Button>
        </motion.div>

        <motion.div {...fade(1)}>
          {letter ? (
            <div className="p-4 border rounded-lg bg-card space-y-3">
              <div className="flex justify-between"><h3 className="text-sm font-semibold">Draft Letter</h3><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={copy}><Copy className="h-3 w-3 mr-1" /> Copy</Button><Button variant="ghost" size="sm" onClick={download}><Download className="h-3 w-3 mr-1" /> Download</Button></div></div>
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{letter}</pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 border rounded-lg border-dashed text-muted-foreground text-sm">Fill in details and generate</div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
