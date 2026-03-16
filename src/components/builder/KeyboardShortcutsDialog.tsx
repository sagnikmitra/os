import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

const shortcuts = [
  { keys: ["Ctrl", "S"], description: "Save resume" },
  { keys: ["Ctrl", "E"], description: "Export PDF" },
  { keys: ["Ctrl", "Z"], description: "Undo" },
  { keys: ["Ctrl", "Shift", "Z"], description: "Redo" },
  { keys: ["Ctrl", "Shift", "R"], description: "AI Rewrite All bullets" },
  { keys: ["Ctrl", "/"], description: "Show keyboard shortcuts" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Keyboard className="h-4 w-4" /> Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1 mt-2">
          {shortcuts.map((s) => (
            <div key={s.description} className="flex items-center justify-between py-2 px-1 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="px-2 py-0.5 rounded bg-secondary text-[11px] font-mono font-medium border border-border">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
