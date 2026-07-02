# Commerce Copilot AI — Technical Debt Register

> Last updated: 2026-06-22T23:50:00+05:30

## Critical (Must fix before Phase 5)

| ID | Category | Description | Impact | Effort |
|----|----------|-------------|--------|--------|
| TD-001 | Security | Login form bypasses auth — `<Link to="/overview">` instead of real auth | Anyone can access dashboard | Low |
| TD-002 | Security | No CSRF protection on forms | Vulnerable to cross-site attacks | Low |
| TD-003 | Security | No input validation/sanitization anywhere | XSS/injection risk | Medium |
| TD-004 | Architecture | All data hardcoded in `mock-data.ts` | **Resolved** for Overview, Competitors, and Opportunities pages. Remaining charts need data flow updates. | High |
| TD-005 | Architecture | No error boundaries on data-dependent pages | Crashes propagate | Low |

## High (Should fix in Phase 5)

| ID | Category | Description | Impact | Effort |
|----|----------|-------------|--------|--------|
| TD-006 | Performance | No code splitting — all routes in single bundle | Slow initial load | Medium |
| TD-007 | UX | Search bar in header is non-functional | Broken UX expectation | Medium |
| TD-008 | UX | Notification bell has no functionality | Dead UI element | Low |
| TD-009 | UX | "Free plan" sidebar widget is static | Misleading state | Low |
| TD-010 | UX | "Watch demo" button on landing page does nothing | Broken CTA | Low |
| TD-011 | Maintainability | No TypeScript strict null checks on component props | Runtime errors | Medium |
| TD-012 | Architecture | `@lovable.dev/vite-tanstack-config` is a black box | Hard to customize build | Low |

## Medium

| ID | Category | Description | Impact | Effort |
|----|----------|-------------|--------|--------|
| TD-013 | UX | Light mode defined in CSS but no toggle mechanism | Incomplete feature | Low |
| TD-014 | Performance | Google Fonts loaded synchronously | Render blocking | Low |
| TD-015 | SEO | Root `<title>` says "Lovable App" | Poor branding | Trivial |
| TD-016 | SEO | OG meta tags reference "Lovable" | Wrong brand attribution | Trivial |
| TD-017 | Accessibility | No skip-to-content link | A11y gap | Trivial |
| TD-018 | Accessibility | Sidebar nav items lack `aria-current` | Screen reader gap | Trivial |
