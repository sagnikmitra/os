import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "@/lib/motion-stub";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";
import sgnkLogo from "@/assets/sgnkLogo.png";

const NotFound = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const homePath = user ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center justify-between max-w-5xl mx-auto w-full px-6 py-5">
        <Link to={homePath} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <img src={sgnkLogo} alt="sgnk" className="w-5 h-5" />
          </div>
          <span className="font-display text-sm font-bold tracking-tight">
            <span className="text-muted-foreground font-normal">sgnk</span> CareerOS
          </span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          {/* Large 404 */}
          <div className="relative mb-6">
            <div className="text-[120px] sm:text-[160px] font-display font-bold leading-none tracking-tighter text-primary/[0.07] select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Search className="h-9 w-9 text-primary/60" />
              </div>
            </div>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Page not found
          </h1>
          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
            The page <code className="text-xs px-1.5 py-0.5 rounded bg-secondary font-mono">{location.pathname}</code> doesn't exist or has been moved.
          </p>
          <p className="text-xs text-muted-foreground mb-8">
            If you followed a link, it may be outdated. Try navigating from the dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={homePath}>
              <Button className="gap-2 h-11 px-6 rounded-xl shadow-md shadow-primary/15">
                <Home className="h-4 w-4" />
                {user ? "Go to Dashboard" : "Go to Login"}
              </Button>
            </Link>
            <Button variant="outline" className="gap-2 h-11 px-6 rounded-xl" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" /> Go Back
            </Button>
          </div>

          {user && (
            <Link to="/help" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mt-6">
              <HelpCircle className="h-3 w-3" /> Browse all features
            </Link>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
