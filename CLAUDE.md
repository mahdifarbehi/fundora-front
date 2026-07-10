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

**The phased build plan is `docs/ROADMAP.md`** — numbered, testable phases with checkboxes.
It is the source of truth for progress; this section is the short summary.

- **Done & pushed:** Phases 0–6 (the walking skeleton: log in → fund → member → record
  bank transfer → wallet balance updates, verified end-to-end against the real backend),
  **plus** the Jalali date layer (Phase 8 — `JalaliDateTimeInput`) and the bank-transactions
  **list** (part of Phase 9), both brought forward.
- **Backend changes made this project (repo `../fundora`, pushed):** `Member` serializer
  returns `user_phone`/`user_full_name`; card-conflict returns `400 CARD_ALREADY_REGISTERED`
  atomically; the duplicate `FRONTEND_API.md` was removed (this repo's copy is canonical).
- **Pending user browser click-tests:** the `- [ ] (your click-test)` boxes in `ROADMAP.md`
  for Phases 2–6. Code is verified (typecheck + module transforms + backend contract via
  curl); only the in-browser confirmation is outstanding.
- **Next to build (fan-out, your pick):** Phase 7 (error/loading/session-expiry polish),
  Phase 9 remainder (**unmatched queue + manual assign/rematch** — the orange "بدون تطبیق"
  rows), Phase 10 (wallet detail: adjustments + settle), Phase 11 (loans), Phase 12 (reports).
  Recommended default if unsure: **Phase 9 remainder** (we just built the bank list).

### Resuming a session (if the user just says "continue")
1. Read `docs/ROADMAP.md` — the checkboxes show exactly what's done vs. next.
2. Read the status above for the recommended next phase.
3. Follow the **per-part completion protocol** in "How to work with this user" below.
4. The backend runs at `http://localhost:8000`; a throwaway login is `09129999999` /
   `phase1-test-pw-9` (owns fund **6**, which has members سارا/رضا + two bank transactions).

## Locked decisions (details in docs/adr/)
- **Stack:** React + Vite SPA + TypeScript. (0001)
- **Auth:** refresh token in an httpOnly cookie, access token in memory (bearer header);
  silent refresh on 401 with a request queue. Implemented in the backend; call auth
  endpoints with credentials included. (0002)
- **Locale:** Persian-only, RTL, no i18n runtime; strings centralized. (0003)
- **Dates:** Jalali only at the UI edge; all state/API is Gregorian/UTC. Conversion in
  `src/lib/jalali.ts` — `Intl` Persian calendar (display) + `jalaali-js` (input); date entry
  via the plain `JalaliDateTimeInput` (not an Ant calendar popup). (0004)
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
- **Never commit or push without explicit approval.** (Backend repo `../fundora` too.)

### Per-part completion protocol (agreed workflow)
When a part/phase is code-complete, do this every time:
1. Verify what you can yourself (typecheck `npx tsc -b`, module transforms, and the backend
   contract via curl against `localhost:8000`).
2. **Tell the user the exact, numbered steps to test in the browser** — clicks, inputs,
   expected results — and **explicitly say what is deferred to later phases**.
3. **Do NOT tick the ROADMAP "(your click-test)" boxes yet.** Wait for the user to test.
4. Only **after the user says it's fine** ("there is no problem"/similar), update
   `docs/ROADMAP.md` (check the boxes) and the status above — yourself.
5. Commit/push only when the user asks.

## Build approach
- Walking-skeleton first (thin end-to-end slice), then fan out into full Setup →
  Money-loop → Loans → Reporting screens. Excel import is deferred (format not finalized).
- Keep decisions and glossary current: add an ADR for hard/surprising trade-offs, update
  `CONTEXT.md` when domain terms are sharpened.
