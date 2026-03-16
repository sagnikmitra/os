import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Bell, Plus, Trash2, Play, Pause, Clock, Briefcase, MapPin, Building2,
  Loader2, ExternalLink, Check, X, Search, Sparkles, Filter, Eye, Zap,
  RefreshCw, ChevronRight, Target, DollarSign,
} from "lucide-react";

interface JobAlert {
  id: string;
  name: string;
  is_active: boolean;
  keywords: string;
  location: string | null;
  seniority: string[] | null;
  work_mode: string[] | null;
  salary_min: number | null;
  salary_max: number | null;
  industries: string[] | null;
  sources: string[] | null;
  resume_based: boolean;
  resume_id: string | null;
  frequency: string;
  last_run_at: string | null;
  created_at: string;
}

interface AlertResult {
  id: string;
  alert_id: string;
  job_data: any;
  is_read: boolean;
  is_saved: boolean;
  created_at: string;
}

const SENIORITY_OPTIONS = ["Entry", "Mid", "Senior", "Staff", "Principal", "Director", "VP"];
const WORK_MODE_OPTIONS = ["Remote", "Hybrid", "On-site"];
const SOURCE_OPTIONS = [
  { value: "search", label: "AI Web Search" },
  { value: "boards", label: "Job Boards (LinkedIn, Indeed)" },
  { value: "startups", label: "Startup Boards (YC, Wellfound)" },
  { value: "career_pages", label: "Company Career Pages" },
];

