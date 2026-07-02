import { useRouter } from "@tanstack/react-router";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RouteErrorBoundaryProps {
  error: Error;
  reset: () => void;
}

/**
 * A reusable error boundary component for TanStack Router routes.
 * Displays a user-friendly error message with retry and home navigation.
 * Matches the glassmorphic dark theme design system.
 */
export function RouteErrorBoundary({ error, reset }: RouteErrorBoundaryProps) {
  const router = useRouter();

  const handleRetry = () => {
    router.invalidate();
    reset();
  };

  // Log the error for debugging (never expose to user)
  console.error("[RouteErrorBoundary]", error);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-2xl glass grid place-items-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This section encountered an issue. Your other data is safe — only
            this part of the page was affected.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={handleRetry} className="bg-gradient-primary border-0">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
          <Button variant="outline" asChild>
            <a href="/overview">
              <Home className="h-4 w-4 mr-2" />
              Go to dashboard
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
