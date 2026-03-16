import { useEffect } from "react";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = s.alt ? e.altKey : !e.altKey;
        if (e.key.toLowerCase() === s.key.toLowerCase() && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          s.action();
          return;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts, enabled]);
}

export const BUILDER_SHORTCUTS = [
  { key: "s", ctrl: true, description: "Save resume" },
  { key: "e", ctrl: true, description: "Export PDF" },
  { key: "r", ctrl: true, shift: true, description: "AI Rewrite All" },
  { key: "/", ctrl: true, description: "Show shortcuts" },
] as const;