export default function JobAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [results, setResults] = useState<AlertResult[]>([]);
  const [resumes, setResumes] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [runningAlert, setRunningAlert] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // New alert form state
  const [form, setForm] = useState({
    name: "", keywords: "", location: "", seniority: [] as string[],
    work_mode: [] as string[], salary_min: "", salary_max: "",
    industries: "", sources: ["search", "boards", "startups"] as string[],
    resume_based: false, resume_id: "",
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [alertsRes, resultsRes, resumesRes] = await Promise.all([
      supabase.from("job_alerts").select("*").order("created_at", { ascending: false }),
      supabase.from("job_alert_results").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("saved_resumes").select("id, title").order("updated_at", { ascending: false }),
    ]);
    setAlerts((alertsRes.data as any) || []);
    setResults((resultsRes.data as any) || []);
    setResumes(resumesRes.data || []);
    setUnreadCount((resultsRes.data as any)?.filter((r: AlertResult) => !r.is_read).length || 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createAlert = async () => {
    if (!user || !form.keywords.trim()) return;
    const { error } = await supabase.from("job_alerts").insert({
      user_id: user.id,
      name: form.name || form.keywords,
      keywords: form.keywords,
      location: form.location || null,
      seniority: form.seniority.length ? form.seniority : null,
      work_mode: form.work_mode.length ? form.work_mode : null,
      salary_min: form.salary_min ? parseInt(form.salary_min) : null,
      salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      industries: form.industries ? form.industries.split(",").map(s => s.trim()) : null,
      sources: form.sources,
      resume_based: form.resume_based,
      resume_id: form.resume_id || null,
    } as any);
    if (error) { toast.error("Failed to create alert"); return; }
    toast.success("Job alert created!");
    setShowCreate(false);
    setForm({ name: "", keywords: "", location: "", seniority: [], work_mode: [], salary_min: "", salary_max: "", industries: "", sources: ["search", "boards", "startups"], resume_based: false, resume_id: "" });
    fetchData();
  };

  const toggleAlert = async (id: string, active: boolean) => {
    await supabase.from("job_alerts").update({ is_active: active } as any).eq("id", id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: active } : a));
  };

  const deleteAlert = async (id: string) => {
    await supabase.from("job_alerts").delete().eq("id", id);
    toast.success("Alert deleted");
    fetchData();
  };

  const runAlertNow = async (alertId: string) => {
    setRunningAlert(alertId);
    try {
      const { data, error } = await supabase.functions.invoke("process-job-alerts", {
        body: { alert_id: alertId },
      });
      if (error) throw error;
      toast.success(`Found ${data?.new_jobs_found || 0} new jobs!`);
      fetchData();
    } catch (e) {
      toast.error("Failed to run alert");
    } finally {
      setRunningAlert(null);
    }
  };

  const markAsRead = async (resultId: string) => {
    await supabase.from("job_alert_results").update({ is_read: true } as any).eq("id", resultId);
    setResults(prev => prev.map(r => r.id === resultId ? { ...r, is_read: true } : r));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = results.filter(r => !r.is_read).map(r => r.id);
    if (!unreadIds.length) return;
    for (const id of unreadIds) {
      await supabase.from("job_alert_results").update({ is_read: true } as any).eq("id", id);
    }
    setResults(prev => prev.map(r => ({ ...r, is_read: true })));
    setUnreadCount(0);
    toast.success("All marked as read");
  };

  const filteredResults = selectedAlert
    ? results.filter(r => r.alert_id === selectedAlert)
    : results;

  const toggleArrayField = (field: "seniority" | "work_mode" | "sources", value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter(v => v !== value) : [...prev[field], value],
    }));
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" /> Job Alerts
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">{unreadCount} new</Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Automated daily job scraping with smart matching
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                <Check className="w-4 h-4 mr-1" /> Mark all read
              </Button>
            )}
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Alert
            </Button>
          </div>
        </div>

        <Tabs defaultValue="results" className="space-y-4">
          <TabsList>
            <TabsTrigger value="results" className="gap-1">
              <Sparkles className="w-4 h-4" /> Results
              {unreadCount > 0 && <Badge variant="secondary" className="ml-1 text-xs">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1">
              <Bell className="w-4 h-4" /> My Alerts ({alerts.length})
            </TabsTrigger>
          </TabsList>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {/* Filter by alert */}
            <div className="flex gap-2 flex-wrap">
              <Button variant={selectedAlert === null ? "default" : "outline"} size="sm" onClick={() => setSelectedAlert(null)}>All</Button>
              {alerts.map(a => (
                <Button key={a.id} variant={selectedAlert === a.id ? "default" : "outline"} size="sm" onClick={() => setSelectedAlert(a.id)}>
                  {a.name}
                </Button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : filteredResults.length === 0 ? (
              <Card className="p-8 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground">No results yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {alerts.length === 0 ? "Create an alert to start finding jobs automatically" : "Your alerts will find jobs on the next daily scan. Or run one now!"}
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredResults.map((result) => {
                    const job = result.job_data;
                    return (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border rounded-lg p-4 transition-colors ${!result.is_read ? "bg-primary/5 border-primary/20" : "bg-card border-border"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {!result.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                              <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
                              <Badge variant="outline" className="text-xs shrink-0">{job.alert_name}</Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{job.company}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                              {job.work_mode && <Badge variant="secondary" className="text-xs">{job.work_mode}</Badge>}
                              {job.seniority && <Badge variant="secondary" className="text-xs">{job.seniority}</Badge>}
                              {job.salary_range && job.salary_range !== "Not disclosed" && (
                                <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary_range}</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.short_description}</p>
                            {job.key_requirements?.length > 0 && (
                              <div className="flex gap-1.5 mt-2 flex-wrap">
                                {job.key_requirements.slice(0, 4).map((r: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">{r}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            {!result.is_read && (
                              <Button variant="ghost" size="sm" onClick={() => markAsRead(result.id)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            {job.apply_url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Found {new Date(result.created_at).toLocaleDateString()}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            {alerts.length === 0 ? (
              <Card className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground">No alerts yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Create your first alert to start finding jobs automatically</p>
                <Button className="mt-4" onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Create Alert
                </Button>
              </Card>
            ) : (
              alerts.map((alert) => (
                <Card key={alert.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{alert.name}</h3>
                        <Badge variant={alert.is_active ? "default" : "secondary"} className="text-xs">
                          {alert.is_active ? "Active" : "Paused"}
                        </Badge>
                        {alert.resume_based && <Badge variant="outline" className="text-xs gap-1"><Target className="w-3 h-3" />Resume-based</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Search className="w-3 h-3" />{alert.keywords}</span>
                        {alert.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{alert.location}</span>}
                        {alert.seniority?.length ? <span>{alert.seniority.join(", ")}</span> : null}
                        {alert.work_mode?.length ? <span>{alert.work_mode.join(", ")}</span> : null}
                      </div>
                      {alert.last_run_at && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Last run: {new Date(alert.last_run_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={alert.is_active} onCheckedChange={(v) => toggleAlert(alert.id, v)} />
                      <Button variant="outline" size="sm" onClick={() => runAlertNow(alert.id)} disabled={runningAlert === alert.id}>
                        {runningAlert === alert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteAlert(alert.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Create Alert Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" /> Create Job Alert
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Alert Name</Label>
                <Input placeholder="e.g. Senior React Jobs" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>

              <div>
                <Label>Keywords *</Label>
                <Input placeholder="e.g. React Developer, Frontend Engineer" value={form.keywords} onChange={e => setForm(p => ({ ...p, keywords: e.target.value }))} />
              </div>

              <div>
                <Label>Location</Label>
                <Input placeholder="e.g. San Francisco, Remote" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
              </div>

              <div>
                <Label className="mb-2 block">Seniority</Label>
                <div className="flex flex-wrap gap-2">
                  {SENIORITY_OPTIONS.map(s => (
                    <Badge key={s} variant={form.seniority.includes(s) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleArrayField("seniority", s)}>
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Work Mode</Label>
                <div className="flex flex-wrap gap-2">
                  {WORK_MODE_OPTIONS.map(w => (
                    <Badge key={w} variant={form.work_mode.includes(w) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleArrayField("work_mode", w)}>
                      {w}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Min Salary ($K)</Label>
                  <Input type="number" placeholder="80" value={form.salary_min} onChange={e => setForm(p => ({ ...p, salary_min: e.target.value }))} />
                </div>
                <div>
                  <Label>Max Salary ($K)</Label>
                  <Input type="number" placeholder="200" value={form.salary_max} onChange={e => setForm(p => ({ ...p, salary_max: e.target.value }))} />
                </div>
              </div>

              <div>
                <Label>Industries (comma-separated)</Label>
                <Input placeholder="e.g. Tech, Healthcare, Finance" value={form.industries} onChange={e => setForm(p => ({ ...p, industries: e.target.value }))} />
              </div>

              <div>
                <Label className="mb-2 block">Sources</Label>
                <div className="space-y-2">
                  {SOURCE_OPTIONS.map(s => (
                    <label key={s.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={form.sources.includes(s.value)} onCheckedChange={() => toggleArrayField("sources", s.value)} />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Switch checked={form.resume_based} onCheckedChange={v => setForm(p => ({ ...p, resume_based: v }))} />
                <div>
                  <Label className="font-medium">Resume-based matching</Label>
                  <p className="text-xs text-muted-foreground">Auto-match based on your resume skills</p>
                </div>
              </div>

              {form.resume_based && resumes.length > 0 && (
                <div>
                  <Label>Select Resume</Label>
                  <Select value={form.resume_id} onValueChange={v => setForm(p => ({ ...p, resume_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choose a resume" /></SelectTrigger>
                    <SelectContent>
                      {resumes.map(r => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={createAlert} disabled={!form.keywords.trim()}>
                <Bell className="w-4 h-4 mr-1" /> Create Alert
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
