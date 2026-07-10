# Fundora Frontend — Project Guide

Persian, RTL, **end-user-facing** web app for the Fundora family-loan-fund backend:
**anyone can self-register**, create funds, and manage the funds they own. It's multi-tenant
— each user is the owner/administrator of their own funds and sees only those (tenancy is
enforced backend-side). We call it an "admin panel" because a user administers their own
funds and there is **no separate member-facing site yet**, but it is a public, client-side
product, not a single-operator internal tool. This is a **greenfield frontend**; the backend
is a separate, already-built Django/DRF API.

## Read these first
- `PRD.md` — product requirements (the backend's domain).
- `FRONTEND_API.md` — every endpoint, schema, and error code the frontend consumes.
- `CONTEXT.md` — domain glossary (Fund, Member, Due, Wallet, Settlement, Toman, Jalali).
- `docs/adr/` — the locked architectural decisions and *why* (read these before proposing
  changes to the stack or approach).

## Current status (update this as it changes)
- **Design is done; no frontend app code written yet.** We ran a full design/grilling
  session and recorded the decisions in `docs/adr/` (0001–0006).
- **Backend cookie auth is DONE and pushed.** The httpOnly-cookie login/refresh/logout
  endpoints (ADR 0002) are implemented in the `fundora` backend repo; `FRONTEND_API.md`
  here reflects the live contract. No longer blocked.
- **Next up: build the *walking skeleton*** — one thin end-to-end flow: log in → funds
  list → open/create a fund → add a member → record a bank transfer → wallet balance
  updates. Build this before any breadth.
- **The phased build plan is in `docs/ROADMAP.md`** — numbered, testable phases (0–6 are
  the walking skeleton, 7+ fan out). Follow it top-to-bottom and tick the checkboxes.
  Phases 0–4 done (scaffold/RTL, auth+network, routing + shell + login/register, funds
  list + create, fund scope in URL). **Phase 5 (members: list + add, fund sub-nav)
  code-complete, pending browser click-test; Phase 6 (bank transfer → wallet, closes the
  walking skeleton) is next.**

## Locked decisions (details in docs/adr/)
- **Stack:** React + Vite SPA + TypeScript. (0001)
- **Auth:** refresh token in an httpOnly cookie, access token in memory (bearer header);
  silent refresh on 401 with a request queue. Implemented in the backend; call auth
  endpoints with credentials included. (0002)
- **Locale:** Persian-only, RTL, no i18n runtime; strings centralized. (0003)
- **Dates:** Jalali only at the UI edge; all state/API is Gregorian/UTC. `dayjs` + a
  Persian-calendar plugin, wired into Ant Design's date components. (0004)
- **Digits:** English/numeric fields (phone, Toman amounts, card numbers, tracking codes)
  normalize Persian/Arabic digits → ASCII at the input edge via `normalizeDigits`
  (`src/lib/digits.ts`); never on passwords/names. (0007)
- **API types:** generated from `/api/schema/` via `openapi-typescript`; the axios
  client, auth flow, error handling, and TanStack Query hooks are hand-written. (0005)
- **Fund scoping:** the active fund lives in the URL (`/funds/:fundId/...`). (0006)
- **UI kit:** Ant Design (batteries-included admin components, first-class RTL).
- **Also decided (low-level):** React Router; React Context for non-server UI state; Ant
  Design forms + Zod validation; folder structure grouped by domain area
  (`funds/`, `members/`, `wallet/`, `loans/`, `bank/`); axios; TanStack Query for server
  state; Vite dev-server proxy for `/api` (keeps dev same-origin, no CORS).

## How to work with this user
- The user is a **backend developer** new to frontend — explain frontend choices in
  backend terms (Django admin, ORMs, migrations, urls.py analogies), avoid unexplained
  jargon, and give a clear recommendation.
- When offering choices, present them as **organized pros/cons** so they can compare.

## Build approach
- Walking-skeleton first (thin end-to-end slice), then fan out into full Setup →
  Money-loop → Loans → Reporting screens. Excel import is deferred (format not finalized).
- Keep decisions and glossary current: add an ADR for hard/surprising trade-offs, update
  `CONTEXT.md` when domain terms are sharpened.
