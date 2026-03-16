import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ResumePreview } from "@/components/builder/ResumePreview";
import { TemplateName } from "@/types/resume";
import { FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SharedResume() {
  const { token } = useParams<{ token: string }>();
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchResume = async () => {
      // Try custom_slug first, then share_token
      let { data, error } = await supabase
        .from("saved_resumes")
        .select("*")
        .eq("custom_slug", token)
        .eq("is_public", true)
        .maybeSingle();
      if (!data) {
        const res = await supabase
          .from("saved_resumes")
          .select("*")
          .eq("share_token", token)
          .eq("is_public", true)
          .maybeSingle();
        data = res.data;
        error = res.error;
      }
      if (error || !data) {
        setNotFound(true);
      } else {
        setResume(data);
      }
      setLoading(false);
    };
    fetchResume();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
          <FileText className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="font-display text-xl font-bold mb-2">Resume not found</h1>
        <p className="text-sm text-muted-foreground mb-6">This link may have expired or been removed.</p>
        <Link to="/"><Button variant="outline" className="gap-2">Go Home <ArrowRight className="h-4 w-4" /></Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-card border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-display text-sm font-bold tracking-tight">
            <span className="text-muted-foreground">sgnk</span> Resume OS
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm text-muted-foreground">{resume.title}</span>
        </div>
        <Link to="/signup">
          <Button size="sm" className="gap-1.5">Create yours <ArrowRight className="h-3.5 w-3.5" /></Button>
        </Link>
      </header>
      <div className="max-w-[850px] mx-auto py-10 px-6">
        <div className="shadow-xl rounded-lg overflow-hidden bg-white">
          <ResumePreview data={resume.resume_data} template={resume.template as TemplateName} />
        </div>
      </div>
    </div>
  );
}
