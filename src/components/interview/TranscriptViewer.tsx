import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import { ChevronDown, ChevronUp, Lightbulb, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface TranscriptEntry {
  role: "interviewer" | "candidate";
  content: string;
  type?: "question" | "feedback" | "answer";
  timestamp?: number;
  highlight?: "excellent" | "needs-work" | "missed" | null;
  coachingNote?: string;
  wordCount?: number;
}

interface TranscriptViewerProps {
  entries: TranscriptEntry[];
}

function formatTimestamp(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  return `${Math.floor(totalSec / 60)}:${(totalSec % 60).toString().padStart(2, "0")}`;
}

export function TranscriptViewer({ entries }: TranscriptViewerProps) {
  const [expanded, setExpanded] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

  const toggleNote = (i: number) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const relevantEntries = entries.filter(e => e.type === "question" || e.type === "answer" || e.role === "candidate");

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h4 className="font-display text-sm font-semibold">Smart Annotated Transcript</h4>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{relevantEntries.length} entries</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t"
          >
            <div className="divide-y">
              {entries.map((entry, i) => {
                if (entry.type === "feedback") return null;

                const isInterviewer = entry.role === "interviewer";
                const highlightClass = entry.highlight === "excellent"
                  ? "border-l-score-excellent bg-score-excellent/5"
                  : entry.highlight === "needs-work"
                  ? "border-l-score-warning bg-score-warning/5"
                  : entry.highlight === "missed"
                  ? "border-l-score-critical bg-score-critical/5"
                  : "border-l-transparent";

                return (
                  <div key={i} className={cn("px-5 py-3.5 border-l-2 transition-colors", highlightClass)}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider",
                        isInterviewer ? "text-primary" : "text-accent-foreground"
                      )}>
                        {isInterviewer ? "Interviewer" : "You"}
                      </span>
                      {entry.timestamp && (
                        <span className="text-[10px] text-muted-foreground/50 tabular-nums">{formatTimestamp(entry.timestamp)}</span>
                      )}
                      {entry.wordCount && (
                        <span className="text-[10px] text-muted-foreground/40">{entry.wordCount}w</span>
                      )}
                      {entry.highlight && (
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded",
                          entry.highlight === "excellent" ? "bg-score-excellent/10 text-score-excellent"
                            : entry.highlight === "needs-work" ? "bg-score-warning/10 text-score-warning"
                            : "bg-score-critical/10 text-score-critical"
                        )}>
                          {entry.highlight === "excellent" ? "★ Excellent" : entry.highlight === "needs-work" ? "⚠ Improve" : "✗ Missed"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                    {entry.coachingNote && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleNote(i)}
                          className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 transition-colors"
                        >
                          <Lightbulb className="h-3 w-3" />
                          {expandedNotes.has(i) ? "Hide coaching note" : "💡 AI Coaching Note"}
                        </button>
                        <AnimatePresence>
                          {expandedNotes.has(i) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-2 pl-3 border-l-2 border-primary/30"
                            >
                              <p className="text-xs text-primary/70 leading-relaxed">{entry.coachingNote}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
