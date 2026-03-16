import AppLayout from "@/components/layout/AppLayout";
import { Sparkles, ArrowRight, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "@/lib/motion-stub";

export default function PortfolioBuilder() {
  return (
    <AppLayout title="Portfolio Builder">
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">Create Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate a world-class portfolio website from your resume and profile data.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="rounded-2xl border bg-card p-6 space-y-4 hover:border-primary/40 transition-colors cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">From Existing Resume</p>
              <p className="text-xs text-muted-foreground mt-1">
                Select a saved resume and we'll generate a portfolio website from your experience, projects, skills, and achievements.
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link to="/my-resumes">
                Choose Resume <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border bg-card p-6 space-y-4 hover:border-primary/40 transition-colors cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Start Fresh</p>
              <p className="text-xs text-muted-foreground mt-1">
                Build your portfolio from scratch — add sections, projects, case studies, and customize the layout.
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link to="/portfolio-templates">
                Choose Template <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
