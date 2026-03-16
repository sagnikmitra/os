import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "react-router-dom";
import { motion } from "@/lib/motion-stub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail, KeyRound } from "lucide-react";
import sgnkLogo from "@/assets/sgnkLogo.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

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
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight mb-2">Check your email</h1>
              <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                We've sent a password reset link to
              </p>
              <p className="text-sm font-medium text-foreground mb-6 px-3 py-2 rounded-lg bg-secondary/50 inline-block">{email}</p>
              <p className="text-xs text-muted-foreground mb-6">
                Didn't receive it? Check your spam folder or try again in a few minutes.
              </p>
              <div className="flex flex-col gap-2">
                <Link to="/login">
                  <Button variant="outline" className="w-full gap-2 h-11 rounded-xl">
                    <ArrowLeft className="h-4 w-4" /> Back to Sign In
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setSent(false)}>
                  Try a different email
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/[0.08] flex items-center justify-center mx-auto mb-5">
                  <KeyRound className="h-8 w-8 text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold tracking-tight mb-2">Reset password</h1>
                <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="h-11 rounded-xl" />
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl shadow-md shadow-primary/15" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-6">
                <Link to="/login" className="text-primary font-medium hover:underline">Back to Sign In</Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
