import { FileText, ClipboardPaste, Loader2, Upload, Hammer } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface Props {
  savedResumes: { id: string; title: string; updated_at: string }[];
  selectedResumeId: string;
  setSelectedResumeId: (id: string) => void;
  pastedText: string;
  setPastedText: (t: string) => void;
  sourceMode: "saved" | "paste";
  setSourceMode: (m: "saved" | "paste") => void;
  loadingResumes: boolean;
  hasSavedResumes: boolean;
  textareaRows?: number;
  textareaPlaceholder?: string;
}

export default function ResumeSourceSelector({
  savedResumes, selectedResumeId, setSelectedResumeId,
  pastedText, setPastedText, sourceMode, setSourceMode,
  loadingResumes, hasSavedResumes,
  textareaRows = 4, textareaPlaceholder = "Paste your resume text here...",
}: Props) {
  if (loadingResumes) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-lg">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading resumes...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Mode toggle tabs */}
      <div className="flex gap-1.5">
        {hasSavedResumes && (
          <button
            onClick={() => setSourceMode("saved")}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              sourceMode === "saved"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            <FileText className="h-3 w-3" /> Saved Resume
          </button>
        )}
        <button
          onClick={() => setSourceMode("paste")}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
            sourceMode === "paste"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-muted-foreground border-border hover:bg-accent"
          }`}
        >
          <ClipboardPaste className="h-3 w-3" /> Paste Text
        </button>
      </div>

      {/* Content based on mode */}
      {sourceMode === "saved" && hasSavedResumes ? (
        <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select a resume" />
          </SelectTrigger>
          <SelectContent>
            {savedResumes.map(r => (
              <SelectItem key={r.id} value={r.id}>
                <span className="flex items-center gap-2">
                  {r.title}
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {format(new Date(r.updated_at), "MMM d")}
                  </Badge>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : sourceMode === "paste" ? (
        <Textarea
          value={pastedText}
          onChange={e => setPastedText(e.target.value)}
          placeholder={textareaPlaceholder}
          rows={textareaRows}
          className="bg-background"
        />
      ) : (
        /* No saved resumes and not in paste mode — prompt to upload or build */
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            No saved resumes yet. Upload one or build from scratch to get started.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/upload" className="gap-1.5">
                <Upload className="h-3.5 w-3.5" /> Upload Resume
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/builder" className="gap-1.5">
                <Hammer className="h-3.5 w-3.5" /> Build Resume
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
