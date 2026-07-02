import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { loginSchema, type LoginInput } from "@/lib/validation";
import { signIn } from "@/lib/api/auth.functions";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export const Route = createFileRoute("/_auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasCode = window.location.search.includes("code=");
      const hasHashToken = window.location.hash.includes("access_token=");
      if (hasCode || hasHashToken) {
        setIsProcessingCallback(true);
      }
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError("");
    setLoading(true);

    try {
      const result = await signIn({ data });

      if (!result.success) {
        setServerError(result.error);
        setLoading(false);
        return;
      }

      // Set tokens in browser client for cookie sync
      if (result.session) {
        const isHttps = window.location.protocol === "https:";
        const cookieOptions = `path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${isHttps ? "; Secure" : ""}`;
        document.cookie = `sb-access-token=${result.session.accessToken}; ${cookieOptions}`;
        document.cookie = `sb-refresh-token=${result.session.refreshToken}; ${cookieOptions}`;

        const supabase = getSupabaseBrowser();
        await supabase.auth.setSession({
          access_token: result.session.accessToken,
          refresh_token: result.session.refreshToken,
        });
      }

      navigate({ to: "/overview" });
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google") => {
    setOauthLoading(provider);
    try {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/login`,
        },
      });
    } catch {
      setServerError(`Failed to connect with ${provider}. Please try again.`);
      setOauthLoading(null);
    }
  };

  if (isProcessingCallback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm text-center space-y-4 animate-fade-in">
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center shadow-glow animate-pulse">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Completing authentication...</h1>
          <p className="text-sm text-muted-foreground animate-pulse">
            Syncing secure session and redirecting you into the application. Please wait.
          </p>
          <div className="flex justify-center pt-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </Link>
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to Nexora AI
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={!!oauthLoading}
            onClick={() => handleOAuth("google")}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {oauthLoading === "google" ? "Connecting…" : "Continue with Google"}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>
          {serverError && (
            <p className="text-sm text-destructive" role="alert">{serverError}</p>
          )}
          <Button
            type="submit"
            className="w-full bg-gradient-primary border-0"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
        <p className="text-center text-sm">
          <Link
            to="/forgot-password"
            className="text-muted-foreground hover:text-primary"
          >
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  );
}
