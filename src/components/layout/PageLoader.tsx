import { useState, useEffect } from "react";

const loadingMessages = [
  "Preparing your workspace…",
  "Loading components…",
  "Almost ready…",
];

export function PageLoader() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % loadingMessages.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[40vh]" aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-card/75 px-6 py-5 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              style={{
                animation: "page-loader-bounce 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground font-medium tracking-wide transition-opacity duration-300">
          {loadingMessages[msgIndex]}
        </p>
      </div>
      <style>{`
        @keyframes page-loader-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
