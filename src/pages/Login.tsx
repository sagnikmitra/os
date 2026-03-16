import { useState } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Loader2, Shield, Hammer, Briefcase, Mic, TrendingUp, Mail, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import sgnkLogo from "@/assets/sgnkLogo.png";

const HIGHLIGHTS = [
  { icon: Shield, label: "9-Dimension AI Analysis", color: "text-blue-400" },
  { icon: Hammer, label: "10 Professional Templates", color: "text-violet-400" },
  { icon: Briefcase, label: "AI Job Matching & Alerts", color: "text-emerald-400" },
  { icon: Mic, label: "Mock Interview Simulator", color: "text-amber-400" },
  { icon: TrendingUp, label: "Career Growth Intelligence", color: "text-cyan-400" },
  { icon: Mail, label: "AI Outreach Generator", color: "text-rose-400" },
];

export default function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message || "Failed to sign in");
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      console.log("[Login] Starting Google OAuth...");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
        extraParams: {
          prompt: "select_account",
        },
      });
      console.log("[Login] Google OAuth result:", JSON.stringify(result));
      if (result?.error) {
        toast.error("Google sign-in failed. Please try again.");
        setGoogleLoading(false);
      }
    } catch (err: any) {
      console.error("[Login] Google OAuth error:", err);
      toast.error("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-gradient-to-br from-primary/[0.08] via-background to-primary/[0.04]">
        {/* Ambient */}
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-primary/[0.06] blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-56 h-56 rounded-full bg-primary/[0.04] blur-[80px]" />

        <div className="relative z-10 flex flex-col justify-between p-10 lg:p-14 w-full">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <img src={sgnkLogo} alt="sgnk" className="w-6 h-6" />
              </div>
              <div>
                <span className="font-display text-base font-bold tracking-tight">
                  <span className="text-muted-foreground font-normal">sgnk</span> CareerOS
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-[52px]">Your AI-powered career platform</p>
          </div>

          {/* Hero text */}
          <div className="max-w-md">
            <h2 className="font-display text-3xl lg:text-4xl font-bold tracking-[-0.03em] leading-[1.15] mb-4">
              Build resumes that
              <br />
              <span className="text-primary">get you hired.</span>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Deep AI analysis, intelligent rewriting, job matching, interview prep, and career growth tools — all in one platform.
            </p>

            {/* Feature chips */}
            <div className="grid grid-cols-2 gap-2">
              {HIGHLIGHTS.map((h) => (
                <div
                  key={h.label}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border/50 bg-card/50"
                >
                  <h.icon className={`h-4 w-4 shrink-0 ${h.color}`} />
                  <span className="text-xs font-medium text-foreground/80">{h.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 text-center">
            {[
              { n: "50+", l: "Tools" },
              { n: "10", l: "Templates" },
              { n: "9", l: "Analysis Dims" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-2xl font-bold text-primary">{s.n}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex flex-col">
        <nav className="flex items-center justify-between px-6 py-5">
          <Link to="/login" className="font-display text-sm font-bold tracking-tight lg:hidden">
            <span className="text-muted-foreground">sgnk</span> CareerOS
          </Link>
          <div className="lg:ml-auto flex items-center gap-3">
            <ThemeToggle />
            <Link to="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Create account
            </Link>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/[0.08] mb-5">
                <img src={sgnkLogo} alt="sgnk" className="w-8 h-8" />
              </div>
              <h1 className="font-display text-3xl font-bold tracking-[-0.02em] mb-2">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Sign in to your career dashboard.</p>
            </div>

            {/* Google OAuth */}
            <Button
              variant="outline"
              className="w-full gap-3 h-12 mb-6 rounded-xl border-border/60 hover:border-primary/20 hover:bg-secondary transition-all"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-background px-4 text-muted-foreground/60">or continue with email</span></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="h-11 rounded-xl" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full gap-2 h-11 rounded-xl shadow-md shadow-primary/15" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-8">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
