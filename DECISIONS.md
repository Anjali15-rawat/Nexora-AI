# Commerce Copilot AI — Architecture Decision Record

> Last updated: 2026-06-22T23:50:00+05:30

---

## ADR-001: Use Supabase as unified backend (Pending Confirmation)
**Status**: Proposed  
**Date**: 2026-06-17

**Decision**: Use Supabase for PostgreSQL + Auth + Storage + Edge Functions. Single provider, single billing, unified SDK.

---

## ADR-002: pgvector over Qdrant (Pending Confirmation)
**Status**: Proposed  
**Date**: 2026-06-17

**Decision**: Use pgvector within Supabase PostgreSQL.

---

## ADR-003: Gemini Flash as primary AI model
**Status**: Proposed  
**Date**: 2026-06-17

**Decision**: Use Gemini 2.0 Flash as the primary model. Reserve Gemini 2.5 Pro for complex synthesis tasks (executive reports, opportunity ranking).

---

## ADR-004: Keep Cloudflare Workers deployment (Pending Confirmation)
**Status**: Proposed  
**Date**: 2026-06-17

**Decision**: Keep Cloudflare Workers. Use Supabase REST API (not direct PG connections) since Workers don't support TCP.

---

## ADR-005: Incremental migration from mock data
**Status**: Accepted  
**Date**: 2026-06-17

**Decision**: Migrate pages incrementally. Each page gets a `useLiveData` hook that falls back to mock data if no real data exists yet. Mock data is the default until the corresponding engine is built.

---

## ADR-006: Server Functions over API routes
**Status**: Accepted  
**Date**: 2026-06-17

**Decision**: Use `createServerFn` exclusively. No custom API routes.

---

## ADR-007: Weighted Growth Score Calculation
**Status**: Accepted  
**Date**: 2026-06-22

**Context**: Need a unified, comprehensive indicator summarizing visibility readiness, competitive context, and active opportunities to represent growth posture.
**Decision**: Calculate an overall Growth Score using weights:
- SEO Visibility: 25%
- AEO Readiness: 20%
- GEO Citations: 20%
- Competitor Position: 15% (Dynamic deduction based on rival threat levels)
- Opportunity Capture: 20% (Ratio of completed and in-progress opportunities)

---

## ADR-008: Dynamic Executive CEO briefings
**Status**: Accepted  
**Date**: 2026-06-22

**Context**: Standard scoreboards overload users with numbers without stating strategic impact.
**Decision**: Leverage Gemini to compile a morning executive summary (markdown text + JSON highlights) focusing on dynamic gains, at-risk revenue, biggest competitor threats, and the single top recommended action.
