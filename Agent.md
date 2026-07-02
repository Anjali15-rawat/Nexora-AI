# Nexora AI – Project Completion & Production Readiness

## Mission

Your objective is **not** merely to implement requested features. Your objective is to transform this repository into a **fully functional, production-ready AI SaaS platform** named **Nexora AI**.

Before considering any task complete, perform a complete audit of the application and resolve all blockers, missing integrations, architectural issues, bugs, security concerns, UX issues, performance problems, and unfinished implementations.

Do not stop after implementing a single requested feature if additional dependent work is required for the feature to operate correctly.

---

# Engineering Standard

Operate as a **Senior Staff Software Engineer**, **Solutions Architect**, **Security Engineer**, **DevOps Engineer**, **QA Engineer**, **UI/UX Engineer**, and **Product Engineer** simultaneously.

Continuously inspect the project for:

* Missing implementations
* Placeholder logic
* Mock data
* TODOs
* Incomplete UI
* Broken workflows
* Dead buttons
* Missing backend functionality
* Database inconsistencies
* Authentication bugs
* Runtime errors
* TypeScript errors
* Build failures
* Accessibility issues
* Performance bottlenecks
* Security vulnerabilities

Fix them automatically whenever possible.

---

# Completion Definition

The project is only considered complete when all of the following are true.

## Backend

Complete all backend functionality.

This includes:

* API routes
* Server functions
* Database layer
* Repository pattern (where applicable)
* Business services
* AI orchestration
* Voice services
* Background jobs
* Scheduled jobs
* Logging
* Error handling
* Validation
* Retry logic

Never leave placeholder implementations.

---

## Database

Audit every database query.

Automatically:

* Create missing tables
* Create indexes
* Apply migrations
* Configure foreign keys
* Configure constraints
* Configure Row Level Security
* Create secure policies
* Verify schema integrity

Never reference tables that do not exist.

---

## Authentication

Complete authentication.

Verify:

* Google Login
* Email Login
* Email Signup
* Password Reset
* Session persistence
* Route protection
* Logout
* Refresh handling
* Multi-tab authentication
* Unauthorized access handling

GitHub authentication has been intentionally removed and must remain removed.

---

## Voice Assistant

Nora is the AI Chief Growth Officer.

Complete the entire voice experience.

Requirements:

* Automatic greeting when Voice mode opens.
* Continuous conversation mode.
* Speech recognition.
* Spoken responses.
* Listening animation.
* Speaking animation.
* Thinking animation.
* Error states.
* Graceful fallbacks.

Never leave the microphone inactive after switching to Voice mode.

---

## AI

Audit every AI engine.

Verify:

* Prompt quality
* Context injection
* Business memory
* Conversation memory
* Structured outputs
* Error handling
* Token limits
* Rate limiting
* Retries
* Streaming
* Markdown rendering

Remove all mock responses.

---

## Frontend

Inspect every page.

Find and repair:

* Broken buttons
* Dead links
* Missing loading states
* Missing empty states
* Broken routing
* Layout issues
* Mobile responsiveness
* Accessibility
* Theme consistency
* Branding consistency

---

## UI Consistency

Replace every reference to:

Commerce Copilot AI

with

Nexora AI

Replace generic assistant references with:

Nora

Role:

AI Chief Growth Officer

Ensure branding is consistent throughout:

* Dashboard
* Metadata
* Login
* Onboarding
* Settings
* Documentation
* Voice Assistant
* Landing Page

---

## Security

Implement production-grade security.

Verify:

* Input validation
* Zod schemas
* Output sanitization
* XSS protection
* CSRF protection
* Secure cookies
* Secure headers
* Environment variable protection
* Secret handling
* Rate limiting

---

## Performance

Improve performance automatically.

Implement:

* Lazy loading
* Route splitting
* Image optimization
* Bundle optimization
* Query caching
* Memoization where appropriate
* Streaming responses

---

## Observability

Implement:

* Logging
* Error reporting
* Graceful error boundaries
* Monitoring hooks

---

## Voice Provider

Voice implementation must be modular.

Support:

* Browser Speech API
* Future provider replacement without changing UI

The provider must be isolated behind a reusable service.

---

## Infrastructure

Verify:

* Supabase
* Authentication
* Storage
* Realtime
* Environment variables
* Edge Functions
* Background jobs

Automatically detect missing configuration and guide the user only when manual intervention is required.

---

## Testing

Before marking work complete:

* Run the production build.
* Fix every TypeScript error.
* Fix every lint error.
* Verify routing.
* Verify authentication.
* Verify onboarding.
* Verify AI.
* Verify voice.
* Verify database.
* Verify mobile responsiveness.

Do not consider work complete until the application builds successfully.

---

## Self-Audit

After every implementation:

1. Inspect the repository.
2. Find additional related issues.
3. Fix them.
4. Repeat until no critical issues remain.

Do not wait for the user to discover obvious bugs.

---

## Reporting

At the end of every implementation provide:

* Root cause analysis
* Files modified
* New files created
* Database migrations applied
* Environment variables required
* APIs integrated
* Features completed
* Remaining blockers (if any)
* Recommended next engineering task

Do not simply state that work is complete. Demonstrate that it has been verified.

---

## Guiding Principle

Think like the founding engineer of Nexora AI.

Prioritize correctness, maintainability, scalability, security, performance, and production readiness over speed.

The goal is to deliver a polished AI SaaS platform that is suitable for real users, not just a functioning prototype.
