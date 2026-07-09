# Frontend is a React + Vite SPA in TypeScript

The Fundora frontend is a client-rendered single-page app built with React, Vite, and
TypeScript, talking to the separate Django/DRF backend over JSON.

## Product context (so the rationale is honest)

Fundora is a **multi-tenant, end-user-facing web app**: anyone can self-register, create
funds, and manage the funds they own, seeing only their own data (tenancy is enforced by
the backend — a user only ever sees funds they created). It is not a single-operator
internal tool. We call it an "admin panel" only in the sense that each user administers
*their own* funds; there is no separate member-facing site yet, but that is a future
addition, not evidence that this app is internal.

## Why an SPA over a meta-framework (Next.js)

Even though the app is public and end-user-facing, essentially **all of its substance lives
behind authentication** — funds, members, wallets, loans, reports are per-user private data
that must never be indexed by search engines. The classic reasons to reach for SSR/SSG —
SEO and fast first paint of *public content* — simply don't apply to an authenticated
data-management app. The only unauthenticated pages are the register and login **forms**,
which are tiny and need neither SEO nor server rendering.

Against that, an SPA is the simpler fit:

- **Client-side JWT handling is cleaner.** We hold the access token in memory and refresh it
  from an httpOnly cookie (ADR 0002); threading that through a server-rendering layer adds
  moving parts for no benefit here.
- **No dead weight.** SSR infrastructure, a server runtime, and hydration complexity would be
  cost without a payoff, since there's no public content to render on the server.
- **If a marketing/landing site is ever needed** (for SEO or first-impression speed), it can
  be a **separate static site** decoupled from this app — the app itself stays a pure SPA.

## Why React and TypeScript

React (over Vue) wins on ecosystem depth for this app's two hardest parts — a mature Jalali
date picker and a robust server-state library. TypeScript is mandatory against an API with a
typed OpenAPI schema and a fixed set of machine-readable error codes (ADR 0005): backend
changes surface as compile errors instead of runtime surprises.

## Notes

- Supersedes the earlier framing of this app as a "single-operator internal tool with no
  public surface," which mismatched the backend's public self-registration and per-creator
  multi-tenancy. The **decision** (React + Vite SPA + TS) is unchanged; only the rationale is
  corrected.
