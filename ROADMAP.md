# Commerce Copilot AI — Product Roadmap

> Last updated: 2026-06-22T23:50:00+05:30

## Phase 1: Foundation Layer ✅ Complete
**Goal**: Real auth, real database, real user sessions

- [x] Provision Supabase project
- [x] Create PostgreSQL schema with RLS
- [x] Implement Supabase Auth (sign up, sign in, sign out, forgot password)
- [x] Add auth guard to `_app` routes
- [x] Wire user info into AppShell
- [x] Fix TD-001, TD-015, TD-016 (security + branding)

---

## Phase 2: Business Understanding Engine ✅ Complete
**Goal**: AI-powered business profile generation from a URL

- [x] Implement Gemini API wrapper with rate limiting
- [x] Build lightweight page crawler
- [x] Create Business Understanding Engine
- [x] Build onboarding wizard (URL → AI analysis → profile review → competitor setup)
- [x] Store business profile in database
- [x] Wire Settings page to real business profile

---

## Phase 3: Intelligence Engines (SEO/AEO/GEO) ✅ Complete
**Goal**: Replace mock scores with real analysis

- [x] Build SEO analysis engine (crawl + Gemini scoring)
- [x] Build AEO analysis engine
- [x] Build GEO analysis engine
- [x] Wire Overview page to real scores
- [x] Add loading states and error handling
- [x] Fix TD-004 partially (remove SEO mock data)

---

## Phase 4: Competitor + Opportunity + Revenue Impact + Executive Briefing ✅ Complete
**Goal**: Real competitive intelligence, opportunity discovery, revenue impact calculators, dynamic Growth Scores, and Executive CEO briefings.

- [x] Build Competitor Discovery Engine (`competitor-discovery.server.ts`)
- [x] Build Opportunity Engine (`opportunity-engine.server.ts`)
- [x] Build Revenue Impact Engine (`revenue-impact.server.ts`)
- [x] Build Growth Score Engine (`growth-score.server.ts`)
- [x] Build Executive Briefing Engine (`executive-briefing.server.ts`)
- [x] Prepare Voice Agent Architecture (`voice-agent.server.ts`)
- [x] Wire Overview dashboard, Competitors dashboard, and Opportunities dashboard pages to live endpoints

---

## Phase 5: AI Assistant + Reports ✅ Complete
**Goal**: Conversational AI grounded in business data

- [x] Build AI Assistant engine with conversation context
- [x] Build Executive Briefing Engine updates for historical periods
- [x] Replace canned chat responses with Gemini
- [ ] Add response streaming
- [x] Wire Reports page to generated reports
- [x] Add Web Speech API to Voice Assistant
- [x] Wire Revenue Impact to real opportunity data

---

## Phase 6: Automation + Polish ✅ Complete
**Goal**: Autonomous intelligence updates

- [x] Implement scheduled SEO re-scans (daily)
- [x] Implement scheduled competitor snapshots (daily)
- [x] Implement daily brief generation
- [x] Build Trend Radar engine
- [x] Wire Trends page to real data
- [ ] Implement theme toggle (dark/light)
- [ ] Wire notification bell to real alerts
- [x] Performance audit and optimization
