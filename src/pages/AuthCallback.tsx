import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageLoader } from "@/components/layout/PageLoader";

/**
 * Handles OAuth callback redirects.
 * When the user returns from Google OAuth, this page processes
 * the URL hash/params and redirects to the dashboard.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      console.log("[AuthCallback] Processing OAuth callback...");
      console.log("[AuthCallback] Hash:", window.location.hash);
      console.log("[AuthCallback] Search:", window.location.search);

      // Give the auth module time to process tokens
      // The supabase client auto-detects hash fragments with access_token
      let attempts = 0;
      const maxAttempts = 10;

      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[AuthCallback] Session check attempt", attempts, ":", !!session);

        if (session) {
          console.log("[AuthCallback] Session found! Redirecting to dashboard.");
          navigate("/dashboard", { replace: true });
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkSession, 300);
        } else {
          console.error("[AuthCallback] Failed to establish session after", maxAttempts, "attempts");
          navigate("/login", { replace: true });
        }
      };

      // Start checking after a brief delay
      setTimeout(checkSession, 200);
    };

    handleCallback();
  }, [navigate]);

  return <PageLoader />;
}
