import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { NOTIFICATION_TYPE_META } from "@/lib/notifications";
import {
  Bell, Check, CheckCheck, Trash2, Loader2, Inbox, Filter,
  Info, AlertTriangle, CheckCircle2, XCircle, Briefcase, Sparkles,
  Mic, FileText, RefreshCw, Eye,
} from "lucide-react";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  info: <Info className="h-4 w-4" />,
  success: <CheckCircle2 className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  error: <XCircle className="h-4 w-4" />,
  job_alert: <Briefcase className="h-4 w-4" />,
  analysis: <Sparkles className="h-4 w-4" />,
  interview: <Mic className="h-4 w-4" />,
  resume: <FileText className="h-4 w-4" />,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error && data) setNotifications(data as any);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications" as any).update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (!unreadIds.length) return;
    for (const id of unreadIds) {
      await supabase.from("notifications" as any).update({ is_read: true }).eq("id", id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success("All notifications marked as read");
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications" as any).delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = async () => {
    if (!user) return;
    for (const n of notifications) {
      await supabase.from("notifications" as any).delete().eq("id", n.id);
    }
    setNotifications([]);
    toast.success("All notifications cleared");
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const filtered = filter === "unread" ? notifications.filter(n => !n.is_read) : notifications;

  // Group by date
  const grouped: Record<string, Notification[]> = {};
  filtered.forEach(n => {
    const date = new Date(n.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let label: string;
    if (date.toDateString() === today.toDateString()) label = "Today";
    else if (date.toDateString() === yesterday.toDateString()) label = "Yesterday";
    else label = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(n);
  });

  return (
    <AppLayout title="Notifications" subtitle="Stay updated on your career activity">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        <motion.div {...fade(0)} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Notifications
              {unreadCount > 0 && <Badge variant="destructive" className="text-xs ml-1">{unreadCount}</Badge>}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Real-time updates from your career activities</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchNotifications}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={markAllRead}>
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" className="text-xs gap-1 text-destructive" onClick={clearAll}>
                <Trash2 className="h-3.5 w-3.5" /> Clear all
              </Button>
            )}
          </div>
        </motion.div>

        {/* Filter */}
        <motion.div {...fade(1)} className="flex gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setFilter("all")}>
            All ({notifications.length})
          </Button>
          <Button variant={filter === "unread" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setFilter("unread")}>
            Unread ({unreadCount})
          </Button>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <motion.div {...fade(2)}>
            <Card className="p-12 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground">No notifications</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === "unread" ? "You've read all your notifications" : "Notifications will appear here as you use the platform"}
              </p>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateLabel, items], gi) => (
              <motion.div key={dateLabel} {...fade(gi + 2)} className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">{dateLabel}</h3>
                <div className="space-y-1.5">
                  <AnimatePresence>
                    {items.map((n) => {
                      const meta = NOTIFICATION_TYPE_META[n.type] || NOTIFICATION_TYPE_META.info;
                      return (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8, height: 0 }}
                          className={cn(
                            "flex items-start gap-3 rounded-xl border p-3.5 transition-colors group",
                            n.is_read ? "bg-card border-border" : "bg-primary/[0.03] border-primary/15"
                          )}
                        >
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", meta.bg)}>
                            <span className={meta.color}>{TYPE_ICONS[n.type] || TYPE_ICONS.info}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                              <h4 className="text-sm font-semibold text-foreground truncate">{n.title}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-muted-foreground/60 mt-1 block">{timeAgo(n.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {!n.is_read && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markAsRead(n.id)}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteNotification(n.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
