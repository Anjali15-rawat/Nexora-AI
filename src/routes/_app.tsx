import { createFileRoute, redirect, isRedirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { AuthProvider } from "@/hooks/use-auth";
import { getSession } from "@/lib/api/auth.functions";
import type { AuthSession } from "@/lib/types";
import { RouteErrorBoundary } from "@/components/app/ErrorBoundary";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    try {
      const session = await getSession();

      if (!session.authenticated) {
        throw redirect({ to: "/login" });
      }

      // Redirect to onboarding if they haven't connected a business yet
      if (!session.business && location.pathname !== "/onboarding") {
        throw redirect({ to: "/onboarding" });
      }

      // If they already have a business, prevent them from going back to onboarding
      if (session.business && location.pathname === "/onboarding") {
        throw redirect({ to: "/overview" });
      }

      return { session: session as AuthSession };
    } catch (error) {
      // If the error is a redirect, re-throw it
      if (isRedirect(error)) {
        throw error;
      }

      console.warn("Auth check failed:", error);
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
  errorComponent: RouteErrorBoundary,
});

function AppLayout() {
  const { session } = Route.useRouteContext();

  return (
    <AuthProvider user={session.user} business={session.business} role={session.role}>
      <AppShell />
    </AuthProvider>
  );
}
