import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    
    const syncCookiesAndNavigate = (session: any) => {
      console.log("[AuthLayout] Syncing session cookies for:", session?.user?.email);
      const isHttps = window.location.protocol === "https:";
      const cookieOptions = `path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${isHttps ? "; Secure" : ""}`;
      document.cookie = `sb-access-token=${session.access_token}; ${cookieOptions}`;
      document.cookie = `sb-refresh-token=${session.refresh_token}; ${cookieOptions}`;
      console.log("[AuthLayout] Cookies written. Initiating deferred navigation to /overview...");
      
      // Defer navigation by 50ms to ensure the browser registers the cookies
      setTimeout(() => {
        navigate({ to: "/overview" });
      }, 50);
    };

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[AuthLayout] Initial session check resolved. Session exists:", !!session);
      if (session) {
        syncCookiesAndNavigate(session);
      }
    });

    // Listen for auth state shifts (like after OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[AuthLayout] onAuthStateChange event fired:", event, "Session exists:", !!session);
      if (session && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
        syncCookiesAndNavigate(session);
      }
    });

    return () => {
      console.log("[AuthLayout] Unsubscribing auth listeners...");
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden bg-gradient-surface border-r border-border">
        <div className="absolute inset-0 -z-10 opacity-70">
          <div className="absolute top-1/3 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/30 blur-[120px]" />
          <div className="absolute bottom-10 right-10 h-[300px] w-[300px] rounded-full bg-accent/20 blur-[100px]" />
        </div>
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">Nexora AI</span>
        </Link>
        <div>
          <div className="text-3xl font-semibold leading-tight max-w-md">
            "Replaced 3 tools and our weekly growth meeting."
          </div>
          <div className="text-sm text-muted-foreground mt-4">Maya Chen · Founder, Northwind Apparel</div>
        </div>
        <div className="text-xs text-muted-foreground">© 2026 Nexora AI</div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
