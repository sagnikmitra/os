import { motion, AnimatePresence } from "@/lib/motion-stub";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Pause, Play, X, MessageSquare, Clock } from "lucide-react";
import { AudioVisualizer } from "./AudioVisualizer";
import { cn } from "@/lib/utils";

interface ImmersiveVoiceModeProps {
  questionCount: number;
  elapsedTime: number;
  currentQuestion: string;
  answer: string;
  isSpeaking: boolean;
  isListening: boolean;
  isPaused: boolean;
  loading: boolean;
  silenceTimer: number;
  silenceThreshold: number;
  onToggleMic: () => void;
  onTogglePause: () => void;
  onEnd: () => void;
  onSwitchToChat: () => void;
}

function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

export function ImmersiveVoiceMode({
  questionCount, elapsedTime, currentQuestion, answer,
  isSpeaking, isListening, isPaused, loading,
  silenceTimer, silenceThreshold,
  onToggleMic, onTogglePause, onEnd, onSwitchToChat,
}: ImmersiveVoiceModeProps) {
  const speakingState = isSpeaking ? "ai" : isListening ? "user" : "idle";
  const silencePercent = silenceTimer > 0 ? Math.min((silenceTimer / silenceThreshold) * 100, 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col select-none overflow-hidden">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-6 sm:px-8 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm">
            🤖
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Alex, Senior Hiring Manager</p>
            <p className="text-[11px] text-muted-foreground">Question {questionCount} of 12</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-xs font-medium tabular-nums">{formatTime(elapsedTime)}</span>
        </div>
      </div>

      {/* ── MAIN CONTENT — vertically centered ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">

        {/* State label ABOVE the visualizer */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border text-sm text-muted-foreground">
              <motion.div className="h-1.5 w-1.5 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              Evaluating...
            </motion.div>
          ) : isSpeaking ? (
            <motion.div key="speaking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium">
              <motion.div className="h-1.5 w-1.5 rounded-full bg-primary"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              Interviewer speaking
            </motion.div>
          ) : isListening ? (
            <motion.div key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-score-excellent/10 border border-score-excellent/20 text-sm text-score-excellent font-medium">
                <motion.div className="h-1.5 w-1.5 rounded-full bg-score-excellent"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                Listening to you
              </div>
              {silenceTimer > 0 && answer.trim().length > 0 && (
                <motion.div initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2">
                  <div className="w-20 h-1 rounded-full bg-border overflow-hidden">
                    <motion.div className="h-full rounded-full bg-score-warning" style={{ width: `${silencePercent}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {Math.ceil(silenceThreshold - silenceTimer)}s
                  </span>
                </motion.div>
              )}
            </motion.div>
          ) : isPaused ? (
            <motion.div key="paused" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-score-warning/10 border border-score-warning/20 text-sm text-score-warning font-medium">
              Interview Paused
            </motion.div>
          ) : (
            <div className="h-9" /> /* spacer when no state */
          )}
        </AnimatePresence>

        {/* Visualizer */}
        <AudioVisualizer
          active={!isPaused && !loading}
          speaking={speakingState}
        />

        {/* Caption text BELOW the visualizer — clear separation */}
        <div className="min-h-[80px] max-w-xl text-center">
          <AnimatePresence mode="wait">
            {(isSpeaking && currentQuestion) && (
              <motion.div
                key="caption-q"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                <p className="text-sm sm:text-base leading-relaxed text-foreground/80">{currentQuestion}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-2 uppercase tracking-[0.15em]">Interviewer</p>
              </motion.div>
            )}
            {(isListening && answer) && (
              <motion.div
                key="caption-a"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">{answer}</p>
                <p className="text-[10px] text-score-excellent/50 mt-2 uppercase tracking-[0.15em]">Your response</p>
              </motion.div>
            )}
            {(!isSpeaking && !isListening && !loading && !isPaused && currentQuestion) && (
              <motion.div
                key="caption-idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-sm leading-relaxed text-muted-foreground/60">{currentQuestion}</p>
                <p className="text-[10px] text-muted-foreground/40 mt-2 uppercase tracking-[0.15em]">Last question</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── BOTTOM CONTROLS ── */}
      <div className="shrink-0 flex items-center justify-center gap-3 px-6 pb-8 pt-4">
        {/* Switch to chat */}
        <Button variant="outline" size="icon" className="h-11 w-11 rounded-full border-border" onClick={onSwitchToChat} title="Switch to Chat">
          <MessageSquare className="h-4 w-4" />
        </Button>

        {/* Mic toggle — primary action */}
        <button
          onClick={onToggleMic}
          title={isListening ? "Mute microphone" : "Unmute microphone"}
          className={cn(
            "h-14 w-14 rounded-full flex items-center justify-center transition-all shadow-md",
            isListening
              ? "bg-score-excellent text-white hover:bg-score-excellent/90"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {isListening ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </button>

        {/* Pause/Resume */}
        <Button variant="outline" size="icon" className="h-11 w-11 rounded-full border-border" onClick={onTogglePause} title={isPaused ? "Resume" : "Pause"}>
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>

        {/* End Interview */}
        <Button
          variant="destructive"
          onClick={onEnd}
          className="h-11 px-5 rounded-full text-sm gap-2"
        >
          <X className="h-4 w-4" />
          End Interview
        </Button>
      </div>
    </div>
  );
}
