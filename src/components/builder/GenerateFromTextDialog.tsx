import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: string;
  sectionLabel: string;
  onGenerated: (data: any) => void;
}

export function GenerateFromTextDialog({ open, onOpenChange, section, sectionLabel, onGenerated }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error("Please paste some text first");
      return;
    }
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-from-text", {
        body: { text: text.trim(), section },
      });
      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);
      if (result?.data) {
        onGenerated(result.data);
        toast.success(`${sectionLabel} generated successfully!`);
        setText("");
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            Generate {sectionLabel} from Text
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Paste any text — job description, LinkedIn bio, notes, etc. AI will extract and format the {sectionLabel.toLowerCase()} details.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={`Paste your text here...\n\nExample: Copy your LinkedIn profile, a job description, rough notes, or any text containing ${sectionLabel.toLowerCase()} information.`}
          className="min-h-[200px] text-[12px] bg-background border-border/60"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleGenerate} disabled={loading || !text.trim()} className="gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            {loading ? "Generating..." : "Generate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
