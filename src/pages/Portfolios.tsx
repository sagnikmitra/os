import AppLayout from "@/components/layout/AppLayout";
import { Globe, Sparkles } from "lucide-react";
import { motion } from "@/lib/motion-stub";

export default function Portfolios() {
  return (
    <AppLayout title="Portfolios">
      <div className="p-4 sm:p-6 max-w-3xl mx-auto flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center w-full"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/[0.08] flex items-center justify-center mx-auto mb-5">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Coming Soon</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            We're building something amazing — premium portfolio websites generated from your resume data, projects, and experience.
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-medium">Stay tuned!</span>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
