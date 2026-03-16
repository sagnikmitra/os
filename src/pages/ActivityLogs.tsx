import { useState, useEffect, useCallback } from "react";
import { motion } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ACTIVITY_TYPE_META } from "@/lib/notifications";
import {
  Activity, Loader2, Clock, Filter, FileText, FilePlus, FileEdit, FileX,
  Scan, Download, Share, Bookmark, Send, BellPlus, Mail, Mic, Layers,
  Globe, Settings, LogIn, UserPlus, RefreshCw, ChevronDown, Calendar,
} from "lucide-react";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: any;
  created_at: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  resume_created: <FilePlus className="h-3.5 w-3.5" />,
  resume_updated: <FileEdit className="h-3.5 w-3.5" />,
  resume_deleted: <FileX className="h-3.5 w-3.5" />,
  resume_analyzed: <Scan className="h-3.5 w-3.5" />,
  resume_exported: <Download className="h-3.5 w-3.5" />,
  resume_shared: <Share className="h-3.5 w-3.5" />,
  job_saved: <Bookmark className="h-3.5 w-3.5" />,
  job_applied: <Send className="h-3.5 w-3.5" />,
  job_alert_created: <BellPlus className="h-3.5 w-3.5" />,
  cover_letter_generated: <Mail className="h-3.5 w-3.5" />,
  interview_completed: <Mic className="h-3.5 w-3.5" />,
  portfolio_created: <Layers className="h-3.5 w-3.5" />,
  portfolio_published: <Globe className="h-3.5 w-3.5" />,
  settings_updated: <Settings className="h-3.5 w-3.5" />,
  login: <LogIn className="h-3.5 w-3.5" />,
  signup: <UserPlus className="h-3.5 w-3.5" />,
};

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ActivityLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [limit, setLimit] = useState(50);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from("activity_logs" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (entityFilter !== "all") {
      query = query.eq("entity_type", entityFilter);
    }
    const { data, error } = await query;
    if (!error && data) setLogs(data as any);
    setLoading(false);
  }, [user, entityFilter, limit]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const entityTypes = [...new Set(logs.map(l => l.entity_type))].sort();

  // Group by date
  const grouped: Record<string, ActivityLog[]> = {};
  logs.forEach(l => {
    const date = new Date(l.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let label: string;
    if (date.toDateString() === today.toDateString()) label = "Today";
    else if (date.toDateString() === yesterday.toDateString()) label = "Yesterday";
    else label = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(l);
  });

  return (
    <AppLayout title="Activity Log" subtitle="Your full activity timeline">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        <motion.div {...fade(0)} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Activity Log
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Track everything you've done across the platform</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchLogs}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div {...fade(1)} className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Filter:</span>
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="resume">Resumes</SelectItem>
              <SelectItem value="job">Jobs</SelectItem>
              <SelectItem value="portfolio">Portfolios</SelectItem>
              <SelectItem value="interview">Interviews</SelectItem>
              <SelectItem value="outreach">Outreach</SelectItem>
              <SelectItem value="auth">Auth</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-[10px]">{logs.length} events</Badge>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : logs.length === 0 ? (
          <motion.div {...fade(2)}>
            <Card className="p-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground">No activity yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Your actions will be logged here as you use the platform</p>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateLabel, items], gi) => (
              <motion.div key={dateLabel} {...fade(gi + 2)} className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{dateLabel}</h3>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="relative ml-4 border-l-2 border-border/60 pl-5 space-y-0.5">
                  {items.map((log, i) => {
                    const meta = ACTIVITY_TYPE_META[log.action];
                    const icon = ACTION_ICONS[log.action] || <Activity className="h-3.5 w-3.5" />;
                    const color = meta?.color || "text-muted-foreground";

                    return (
                      <div key={log.id} className="relative py-2.5 group">
                        {/* Timeline dot */}
                        <div className={cn(
                          "absolute -left-[29px] top-3.5 w-3 h-3 rounded-full border-2 border-background flex items-center justify-center",
                          log.action.includes("deleted") ? "bg-destructive" :
                          log.action.includes("created") || log.action.includes("signup") ? "bg-emerald-500" :
                          log.action.includes("analyzed") || log.action.includes("completed") ? "bg-primary" :
                          "bg-muted-foreground/40"
                        )} />

                        <div className="flex items-start gap-3">
                          <div className={cn("h-7 w-7 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0", color)}>
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {meta?.label || log.action.replace(/_/g, " ")}
                            </p>
                            {log.metadata?.title && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {log.metadata.title}
                              </p>
                            )}
                            {log.metadata?.description && (
                              <p className="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-1">
                                {log.metadata.description}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground/50 tabular-nums shrink-0 mt-1">
                            {formatTimestamp(log.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}

            {/* Load more */}
            {logs.length >= limit && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setLimit(prev => prev + 50)}>
                  <ChevronDown className="h-3.5 w-3.5" /> Load more
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
