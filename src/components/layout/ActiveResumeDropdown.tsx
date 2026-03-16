import { FileCheck, Upload, Clock, Pencil, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useActiveResume } from "@/context/ActiveResumeContext";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function formatTimestamp(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Compact dropdown for the topbar */
export function ActiveResumeDropdownCompact({ mobile = false }: { mobile?: boolean }) {
  const { resumes, activeResumeId, setActiveResumeId, getDisplayName, loading } = useActiveResume();

  if (loading) return null;

  if (resumes.length === 0) {
    return (
      <Link to="/upload" className={`w-full ${mobile ? "" : "max-w-[220px]"}`}>
        <Button
          variant="outline"
          size="sm"
          className={`w-full justify-start gap-1.5 text-[12px] ${mobile ? "h-8" : "h-9"} px-3`}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload resume
        </Button>
      </Link>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${mobile ? "w-full max-w-none" : "max-w-[220px]"}`}>
      <FileCheck className={`text-primary shrink-0 ${mobile ? "h-4 w-4" : "h-3.5 w-3.5"}`} />
      <Select value={activeResumeId} onValueChange={setActiveResumeId}>
        <SelectTrigger
          className={`text-[12px] border-border/60 bg-secondary/40 rounded-lg gap-1 overflow-hidden shrink-0 ${
            mobile ? "h-8 w-full max-w-none" : "h-9 w-[180px]"
          }`}
        >
          <span className="truncate flex-1 text-left"><SelectValue placeholder="Select resume\u2026" /></span>
        </SelectTrigger>
        <SelectContent align="end" className="max-w-[300px]">
          {resumes.map((r) => (
            <SelectItem key={r.id} value={r.id} className="text-xs py-1.5">
              <span className="font-medium truncate">{getDisplayName(r)}</span>
            </SelectItem>
          ))}
          <div className="border-t border-border/50 mt-1 pt-1 px-2 pb-1">
            <Link to="/upload" className="flex items-center gap-1.5 text-[11px] text-primary hover:underline py-1">
              <Upload className="h-3 w-3" /> Upload new resume
            </Link>
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}

/** Full sidebar version with alias editing */
export function ActiveResumeSidebar({ collapsed }: { collapsed: boolean }) {
  const { resumes, activeResumeId, activeResume, setActiveResumeId, getDisplayName, updateAlias, loading } = useActiveResume();
  const [editingAlias, setEditingAlias] = useState(false);
  const [aliasValue, setAliasValue] = useState("");

  if (loading || resumes.length === 0) {
    if (collapsed) return null;
    return (
      <div className="mx-2 my-1.5 rounded-2xl border border-sidebar-border/70 bg-gradient-to-b from-sidebar-accent/45 to-sidebar-accent/20 p-2.5 shadow-sm">
        <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">Active Resume</p>
        <Link to="/upload" className="flex items-center gap-1.5 text-[11px] text-sidebar-primary hover:underline px-1 py-1">
          <Upload className="h-3 w-3" /> Upload your first resume
        </Link>
      </div>
    );
  }

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="mx-auto mb-1">
            <div className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-150 ${
              activeResumeId
                ? "border-sidebar-primary/30 bg-sidebar-primary/12 text-sidebar-primary"
                : "border-transparent text-sidebar-muted hover:border-sidebar-border/60 hover:bg-sidebar-accent/60"
            }`}>
              <FileCheck className="h-[17px] w-[17px]" />
              {activeResumeId && (
                <span className="absolute -right-0.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-sidebar-primary" />
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs font-medium">
          {activeResume ? getDisplayName(activeResume) : "No resume selected"}
        </TooltipContent>
      </Tooltip>
    );
  }

  const handleStartEdit = () => {
    if (!activeResume) return;
    setAliasValue(activeResume.alias || activeResume.title);
    setEditingAlias(true);
  };

  const handleSaveAlias = async () => {
    if (!activeResume) return;
    const trimmed = aliasValue.trim();
    if (trimmed && trimmed !== activeResume.title) {
      await updateAlias(activeResume.id, trimmed);
      toast.success("Alias updated");
    } else {
      await updateAlias(activeResume.id, "");
    }
    setEditingAlias(false);
  };

  return (
    <div className="mx-2 my-1.5 rounded-2xl border border-sidebar-border/70 bg-gradient-to-b from-sidebar-accent/45 to-sidebar-accent/20 p-2.5 shadow-sm">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">Active Resume</p>
        {activeResume && !editingAlias && (
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 text-[10px] text-sidebar-muted">
              <Clock className="h-2.5 w-2.5" /> {formatTimestamp(activeResume.updated_at)}
            </span>
            <button
              onClick={handleStartEdit}
              className="rounded-md p-1 text-sidebar-muted transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              title="Edit alias"
            >
              <Pencil className="h-2.5 w-2.5" />
            </button>
          </div>
        )}
      </div>

      {editingAlias ? (
        <div className="flex items-center gap-1.5">
          <Input
            value={aliasValue}
            onChange={(e) => setAliasValue(e.target.value)}
            className="h-7 border-sidebar-border bg-sidebar text-[12px] px-2"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveAlias(); if (e.key === "Escape") setEditingAlias(false); }}
          />
          <button onClick={handleSaveAlias} className="text-sidebar-primary hover:text-sidebar-accent-foreground"><Check className="h-3.5 w-3.5" /></button>
          <button onClick={() => setEditingAlias(false)} className="text-sidebar-muted hover:text-sidebar-accent-foreground"><X className="h-3.5 w-3.5" /></button>
        </div>
      ) : (
        <Select value={activeResumeId} onValueChange={setActiveResumeId}>
          <SelectTrigger className="h-8 text-[12px] bg-sidebar border-sidebar-border text-sidebar-accent-foreground w-full overflow-hidden">
            <FileCheck className="h-3.5 w-3.5 mr-1.5 shrink-0 text-sidebar-primary" />
            <span className="truncate flex-1 text-left"><SelectValue placeholder="Select resume…" /></span>
          </SelectTrigger>
          <SelectContent>
            {resumes.map((r) => (
              <SelectItem key={r.id} value={r.id} className="text-xs">
                <span className="truncate">{getDisplayName(r)}</span>
              </SelectItem>
            ))}
            <div className="border-t border-border/50 mt-1 pt-1 px-2 pb-1">
              <Link to="/upload" className="flex items-center gap-1.5 text-[11px] text-primary hover:underline py-1">
                <Upload className="h-3 w-3" /> Analyze new resume
              </Link>
            </div>
          </SelectContent>
        </Select>
      )}

    </div>
  );
}
