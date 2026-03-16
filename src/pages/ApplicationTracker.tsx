import { useState, useEffect } from "react";
import { motion } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Plus, Calendar, Building2, MapPin, Trash2, Edit, ExternalLink, Briefcase, CheckCircle2, Clock, AlertTriangle, Target } from "lucide-react";

interface Application {
  id: string;
  company: string;
  role: string;
  status: "applied" | "interview" | "offer" | "rejected" | "saved";
  applied_date: string;
  salary?: string;
  location?: string;
  url?: string;
  notes?: string;
  next_follow_up?: string;
}

const columns = [
  { id: "saved", label: "Saved", color: "bg-muted", icon: Target, accent: "text-muted-foreground" },
  { id: "applied", label: "Applied", color: "bg-blue-500/10", icon: Briefcase, accent: "text-blue-600 dark:text-blue-400" },
  { id: "interview", label: "Interview", color: "bg-amber-500/10", icon: Clock, accent: "text-amber-600 dark:text-amber-400" },
  { id: "offer", label: "Offer", color: "bg-emerald-500/10", icon: CheckCircle2, accent: "text-emerald-600 dark:text-emerald-400" },
  { id: "rejected", label: "Rejected", color: "bg-destructive/10", icon: AlertTriangle, accent: "text-destructive" },
];

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export default function ApplicationTracker() {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [form, setForm] = useState({ company: "", role: "", status: "applied" as Application["status"], salary: "", location: "", url: "", notes: "", next_follow_up: "" });

  useEffect(() => {
    const stored = localStorage.getItem(`app_tracker_${user?.id}`);
    if (stored) setApps(JSON.parse(stored));
  }, [user]);

  const save = (updated: Application[]) => {
    setApps(updated);
    localStorage.setItem(`app_tracker_${user?.id}`, JSON.stringify(updated));
  };

  const handleAdd = () => {
    if (!form.company || !form.role) { toast.error("Company and role are required"); return; }
    const newApp: Application = { ...form, id: crypto.randomUUID(), applied_date: new Date().toISOString() };
    if (editApp) {
      save(apps.map(a => a.id === editApp.id ? { ...editApp, ...form } : a));
      toast.success("Application updated");
    } else {
      save([...apps, newApp]);
      toast.success("Application added");
    }
    setForm({ company: "", role: "", status: "applied", salary: "", location: "", url: "", notes: "", next_follow_up: "" });
    setEditApp(null);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => { save(apps.filter(a => a.id !== id)); toast.success("Removed"); };
  const moveApp = (id: string, newStatus: Application["status"]) => { save(apps.map(a => a.id === id ? { ...a, status: newStatus } : a)); };

  const openEdit = (app: Application) => {
    setEditApp(app);
    setForm({ company: app.company, role: app.role, status: app.status, salary: app.salary || "", location: app.location || "", url: app.url || "", notes: app.notes || "", next_follow_up: app.next_follow_up || "" });
    setDialogOpen(true);
  };

  const today = new Date().toISOString().split("T")[0];
  const needsFollowUp = apps.filter(a => a.next_follow_up && a.next_follow_up <= today && a.status !== "rejected" && a.status !== "offer");

  return (
    <AppLayout title="Application Tracker" subtitle="Kanban board to track your job applications">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        {/* Follow-up Alert */}
        {needsFollowUp.length > 0 && (
          <motion.div {...fade(0)} className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Clock className="h-4 w-4" /> {needsFollowUp.length} application(s) need follow-up today
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {needsFollowUp.map(a => <Badge key={a.id} variant="outline" className="text-xs">{a.company} — {a.role}</Badge>)}
            </div>
          </motion.div>
        )}

        {/* Stats + Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="grid grid-cols-5 gap-2 flex-1">
            {columns.map(c => {
              const count = apps.filter(a => a.status === c.id).length;
              return (
                <div key={c.id} className="rounded-lg border bg-card p-2.5 text-center">
                  <c.icon className={`h-4 w-4 mx-auto mb-1 ${c.accent}`} />
                  <p className="text-lg font-bold leading-none">{count}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{c.label}</p>
                </div>
              );
            })}
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditApp(null); setForm({ company: "", role: "", status: "applied", salary: "", location: "", url: "", notes: "", next_follow_up: "" }); } }}>
            <DialogTrigger asChild><Button size="sm" className="gap-1.5 shrink-0"><Plus className="h-4 w-4" /> Add Application</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editApp ? "Edit" : "Add"} Application</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Company *" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                <Input placeholder="Role / Position *" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as Application["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{columns.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Salary range" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
                  <Input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>
                <Input placeholder="Job URL" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
                <Input type="date" placeholder="Follow-up date" value={form.next_follow_up} onChange={e => setForm({ ...form, next_follow_up: e.target.value })} />
                <Textarea placeholder="Notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
                <Button className="w-full" onClick={handleAdd}>{editApp ? "Update" : "Add"} Application</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Empty State */}
        {apps.length === 0 && (
          <motion.div {...fade(1)} className="rounded-2xl border-2 border-dashed bg-card/50 p-12 sm:p-16 text-center">
            <Briefcase className="h-10 w-10 text-primary/40 mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold mb-2">Start Tracking Applications</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Keep your job search organized. Track status, add follow-up dates, and never lose track of an application.
            </p>
            <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add Your First Application
            </Button>
          </motion.div>
        )}

        {/* Kanban Board */}
        {apps.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 min-h-[50vh]">
            {columns.map((col, ci) => (
              <motion.div key={col.id} {...fade(ci)} className={`rounded-xl border p-2.5 ${col.color} min-h-[200px]`}>
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <col.icon className={`h-3.5 w-3.5 ${col.accent}`} />
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{col.label}</h3>
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 ml-auto">{apps.filter(a => a.status === col.id).length}</Badge>
                </div>
                <div className="space-y-2">
                  {apps.filter(a => a.status === col.id).map((app, i) => (
                    <motion.div key={app.id} {...fade(i)} className="bg-card border rounded-lg p-2.5 sm:p-3 space-y-1.5 group hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium leading-tight truncate">{app.role}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 truncate"><Building2 className="h-2.5 w-2.5 shrink-0" />{app.company}</p>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6" onClick={() => openEdit(app)}><Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" onClick={() => handleDelete(app.id)}><Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" /></Button>
                        </div>
                      </div>
                      {app.location && <p className="text-[9px] sm:text-[10px] text-muted-foreground flex items-center gap-1 truncate"><MapPin className="h-2.5 w-2.5 shrink-0" />{app.location}</p>}
                      {app.salary && <Badge variant="secondary" className="text-[9px] sm:text-[10px] h-4">{app.salary}</Badge>}
                      {app.url && <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-[9px] sm:text-[10px] text-primary flex items-center gap-0.5 hover:underline truncate"><ExternalLink className="h-2.5 w-2.5 shrink-0" />View Job</a>}
                      {app.next_follow_up && (
                        <p className={`text-[9px] sm:text-[10px] flex items-center gap-1 ${app.next_follow_up <= today ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-muted-foreground"}`}>
                          <Calendar className="h-2.5 w-2.5 shrink-0" />Follow-up: {app.next_follow_up}
                        </p>
                      )}
                      <div className="pt-1">
                        <Select value={app.status} onValueChange={v => moveApp(app.id, v as Application["status"])}>
                          <SelectTrigger className="h-5 text-[9px] sm:text-[10px] px-1.5 w-auto"><SelectValue /></SelectTrigger>
                          <SelectContent>{columns.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
