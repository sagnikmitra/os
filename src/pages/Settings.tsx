import AppLayout from "@/components/layout/AppLayout";
import { motion } from "@/lib/motion-stub";
import { Moon, Sun, Monitor, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export default function Settings() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setFullName(data.full_name || "");
        setAvatarUrl(data.avatar_url || "");
      }
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, avatar_url: avatarUrl, updated_at: new Date().toISOString() }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error("Failed to save profile"); return; }
    toast.success("Profile updated");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const themeOptions: { value: "light" | "dark" | "system"; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];

  const initials = fullName ? fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <AppLayout title="Settings">
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
        {/* Profile */}
        <motion.div {...fade(0)} className="rounded-xl border bg-card p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                loading="lazy"
                decoding="async"
                className="w-12 h-12 rounded-xl object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{fullName || "Unnamed"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-3 pt-2 border-t">
              <div className="grid sm:grid-cols-2 gap-3 pt-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="h-10 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <Input id="email" value={user?.email || ""} disabled className="h-10 rounded-lg bg-secondary/50" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 rounded-lg">
                  {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</> : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Appearance */}
        <motion.div {...fade(1)} className="rounded-xl border bg-card p-5 sm:p-6">
          <p className="text-sm font-semibold mb-3">Appearance</p>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  theme === opt.value
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30 hover:bg-secondary/30"
                }`}
              >
                <opt.icon className={`h-5 w-5 mx-auto mb-1.5 ${theme === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-xs font-semibold">{opt.label}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.div {...fade(2)}>
          <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive" onClick={handleSignOut}>
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
