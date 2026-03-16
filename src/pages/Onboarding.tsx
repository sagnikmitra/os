import { useNavigate, Link } from "react-router-dom";
import { motion } from "@/lib/motion-stub";
import { Upload, Hammer, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import sgnkLogo from "@/assets/sgnkLogo.png";

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center justify-between max-w-5xl mx-auto w-full px-6 py-5">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <img src={sgnkLogo} alt="sgnk" className="w-5 h-5" />
          </div>
          <span className="font-display text-sm font-bold tracking-tight">
            <span className="text-muted-foreground font-normal">sgnk</span> CareerOS
          </span>
        </Link>
        <ThemeToggle />
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg text-center"
        >
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            How would you like to start?
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            You can always switch between these later.
          </p>

          <div className="space-y-3 text-left">
            <button
              onClick={() => navigate("/upload")}
              className="w-full p-5 rounded-xl border-2 border-border bg-card transition-all hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Upload existing resume</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Analyze, score, and improve what you have</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>

            <button
              onClick={() => navigate("/builder")}
              className="w-full p-5 rounded-xl border-2 border-border bg-card transition-all hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Hammer className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Build from scratch</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Create a new resume with our guided builder</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
