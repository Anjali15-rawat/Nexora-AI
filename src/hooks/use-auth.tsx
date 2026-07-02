import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AppUser, AppBusiness, UserRole } from "@/lib/types";

interface AuthContextValue {
  user: AppUser;
  business: AppBusiness | null;
  role: UserRole | null;
  /** Check if user has at least the given role */
  hasRole: (minimumRole: UserRole) => boolean;
  /** Convenience: true if role is 'owner' */
  isOwner: boolean;
  /** Convenience: true if role is 'owner' or 'admin' */
  isAdmin: boolean;
}

const ROLE_HIERARCHY: Record<UserRole, number> = { viewer: 0, admin: 1, owner: 2 };

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  user,
  business,
  role,
}: {
  children: ReactNode;
  user: AppUser;
  business: AppBusiness | null;
  role: UserRole | null;
}) {
  const value = useMemo<AuthContextValue>(() => {
    const hasRole = (minimumRole: UserRole): boolean => {
      if (!role) return false;
      return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimumRole];
    };

    return {
      user,
      business,
      role,
      hasRole,
      isOwner: role === "owner",
      isAdmin: role === "owner" || role === "admin",
    };
  }, [user, business, role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be used within <AuthProvider>");
  return ctx;
}
