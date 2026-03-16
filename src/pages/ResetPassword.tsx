import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "@/lib/motion-stub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import sgnkLogo from "@/assets/sgnkLogo.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true);
      });
    }
  }, []);

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabels = ["", "Weak", "Fair", "Strong"];
  const strengthColors = ["", "bg-destructive", "bg-score-warning", "bg-score-excellent"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      navigate("/dashboard");
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight mb-2">Invalid or expired link</h1>
          <p className="text-sm text-muted-foreground mb-6">This password reset link is no longer valid. Please request a new one.</p>
          <Link to="/forgot-password">
            <Button className="h-11 rounded-xl gap-2 shadow-md shadow-primary/15">Request New Link</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center justify-between max-w-5xl mx-auto w-full px-6 py-5">
        <Link to="/login" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <img src={sgnkLogo} alt="sgnk" className="w-5 h-5" />
          </div>
          <span className="font-display text-sm font-bold tracking-tight">
            <span className="text-muted-foreground font-normal">sgnk</span> CareerOS
          </span>
        </Link>
        <ThemeToggle />
      </nav>
      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/[0.08] flex items-center justify-center mx-auto mb-5">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight mb-2">Set new password</h1>
            <p className="text-sm text-muted-foreground">Choose a strong password for your account.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium">New Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required className="h-11 rounded-xl" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(level => (
                      <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${level <= passwordStrength ? strengthColors[passwordStrength] : "bg-border"}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{strengthLabels[passwordStrength]}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required className="h-11 rounded-xl" />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>
            <Button type="submit" className="w-full h-11 rounded-xl shadow-md shadow-primary/15" disabled={loading || (!!confirmPassword && password !== confirmPassword)}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
