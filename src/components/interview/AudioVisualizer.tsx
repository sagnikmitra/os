import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AudioVisualizerProps {
  active: boolean;
  speaking: "ai" | "user" | "idle";
  className?: string;
}

/**
 * Canvas-based concentric ring audio visualizer.
 * Draws clean, gently pulsing concentric circles that respond to speaking state.
 */
export function AudioVisualizer({ active, speaking, className }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 280;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;

    const isDark = () => document.documentElement.classList.contains("dark");

    const draw = () => {
      phaseRef.current += active ? 0.02 : 0.006;
      ctx.clearRect(0, 0, size, size);

      const dark = isDark();
      const ringCount = 4;
      const baseRadius = 30;
      const ringGap = 26;

      for (let i = 0; i < ringCount; i++) {
        const r = baseRadius + i * ringGap;

        // Very gentle breathing — rings stay circular, just pulse radius slightly
        const breathe = active
          ? Math.sin(phaseRef.current * (1.2 + i * 0.15)) * (speaking !== "idle" ? 3 : 1.5)
          : Math.sin(phaseRef.current * 0.8) * 0.5;
        const currentR = r + breathe;

        // Opacity: inner rings more opaque, outer rings fade
        const alpha = dark
          ? (active ? 0.55 - i * 0.1 : 0.15 - i * 0.02)
          : (active ? 0.6 - i * 0.12 : 0.25 - i * 0.04);
        const clampedAlpha = Math.max(alpha, 0.06);

        // Color selection
        let strokeColor: string;
        if (speaking === "ai") {
          strokeColor = `rgba(99, 102, 241, ${clampedAlpha})`;  // indigo
        } else if (speaking === "user") {
          strokeColor = `rgba(16, 185, 129, ${clampedAlpha})`;  // emerald
        } else {
          const idleAlpha = clampedAlpha * 0.7;
          strokeColor = dark
            ? `rgba(139, 92, 246, ${idleAlpha})`   // violet for dark
            : `rgba(99, 102, 241, ${idleAlpha})`;   // indigo for light
        }

        ctx.beginPath();
        ctx.arc(cx, cy, currentR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = active ? 2 : 1.5;
        ctx.stroke();
      }

      // Center dot
      if (active) {
        const dotAlpha = dark ? 0.3 : 0.25;
        const dotColor = speaking === "ai"
          ? `rgba(99, 102, 241, ${dotAlpha})`
          : speaking === "user"
          ? `rgba(16, 185, 129, ${dotAlpha})`
          : `rgba(99, 102, 241, ${dotAlpha * 0.5})`;

        const dotR = 6 + Math.sin(phaseRef.current * 2) * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [active, speaking]);

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <canvas
        ref={canvasRef}
        className="w-[280px] h-[280px]"
        style={{ width: 280, height: 280 }}
      />
      {/* Soft halo glow behind the rings */}
      {active && (
        <div
          className={cn(
            "absolute rounded-full blur-3xl -z-10 transition-all duration-1000",
            speaking === "ai"
              ? "w-48 h-48 bg-primary/15 dark:bg-primary/10"
              : speaking === "user"
              ? "w-48 h-48 bg-score-excellent/15 dark:bg-score-excellent/10"
              : "w-40 h-40 bg-primary/8 dark:bg-primary/5"
          )}
        />
      )}
    </div>
  );
}
