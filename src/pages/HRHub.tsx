import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search, MapPin, Building2, Linkedin, Twitter, Facebook, Users, ExternalLink,
  Filter, X, Heart, Send, Loader2, Copy, CheckCircle2, MessageSquare, Sparkles, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface HRContact {
  name: string;
  jobTitle: string;
  linkedinUrl: string;
  companyName: string;
  companyWebsite: string;
  companyLinkedin: string;
  companySocial: string;
  companyTwitter: string;
  location: string;
  companyNiche: string;
}

interface OutreachData {
  subject: string;
  message: string;
  linkedin_note: string;
  tips: string[];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else current += ch;
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): HRContact[] {
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];
  return lines.slice(1).map(line => {
    const cols = parseCSVLine(line);
    return {
      name: cols[0] || "", jobTitle: cols[1] || "", linkedinUrl: cols[2] || "",
      companyName: cols[3] || "", companyWebsite: cols[4] || "", companyLinkedin: cols[5] || "",
      companySocial: cols[6] || "", companyTwitter: cols[7] || "", location: cols[8] || "",
      companyNiche: cols[9] || "",
    };
  }).filter(c => c.name);
}

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: Math.min(i * 0.02, 0.5) } });
const ITEMS_PER_PAGE = 60;

export default function HRHub() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<HRContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [outreachContact, setOutreachContact] = useState<HRContact | null>(null);
  const [outreachData, setOutreachData] = useState<OutreachData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Load contacts
  useEffect(() => {
    fetch("/data/hr-database.csv")
      .then(r => r.text())
      .then(text => { setContacts(parseCSV(text)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Load favorites
  useEffect(() => {
    if (!user) return;
    supabase.from("recruiter_favorites").select("recruiter_name").eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setFavorites(new Set(data.map(d => d.recruiter_name)));
      });
  }, [user]);

  const toggleFavorite = async (contact: HRContact) => {
    if (!user) { toast.error("Sign in to save favorites"); return; }
    const isFav = favorites.has(contact.name);
    if (isFav) {
      await supabase.from("recruiter_favorites").delete().eq("user_id", user.id).eq("recruiter_name", contact.name);
      setFavorites(prev => { const next = new Set(prev); next.delete(contact.name); return next; });
      toast.success("Removed from favorites");
    } else {
      await supabase.from("recruiter_favorites").insert({
        user_id: user.id,
        recruiter_name: contact.name,
        recruiter_data: contact as any,
      });
      setFavorites(prev => new Set(prev).add(contact.name));
      toast.success("Added to favorites!");
    }
  };

  const handleGenerateOutreach = async (contact: HRContact) => {
    setOutreachContact(contact);
    setOutreachData(null);
    setGenerating(true);
    try {
      // Get full resume data for personalization
      let resumeSummary = "";
      let skills: string[] = [];
      let experience: string[] = [];
      let achievements: string[] = [];
      let title = "";

      const stored = sessionStorage.getItem("parsed_resume_data");
      if (stored) {
        const parsed = JSON.parse(stored);
        resumeSummary = parsed.summary || "";
        title = parsed.contact?.title || "";
        if (parsed.skills) {
          skills = parsed.skills.flatMap((s: any) => s.items ? s.items.split(",").map((i: string) => i.trim()) : []);
        }
        if (parsed.experience) {
          experience = parsed.experience.map((e: any) => `${e.title} at ${e.company} (${e.startDate}-${e.endDate || "Present"})`);
          achievements = parsed.experience.flatMap((e: any) => (e.bullets || []).slice(0, 2));
        }
      }
      
      if (!resumeSummary) {
        const { data } = await supabase.from("saved_resumes").select("resume_data").order("updated_at", { ascending: false }).limit(1).maybeSingle();
        if (data) {
          const rd = data.resume_data as any;
          resumeSummary = rd.summary || "";
          title = rd.contact?.title || "";
          if (rd.skills) {
            skills = rd.skills.flatMap((s: any) => s.items ? s.items.split(",").map((i: string) => i.trim()) : []);
          }
          if (rd.experience) {
            experience = rd.experience.map((e: any) => `${e.title} at ${e.company} (${e.startDate}-${e.endDate || "Present"})`);
            achievements = rd.experience.flatMap((e: any) => (e.bullets || []).slice(0, 2));
          }
        }
      }

      const { data: result, error } = await supabase.functions.invoke("generate-outreach", {
        body: {
          recruiterName: contact.name,
          recruiterTitle: contact.jobTitle,
          companyName: contact.companyName,
          companyNiche: contact.companyNiche,
          location: contact.location,
          resumeSummary: resumeSummary || `${title} professional`,
          candidateTitle: title,
          skills: skills.slice(0, 15),
          experience: experience.slice(0, 5),
          achievements: achievements.slice(0, 5),
          targetRole,
        },
      });
      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);
      setOutreachData(result);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate outreach");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const locations = useMemo(() => Array.from(new Set(contacts.map(c => c.location).filter(Boolean))).sort(), [contacts]);
  const niches = useMemo(() => Array.from(new Set(contacts.map(c => c.companyNiche).filter(Boolean))).sort(), [contacts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contacts.filter(c => {
      if (showFavoritesOnly && !favorites.has(c.name)) return false;
      if (locationFilter !== "all" && c.location !== locationFilter) return false;
      if (nicheFilter !== "all" && c.companyNiche !== nicheFilter) return false;
      if (q) return c.name.toLowerCase().includes(q) || c.jobTitle.toLowerCase().includes(q) || c.companyName.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) || c.companyNiche.toLowerCase().includes(q);
      return true;
    });
  }, [contacts, search, locationFilter, nicheFilter, showFavoritesOnly, favorites]);

  const visible = filtered.slice(0, visibleCount);
  const activeFilters = (locationFilter !== "all" ? 1 : 0) + (nicheFilter !== "all" ? 1 : 0) + (search ? 1 : 0) + (showFavoritesOnly ? 1 : 0);

  const clearFilters = () => { setSearch(""); setLocationFilter("all"); setNicheFilter("all"); setShowFavoritesOnly(false); setVisibleCount(ITEMS_PER_PAGE); };

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };
  const initialsColor = (name: string) => {
    const colors = [
      "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      "bg-purple-500/15 text-purple-600 dark:text-purple-400",
      "bg-amber-500/15 text-amber-600 dark:text-amber-400",
      "bg-rose-500/15 text-rose-600 dark:text-rose-400",
      "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <AppLayout title="HR Hub">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <motion.div {...fade(0)} className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight mb-1">HR Hub</h1>
            <p className="text-sm text-muted-foreground">
              {contacts.length.toLocaleString()} recruiters — search, filter, bookmark, and reach out.
            </p>
          </div>
          {favorites.size > 0 && (
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setVisibleCount(ITEMS_PER_PAGE); }}
            >
              <Heart className={`h-3.5 w-3.5 ${showFavoritesOnly ? "fill-current" : ""}`} />
              Favorites ({favorites.size})
            </Button>
          )}
        </motion.div>

        {/* Search & Filters */}
        <motion.div {...fade(1)} className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => { setSearch(e.target.value); setVisibleCount(ITEMS_PER_PAGE); }} placeholder="Search by name, title, company, location, or niche..." className="pl-10 text-sm" />
            </div>
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-xs text-muted-foreground shrink-0">
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <Select value={locationFilter} onValueChange={v => { setLocationFilter(v); setVisibleCount(ITEMS_PER_PAGE); }}>
              <SelectTrigger className="w-[200px] h-8 text-xs"><MapPin className="h-3 w-3 mr-1.5 text-muted-foreground" /><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={nicheFilter} onValueChange={v => { setNicheFilter(v); setVisibleCount(ITEMS_PER_PAGE); }}>
              <SelectTrigger className="w-[220px] h-8 text-xs"><Building2 className="h-3 w-3 mr-1.5 text-muted-foreground" /><SelectValue placeholder="Industry" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {niches.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="ml-auto text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{Math.min(visibleCount, filtered.length)}</span> of <span className="font-semibold text-foreground">{filtered.length.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        {/* Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-5 animate-pulse space-y-3">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-muted" /><div className="flex-1 space-y-2"><div className="h-3 bg-muted rounded w-3/4" /><div className="h-2.5 bg-muted rounded w-1/2" /></div></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed bg-card/50 p-16 text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold mb-2">No contacts found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((contact, i) => {
                const isFav = favorites.has(contact.name);
                return (
                  <motion.div key={`${contact.name}-${contact.companyName}-${i}`} {...fade(i)} className="rounded-xl border bg-card p-5 card-hover group relative">
                    {/* Favorite button */}
                    <button onClick={() => toggleFavorite(contact)} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
                      <Heart className={`h-4 w-4 transition-colors ${isFav ? "fill-rose-500 text-rose-500" : "text-muted-foreground/30 group-hover:text-muted-foreground/60"}`} />
                    </button>

                    {/* Person */}
                    <div className="flex items-start gap-3 mb-3 pr-8">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${initialsColor(contact.name)}`}>
                        {getInitials(contact.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold truncate">{contact.name}</h3>
                          {contact.linkedinUrl && (
                            <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 shrink-0"><Linkedin className="h-3.5 w-3.5" /></a>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{contact.jobTitle}</p>
                      </div>
                    </div>

                    {/* Company */}
                    <div className="p-2.5 rounded-lg bg-secondary/40 mb-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-xs font-medium truncate">{contact.companyName}</span>
                        {contact.companyWebsite && <a href={contact.companyWebsite} target="_blank" rel="noopener noreferrer" className="ml-auto text-muted-foreground hover:text-foreground shrink-0"><ExternalLink className="h-3 w-3" /></a>}
                      </div>
                      {contact.location && (
                        <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-muted-foreground shrink-0" /><span className="text-[11px] text-muted-foreground truncate">{contact.location}</span></div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      {contact.companyNiche && <Badge variant="outline" className="text-[10px] whitespace-normal leading-tight">{contact.companyNiche}</Badge>}
                      <div className="flex items-center gap-1 ml-auto">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] gap-1 text-primary" onClick={() => handleGenerateOutreach(contact)}>
                          <Send className="h-3 w-3" /> Outreach
                        </Button>
                        {contact.companyLinkedin && <a href={contact.companyLinkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 hover:text-blue-500 transition-colors p-1"><Linkedin className="h-3 w-3" /></a>}
                        {contact.companyTwitter && <a href={contact.companyTwitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 hover:text-sky-500 transition-colors p-1"><Twitter className="h-3 w-3" /></a>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {visibleCount < filtered.length && (
              <div className="text-center pt-4">
                <Button variant="outline" onClick={() => setVisibleCount(v => v + ITEMS_PER_PAGE)} className="gap-2">
                  Load More ({Math.min(ITEMS_PER_PAGE, filtered.length - visibleCount)} more)
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Outreach Dialog */}
      <Dialog open={!!outreachContact} onOpenChange={(open) => { if (!open) { setOutreachContact(null); setOutreachData(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Outreach to {outreachContact?.name}
            </DialogTitle>
          </DialogHeader>

          {!outreachData && !generating && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-secondary/40">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{outreachContact?.name}</span> — {outreachContact?.jobTitle} at {outreachContact?.companyName}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Target Role (optional — improves personalization)</Label>
                <Input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Senior Software Engineer, Product Manager..." className="text-sm" />
              </div>
              <Button onClick={() => outreachContact && handleGenerateOutreach(outreachContact)} className="w-full gap-2">
                <Sparkles className="h-4 w-4" /> Generate Personalized Message
              </Button>
            </div>
          )}

          {generating && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Crafting a personalized message...</p>
            </div>
          )}

          {outreachData && (
            <Tabs defaultValue="inmail" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="inmail" className="text-xs gap-1.5"><MessageSquare className="h-3 w-3" /> InMail / Email</TabsTrigger>
                <TabsTrigger value="connection" className="text-xs gap-1.5"><Linkedin className="h-3 w-3" /> Connection Note</TabsTrigger>
              </TabsList>

              <TabsContent value="inmail" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Subject Line</Label>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1" onClick={() => copyToClipboard(outreachData.subject, "subject")}>
                      {copiedField === "subject" ? <CheckCircle2 className="h-3 w-3 text-score-excellent" /> : <Copy className="h-3 w-3" />} Copy
                    </Button>
                  </div>
                  <div className="p-3 rounded-lg border bg-secondary/20 text-sm font-medium">{outreachData.subject}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Message</Label>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1" onClick={() => copyToClipboard(outreachData.message, "message")}>
                      {copiedField === "message" ? <CheckCircle2 className="h-3 w-3 text-score-excellent" /> : <Copy className="h-3 w-3" />} Copy
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg border bg-secondary/20 text-sm leading-relaxed whitespace-pre-wrap">{outreachData.message}</div>
                </div>
              </TabsContent>

              <TabsContent value="connection" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">LinkedIn Connection Note (300 chars)</Label>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1" onClick={() => copyToClipboard(outreachData.linkedin_note, "note")}>
                      {copiedField === "note" ? <CheckCircle2 className="h-3 w-3 text-score-excellent" /> : <Copy className="h-3 w-3" />} Copy
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg border bg-secondary/20 text-sm leading-relaxed">{outreachData.linkedin_note}</div>
                  <p className="text-[10px] text-muted-foreground">{outreachData.linkedin_note.length}/300 characters</p>
                </div>
              </TabsContent>

              {/* Tips */}
              {outreachData.tips?.length > 0 && (
                <div className="p-3 rounded-lg bg-primary/[0.05] border border-primary/10 space-y-2">
                  <h4 className="text-xs font-semibold flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-primary" /> Pro Tips</h4>
                  {outreachData.tips.map((tip, i) => (
                    <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span> {tip}
                    </p>
                  ))}
                </div>
              )}

              <Button variant="outline" className="w-full gap-2" onClick={() => { setOutreachData(null); setGenerating(false); }}>
                <Sparkles className="h-4 w-4" /> Regenerate
              </Button>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
