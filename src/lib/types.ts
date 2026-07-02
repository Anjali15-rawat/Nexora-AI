// Shared types used across client and server.
// No server-only imports allowed here — this file ships to the browser.

/** Authenticated user info returned from getSession() */
export interface AppUser {
  id: string;
  email: string;
  name: string;
}

/** Business entity linked to the user */
export interface AppBusiness {
  id: string;
  name: string;
  url: string;
  plan: "free" | "pro" | "enterprise";
  auditsUsed: number;
  auditsLimit: number;
}

export type UserRole = "owner" | "admin" | "viewer";

/** Session state returned from the auth guard */
export interface AuthSession {
  authenticated: true;
  user: AppUser;
  business: AppBusiness | null;
  role: UserRole | null;
}

export interface UnauthenticatedSession {
  authenticated: false;
}

export type SessionState = AuthSession | UnauthenticatedSession;

/** Intelligence score entry */
export interface IntelligenceScore {
  label: string;
  value: number;
  delta: number;
  hint: string;
  scoreType: string;
}

/** Growth score with breakdown */
export interface GrowthScore {
  total: number;
  breakdown: { label: string; value: number }[];
}

/** Opportunity card data */
export interface Opportunity {
  id: string;
  title: string;
  type: string;
  impact: "Low" | "Medium" | "High";
  difficulty: "Easy" | "Medium" | "Hard";
  revenue: number;
  actionPlan?: string;
  status: "open" | "in_progress" | "done" | "dismissed";
}

/** Competitor entity */
export interface Competitor {
  id: string;
  name: string;
  url: string;
  category: string;
  threatLevel: "Low" | "Medium" | "High";
  contentScore: number;
  trafficTrend: number;
}

/** Competitor change event */
export interface CompetitorChange {
  name: string;
  change: string;
  type: string;
  at: string;
}

/** Report entry */
export interface Report {
  id: string;
  title: string;
  period: "Daily" | "Weekly" | "Monthly";
  date: string;
  summary: string;
  content?: string;
}

/** Chat message */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

/** Trend data */
export interface TrendItem {
  topic: string;
  growth: number;
  signal: string;
  direction: "rising" | "declining" | "stable";
}
