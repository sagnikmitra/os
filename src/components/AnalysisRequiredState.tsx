import { Link } from "react-router-dom";
import { Upload, ArrowRight, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnalysisRequiredStateProps {
  /** Page title for context, e.g. "ATS Score" */
  pageTitle: string;
  /** Short description of what this page does */
  description: string;
  /** The icon to display */
  icon?: React.ReactNode;
  /** Optional extra actions */
  children?: React.ReactNode;
}

const suggestedPages = [
  { title: "Upload & Analyze", desc: "Get your resume scored in seconds", href: "/upload", icon: Upload, color: "text-primary bg-primary/10" },
  { title: "Resume Builder", desc: "Build a resume from scratch", href: "/builder", icon: FileText, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
  { title: "My Resumes", desc: "Open a saved resume", href: "/my-resumes", icon: FileText, color: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
];

export function AnalysisRequiredState({ pageTitle, description, icon, children }: AnalysisRequiredStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-lg text-center space-y-7">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          {icon || <Shield className="h-7 w-7 text-primary" />}
        </div>

        {/* Title & description */}
        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold tracking-tight">{pageTitle}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link to="/upload">
            <Button className="gap-2" size="lg">
              <Upload className="h-4 w-4" />
              Upload & Analyze Resume
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/my-resumes">
            <Button variant="outline" size="lg" className="gap-2">
              <FileText className="h-4 w-4" />
              Open My Resumes
            </Button>
          </Link>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" />
          <span>or get started with</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Quick links */}
        <div className="grid gap-2">
          {suggestedPages.map((page) => (
            <Link key={page.href} to={page.href}>
              <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-primary/30 hover:shadow-sm transition-all text-left group">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", page.color)}>
                  <page.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{page.title}</p>
                  <p className="text-xs text-muted-foreground">{page.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>
            </Link>
          ))}
        </div>

        {children}
      </div>
    </div>
  );
}
