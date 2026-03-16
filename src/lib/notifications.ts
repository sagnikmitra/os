import { supabase } from "@/integrations/supabase/client";

export type NotificationType = "info" | "success" | "warning" | "error" | "job_alert" | "analysis" | "interview" | "resume";

interface CreateNotificationOptions {
  title: string;
  message: string;
  type?: NotificationType;
  data?: Record<string, any>;
}

export async function createNotification({ title, message, type = "info", data = {} }: CreateNotificationOptions) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { error } = await supabase.from("notifications" as any).insert({
    user_id: user.id,
    title,
    message,
    type,
    data,
  });
  if (error) console.error("Failed to create notification:", error);
}

export async function logActivity(
  action: string,
  entityType: string,
  entityId?: string,
  metadata: Record<string, any> = {}
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { error } = await supabase.from("activity_logs" as any).insert({
    user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    metadata,
  });
  if (error) console.error("Failed to log activity:", error);
}

// Notification type metadata for UI rendering
export const NOTIFICATION_TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  info: { label: "Info", color: "text-blue-500", bg: "bg-blue-500/10" },
  success: { label: "Success", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  warning: { label: "Warning", color: "text-amber-500", bg: "bg-amber-500/10" },
  error: { label: "Error", color: "text-destructive", bg: "bg-destructive/10" },
  job_alert: { label: "Job Alert", color: "text-violet-500", bg: "bg-violet-500/10" },
  analysis: { label: "Analysis", color: "text-primary", bg: "bg-primary/10" },
  interview: { label: "Interview", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  resume: { label: "Resume", color: "text-blue-500", bg: "bg-blue-500/10" },
};

// Activity type metadata
export const ACTIVITY_TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  resume_created: { label: "Created resume", icon: "file-plus", color: "text-emerald-500" },
  resume_updated: { label: "Updated resume", icon: "file-edit", color: "text-blue-500" },
  resume_deleted: { label: "Deleted resume", icon: "file-x", color: "text-destructive" },
  resume_analyzed: { label: "Analyzed resume", icon: "scan", color: "text-primary" },
  resume_exported: { label: "Exported resume", icon: "download", color: "text-violet-500" },
  resume_shared: { label: "Shared resume", icon: "share", color: "text-emerald-500" },
  job_saved: { label: "Saved a job", icon: "bookmark", color: "text-amber-500" },
  job_applied: { label: "Applied to job", icon: "send", color: "text-primary" },
  job_alert_created: { label: "Created job alert", icon: "bell-plus", color: "text-violet-500" },
  cover_letter_generated: { label: "Generated cover letter", icon: "mail", color: "text-blue-500" },
  interview_completed: { label: "Completed mock interview", icon: "mic", color: "text-emerald-500" },
  portfolio_created: { label: "Created portfolio", icon: "layers", color: "text-violet-500" },
  portfolio_published: { label: "Published portfolio", icon: "globe", color: "text-primary" },
  settings_updated: { label: "Updated settings", icon: "settings", color: "text-muted-foreground" },
  login: { label: "Signed in", icon: "log-in", color: "text-emerald-500" },
  signup: { label: "Signed up", icon: "user-plus", color: "text-primary" },
};
