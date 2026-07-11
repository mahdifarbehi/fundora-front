# Fundora Frontend — Build Roadmap

An ordered, testable build plan. Work **one phase at a time, top to bottom**. Do not start
a phase until the previous one's "Done when" boxes are all ticked — each phase assumes the
previous one works.

Think of this like the backend's `migrations/`: numbered, sequential, each one small enough
to apply and verify on its own before the next.

## How to use this document

- **Follow phases in order.** Phases 0–6 are the **walking skeleton** (the thin end-to-end
  slice from `CLAUDE.md`: log in → funds → open/create a fund → add a member → record a
  bank transfer → wallet updates). Build all of them before the fan-out phases (7+).
- **Tick the boxes** as you go (`- [ ]` → `- [x]`). The "Done when" list is the acceptance
  test for the phase — if every box is true, the phase is genuinely finished.
- **"How to verify"** is a concrete manual test you run yourself, mostly in the browser +
  its Network tab (your equivalent of hitting an endpoint with `curl`/Postman and reading
  the response). Where an automated test earns its keep, it's called out.
- **The backend must be running locally** from Phase 1 onward. Every data phase is tested
  against the real API through the Vite dev proxy — there are no mocks in this plan.
- Each phase names the **ADR(s)** it implements so you can check the *why* while you build.

### Prerequisite: a running backend

Before Phase 1, have the `fundora` Django backend running locally (default assumed:
`http://localhost:8000`) with at least one account you can log in as. Confirm you can reach
`http://localhost:8000/api/docs/` (Swagger UI) in a browser. If your backend runs on a
different port, note it — you'll point the Vite proxy at it in Phase 0.

---

## Phase 0 — Project scaffold + RTL shell

**Goal:** an empty but correctly-configured app that boots, renders right-to-left in
Persian, and proxies `/api` to the backend. No data yet.

**Implements:** ADR 0001 (React+Vite+TS SPA), 0003 (Persian/RTL), and the dev-proxy decision.

**Build:**
- [x] Vite React + TypeScript scaffold (built manually to avoid clobbering existing
      `docs/`, `CLAUDE.md`, etc.). `npm run dev` serves a page.
- [x] Add Ant Design; wrap the app in `ConfigProvider` with `direction="rtl"` and the
      Persian (`fa_IR`) locale. (`src/main.tsx`)
- [x] Set `<html dir="rtl" lang="fa">` in `index.html`.
- [x] Configure the Vite dev-server proxy: forward `/api` → backend origin
      (`http://localhost:8000`, overridable via `FUNDORA_API`) in `vite.config.ts`. This is
      what makes the browser see one origin (required for the auth cookie — ADR 0002).
- [x] Create the domain-grouped folder skeleton under `src/`: `auth/`, `funds/`, `members/`,
      `wallet/`, `loans/`, `bank/`, plus shared `lib/` and `app/`.
- [x] Add `src/lib/strings.ts` as the single home for user-facing Persian strings
      (ADR 0003 — centralized, no i18n runtime).

**How to verify:**
- Run `npm run dev`, open the page: text renders and lays out **right-to-left**, an Ant
  Design component (e.g. a `Button`) shows in Persian styling.
- In the browser Network tab, a request to `/api/docs/` (type it in the address bar as
  `http://localhost:5173/api/docs/`) returns the backend's Swagger UI — proving the proxy
  forwards to Django on one origin. *(Requires the backend running; with it down the proxy
  returns 502 `ECONNREFUSED`, which still confirms the proxy rule is active.)*

**Done when:**
- [x] `npm run dev` boots with no console errors. *(verified: Vite 8 boots clean)*
- [x] Page is visibly RTL and in Persian. *(`<html lang="fa" dir="rtl">` served; RTL
      `ConfigProvider` + `fa_IR` locale wired)*
- [x] A request to `/api/...` through the dev server reaches the backend (not a 404 from
      Vite). *(verified: `/api/schema/` → 502 to backend, i.e. proxy forwards; will be 200
      once the backend is up)*
- [x] `npx tsc -b` typechecks clean.

---

## Phase 1 — API types + axios client + auth flow

**Goal:** the network layer. Generated types, one axios instance, in-memory access token,
silent refresh-on-401 with a request queue, and login/logout/refresh working against the
real backend. **This is the hardest phase — take it slowly.**

**Implements:** ADR 0002 (in-memory access token, httpOnly refresh cookie, silent refresh
+ queue), 0005 (generated types, hand-written client).

**Build:**
- [x] Add `openapi-typescript`; `npm run gen:api` reads `/api/schema/` → `src/lib/api-types.ts`
      (committed). Re-run after backend schema changes — the frontend analogue of migrations.
      *(Note: pinned TypeScript to 5.x — openapi-typescript & the frontend tool ecosystem
      don't yet support the TS 7 compiler npm auto-installed.)*
- [x] `src/lib/client.ts`: axios instance, `baseURL "/api"`, `withCredentials: true`.
- [x] In-memory access-token holder (`src/lib/authToken.ts`, a module variable — not
      localStorage, ADR 0002); request interceptor attaches `Authorization: Bearer`.
- [x] Response interceptor: on `401`, refresh (empty body, credentials) + retry, with a
      **single-flight queue** so concurrent 401s trigger one refresh; on refresh failure,
      clear token + `notifySessionExpired()`. `/auth/token|refresh|logout|register` are
      excluded from refresh-retry.
- [x] Typed auth functions (`src/auth/api.ts`): `login`, `logout`, `getMe`,
      `bootstrapSession` (app-load refresh).
- [x] Central error helper (`src/lib/errors.ts`): `ApiError` + `normalizeError` reading the
      `code` field (FRONTEND_API §2).

**How to verify** — *temporary harness is live in `src/app/App.tsx`; run `npm run dev`:*
- Log in with **your** credentials → Network tab shows `200` + `access` + `Set-Cookie:
  refresh_token`; the log line confirms the token is in memory.
- Click **Get Me** → returns your user (Bearer header present).
- Click **Force silent refresh** (corrupts the token, fires 3 concurrent calls) → the
  Network tab shows exactly **one** `token/refresh/`, and 3/3 calls succeed.
- Click **Logout** → `205`; a following refresh/Get-Me fails as logged-out.

**Done when:**
- [x] `src/lib/api-types.ts` is generated and imported (compiles; `tsc -b` clean).
- [x] Backend auth contract verified end-to-end via cookie-jar (register→login→me→refresh→
      logout→refresh-blocked all return the documented codes/statuses).
- [x] Error codes confirmed: `NO_ACTIVE_ACCOUNT`, `NOT_AUTHENTICATED`, `TOKEN_NOT_VALID`.
- [x] **(your click-test)** Browser login stores the token & authed calls succeed.
- [x] **(your click-test)** Force-refresh shows ONE `token/refresh/` for 3 concurrent 401s.
- [x] **(your click-test)** Logout blocks further refresh.

> Throwaway test user created in the dev DB during verification: **id 8, phone
> `09129999999`** (the API has no user-delete; remove via Django admin/shell if you want).

---

## Phase 2 — Routing, auth guard, app shell

**Goal:** public **register + login** screens and a protected layout. Anyone can
self-register (the app is multi-tenant, end-user-facing — see ADR 0001); unauthenticated
users are bounced to login; authenticated users see the app frame (header with account +
logout). No fund data yet.

**Implements:** ADR 0002 (app-load refresh), 0006 (routes for non-fund vs fund-scoped
screens), React Router + React Context decisions.

**Build:**
- [x] React Router (v7): `/login` public; protected tree under `RequireAuth` → `AppShell`.
      (`src/app/App.tsx`, `main.tsx` wraps `BrowserRouter` + `AuthProvider`.)
- [x] Auth `Context` (`src/auth/AuthContext.tsx`) holding `{status, user}` + `signIn`/`signOut`
      — session state in Context, not TanStack Query (locked decision).
- [x] App-load silent refresh: `bootstrapSession()` on mount → `getMe()`; `loading` state
      shows a spinner so a valid session never flashes `/login`. Also wires
      `setOnSessionExpired` → flip to anon.
- [x] Login page (`src/auth/LoginPage.tsx`): Ant `Form` + **Zod** submit validation
      (`src/lib/zodForm.ts` bridge), phone regex `^09\d{9}$`, maps API `code` →
      Persian via `errorMessage()`.
- [x] Public **register page** (`src/auth/RegisterPage.tsx`): self-registration (§4.1),
      Zod (min-8 password), auto-signs-in on success; per-field API errors
      (`already_registered`, `password_too_*`) map inline via `applyApiFieldErrors()`.
      Cross-links with login.
- [x] App shell (`src/app/AppShell.tsx`): Ant `Layout` header with app name, user, logout;
      `<Outlet/>` content. Placeholder `HomePage` (→ funds list in Phase 3).
- [x] Route guard (`src/app/RequireAuth.tsx`): loading→spinner, anon→`/login` (remembers
      intended path via `location.state.from`), authed→`<Outlet/>`.

**How to verify** (run against your `npm run dev`):
- From `/login`, click "ثبت‌نام" → `/register`; sign up with a fresh phone + 8+ char
  password → you're auto-logged-in and land in the shell. Re-registering the same phone →
  inline "این شماره قبلاً ثبت شده است" under the phone field.
- Visit a protected URL logged out → redirected to `/login`.
- Log in with valid credentials → land in the app shell showing your name.
- Reload the page → you stay logged in (app-load refresh worked), no flash back to login.
- Click logout → returned to `/login`; the back button doesn't sneak you back in.
- Type a bad phone (e.g. `123`) or empty password → Zod shows an inline Persian error
  before any request; wrong credentials → `NO_ACTIVE_ACCOUNT` shown in Persian.

**Done when:**
- [x] Code complete; `tsc -b` clean and all modules transform without errors.
- [ ] **(your click-test)** Logged-out users cannot reach protected routes.
- [ ] **(your click-test)** Login → shell → reload-stays-logged-in → logout all work.
- [ ] **(your click-test)** Zod validation errors and server `code` errors both show in Persian.

---

## Phase 3 — Funds list + create fund

**Goal:** first real server-state screen. List the funds you own and create a new one.
This introduces the TanStack Query + Toman-formatting patterns every later list reuses.

**Implements:** ADR 0005 (hand-written Query hooks over generated types), FRONTEND_API §5.

**Build:**
- [x] TanStack Query (`src/lib/queryClient.ts`); app wrapped in `QueryClientProvider`
      (`main.tsx`), retry 1, no refetch-on-focus.
- [x] Pagination helper (`src/lib/pagination.ts`): generic `Paginated<T>` + `PageParams`
      for the `{count,next,previous,results}` envelope — reused by every later list.
- [x] `src/lib/money.ts`: `formatToman` / `formatNumber` via `Intl.NumberFormat('fa-IR')`
      (grouping + Persian numerals). Display-only; wire carries raw integers.
- [x] `useFunds()` (`src/funds/hooks.ts`) → `GET /api/funds/`; `FundsPage` renders `results`
      in an Ant `Table` (name, monthly share as Toman, contribution day) with loading + empty
      states.
- [x] `CreateFundModal`: Ant `Form` + Zod (coerced integers; `contribution_day` 1–28);
      numeric fields use `normalize={normalizeDigits}` (ADR 0007). `useCreateFund()` →
      `POST /api/funds/`; invalidates `['funds']` on success; API field errors
      (e.g. `contribution_day: ["max_value"]`) render inline.
- [x] `/` now routes to `FundsPage` (placeholder `HomePage` removed).
- [x] Currency inputs use `MoneyInput` (`src/components/MoneyInput.tsx`): live thousands
      grouping + Persian numerals while typing, emits a raw ASCII integer to the form/API.
      Standard for all money fields going forward.
- [x] `contribution_day` is a Gregorian day 1–28 shown as a `Select` (Persian labels), with:
      an explicit note that it's Gregorian, a recommended day (defaults in) that lands near
      the Jalali month start, and a live readout of the Jalali days the pick falls on +
      a wrap warning. Uses `src/lib/jalali.ts` (browser Persian calendar; display-only, ADR 0004).

**How to verify:**
- Funds list loads and shows funds you own (cross-check against Swagger UI / the DB).
- Create a fund → it appears in the list without a manual page refresh (cache invalidation).
- Money columns show grouped Persian numerals, but the request body sends a raw integer
  (check the Network tab payload).
- Submit `contribution_day = 40` → blocked by Zod / shows `contribution_day: ["max_value"]`.

**Done when:**
- [x] Code complete; `tsc -b` clean, all modules transform, backend contract verified
      (empty envelope → create `201` → list shows it → `contribution_day=40` → `400`
      `VALIDATION_ERROR{contribution_day:[max_value]}`).
- [ ] **(your click-test)** Funds you own are listed via the pagination envelope.
- [ ] **(your click-test)** Creating a fund updates the list automatically.
- [ ] **(your click-test)** Toman shows grouped Persian numerals; payload carries integers.

---

## Phase 4 — Fund scope in the URL

**Goal:** open a fund and enter its scoped section. The fund id lives in the route; a header
switcher changes funds by navigating. This is the frame all member/wallet/loan screens hang on.

**Implements:** ADR 0006 (active fund in the URL, no global "current fund").

**Build:**
- [x] Nested route `/funds/:fundId` → `FundOverviewPage`, under the app shell (`App.tsx`).
      More sections mount under here in later phases.
- [x] Clicking a fund row in `FundsPage` navigates to `/funds/:fundId` (`onRow` click).
- [x] `src/funds/fundScope.ts`: `useFundId()` (asserts, for scoped pages) and
      `useCurrentFundScope()` (fundId + sub-path, for the header) — the URL is the single
      source of truth (ADR 0006).
- [x] Header `FundSwitcher` (Ant `Select` of your funds) navigates to the same sub-path
      under a different `:fundId`.
- [x] `FundOverviewPage`: `useFund(fundId)` → `GET /api/funds/{id}/`, settings in a
      `Descriptions` (Toman amounts, contribution day + Jalali landing days, created date
      in Jalali), clean `404` not-found state.
- [x] Hardened `normalizeError`: falls back to a status-derived code (404→NOT_FOUND, …)
      when the body has no `code` — the live 404 returns `{"detail":…}`, not the documented
      `{"code":"NOT_FOUND"}`.

**How to verify:**
- Click a fund → URL becomes `/funds/<id>` and shows that fund's settings.
- Change the fund in the header dropdown → URL id changes and content updates.
- Paste a `/funds/<id>` URL into a new tab → it deep-links straight to that fund (bookmarkable).
- Visit `/funds/<id-you-don't-own>` → handled as `404 NOT_FOUND` (not a crash), per tenant
  isolation (FRONTEND_API §2.3).

**Done when:**
- [x] Code complete; `tsc -b` clean, modules transform; backend contract verified
      (owned fund → `200`; not-yours → `404`).
- [ ] **(your click-test)** Fund id comes only from the URL; switcher + deep-links work.
- [ ] **(your click-test)** Back/forward behave correctly.
- [ ] **(your click-test)** A not-yours fund id shows a clean "not found," not a crash.

---

## Phase 5 — Members: list + add

**Goal:** inside a fund, list members and add one by phone. Exercises nested-under-fund
create and a domain error code.

**Implements:** FRONTEND_API §6.1–6.2.

**Build:**
- [x] `useMembers(fundId)` → `GET /api/funds/{fundId}/members/` (paginated); `MembersPage`
      table under `/funds/:fundId/members` with loading + empty states.
- [x] `AddMemberModal` + Zod: `phone` (regex, digit-normalized), `share_count` (≥1, Persian
      `NumberInput`), optional `full_name`, optional `cards` (tag input, normalized to ASCII).
      `useAddMember()` → `POST /api/funds/{fundId}/members/`; invalidates the members query.
- [x] Handles `400 MEMBER_ALREADY_EXISTS` (Persian message on the phone field) and
      `VALIDATION_ERROR` field codes (`share_count: ["min_value"]` inline).
- [x] `FundLayout` sub-nav (مشخصات / اعضا) hosts the fund sections; `AddMemberInput` is
      hand-written because the generated schema wrongly reuses the read-only `Member` model.

**How to verify:**
- Add a member → appears in the list without manual refresh.
- Add the **same** phone again → `MEMBER_ALREADY_EXISTS` shown as a readable Persian message,
  not a raw error.
- Submit `share_count = 0` → blocked with `share_count: ["min_value"]`.

**Done when:**
- [x] Code complete; `tsc -b` clean, modules transform; backend contract verified (add →
      `201`; duplicate → `MEMBER_ALREADY_EXISTS`; `share_count=0` → `VALIDATION_ERROR`).
- [ ] **(your click-test)** Members list loads for the active fund; add updates it live.
- [ ] **(your click-test)** Duplicate + validation errors render in Persian.

> **API limitation — RESOLVED:** the members list originally returned only the `user` id
> (no name/phone). The backend `MemberSerializer` now includes read-only `user_phone` /
> `user_full_name` (fundora repo, `members/serializers.py`); types were regenerated and the
> roster shows real name + phone. The duplicate `FRONTEND_API.md` in the backend repo was
> deleted — this frontend copy is now the single source of truth.

---

## Phase 6 — Bank transfer → wallet updates (skeleton closes)

**Goal:** record an incoming bank transfer and watch the matched member's wallet balance
change via auto-settlement. This **completes the walking skeleton.**

**Implements:** FRONTEND_API §9.2, §6.5, §12 (settlement is automatic; refetch after).
Introduces the first date **input** — pull in the Jalali layer here (see note below).

> **Jalali note:** `transfer_datetime` is the first place the user enters a date, so this
> phase is where the Jalali date layer (Phase 8) first pays off. You may either do a minimal
> version of Phase 8 now (a single wired-up Jalali datetime picker) or temporarily use a plain
> input and backfill Phase 8 — your call. Either way, what goes on the wire is Gregorian/UTC
> (ADR 0004).

**Build:**
- [x] "Record transfer" form (`bank/RecordTransferModal.tsx`): `amount` (`MoneyInput`),
      `transfer_datetime`, `from_card`/`tracking_code` (digit-normalized), `note`.
      `usePostBankTransaction(fundId)` → `POST /api/funds/{fundId}/bank-transactions/`.
- [x] `BankPage` (`/funds/:fundId/bank`) with the record button + a result banner showing
      whether it matched/charged, linking to the matched member's wallet.
- [x] `MemberWalletPage` (`/funds/:fundId/members/:memberId/wallet`): `useWallet(memberId)`
      → balance (`Statistic`) + ledger table (amount ±, Persian type, Jalali date). Reached
      by clicking a member row.
- [x] `usePostBankTransaction` invalidates the bank list **and** the matched member's wallet
      on success, so the balance/settlement refetches (FRONTEND_API §12).
- [x] Result banner shows `wallet_charged` (matched) vs unmatched.
- [x] Wallet ledger types hand-written (`wallets/api.ts`) — the custom action isn't in the
      generated schema.

> **Date input:** `transfer_datetime` uses the **Jalali** `JalaliDateTimeInput` (plain
> day/month/year + h:m:s field entry, Persian numerals + month names), emitting a Gregorian/UTC
> ISO string. Brought the Jalali layer (Phase 8) forward — see ADR 0004 for the mechanism.

**How to verify (the end-to-end skeleton test):**
1. Log in.
2. See your funds list; open (or create) a fund.
3. Add a member **with a card number**.
4. Record a bank transfer whose `from_card` matches that card.
5. The transaction shows `wallet_charged: true`, and the member's **wallet balance updates**
   (and pending dues settle, if any exist).
- Also record a transfer with a **non-matching** card → it lands unmatched
  (`matched_member: null`); confirm it appears when you later build the unmatched queue (Phase 9).

**Done when:**
- [x] Code complete; `tsc -b` clean, modules transform. **Verified end-to-end against the real
      backend:** transfer with a member's card → `matched_member` set, `wallet_charged: true`,
      and the member's wallet balance = the deposit (500,000); non-matching card → unmatched.
- [x] Dates sent to the API are Gregorian/UTC (`dayjs.toISOString()`).
- [x] **(your click-test)** Drive the full flow in the browser. *(User confirmed the
      end-to-end thread — record transfer → matched member named on the bank page → wallet
      shows the owner + balance.)*

---

> ### ✅ Milestone: walking skeleton complete
> Phases 0–6 give you one working thread through the whole app. Everything below is **fan-out**
> — broaden each area. Re-order the fan-out phases by what you need next; they don't strictly
> depend on each other the way 0–6 do.

---

## Phase 7 — Error, loading & empty-state polish

**Goal:** make the shared UX solid before adding breadth, so every later screen inherits it.

**Build:**
- [ ] A global error boundary + a consistent way to surface API `code` errors as Persian
      messages (one mapping table, keyed by code — FRONTEND_API §9/§11).
- [ ] Standard loading (skeletons/spinners) and empty states for lists.
- [ ] Session-expiry handling: when refresh finally fails, route to login with a clear message.

**Done when:**
- [ ] Every list has loading + empty states; API errors render as readable Persian text.
- [ ] A fully-expired session lands the user on login without a dead screen.

---

## Phase 8 — Jalali date layer — DONE (brought forward in Phase 6)

**Goal:** the thin Jalali↔Gregorian conversion boundary, used everywhere dates appear.

**Implements:** ADR 0004 (Jalali only at the UI edge) — mechanism revised, see ADR.

**Build:**
- [x] Conversion helpers confined to `src/lib/jalali.ts`: `Intl` Persian calendar for display
      (`formatJalaliDate`, day-of-month possibilities) + `jalaali-js` for input
      (`isoToJalaliParts` / `jalaliPartsToIso`). *(Chose Intl + jalaali-js over dayjs + a
      plugin; a calendar-popup DatePicker on Ant v6 was impractical — ADR 0004 updated.)*
- [x] `JalaliDateTimeInput` — plain day / month-name / year (+ optional h:m:s) field entry,
      Persian numerals, emits Gregorian/UTC ISO. In use for `transfer_datetime` (Phase 6).
- [x] Round-trip verified (ISO → Jalali parts → same ISO); invalid Jalali dates rejected via
      `isValidJalaaliDate`.

**Remaining:** as later phases add date fields (loan `issue_date`, report `period_start`),
reuse `JalaliDateTimeInput` (date-only, `showTime={false}`) — no new date infrastructure needed.

**Done when:**
- [x] All date input/display goes through `src/lib/jalali.ts`; nothing else touches Jalali.

---

## Phase 9 — Bank reconciliation: list + unmatched queue + manual assign

**Goal:** the user's day-to-day money-in workflow.

**Implements:** FRONTEND_API §9.1, §9.3, §9.5, §9.6.

**Build:**
- [x] Bank-transactions list (`GET .../bank-transactions/`, newest first, paginated).
      *(brought forward in Phase 6.)*
- [x] Unmatched queue (`GET .../bank-transactions/unmatched/`) — a tabbed «بدون تطبیق» view on
      `BankPage` with a live count badge.
- [x] Manual assign (`POST /api/bank-transactions/{id}/assign/`) via `AssignMemberModal`
      (member `Select`) → invalidates bank queries + the assigned member's wallet; handles
      `BANK_TRANSACTION_ALREADY_CHARGED` and `member_id: ["required"]` as Persian messages.
- [x] Rematch (`POST /api/bank-transactions/{id}/rematch/`) — per-row action; toasts whether it
      matched or stayed unmatched. Most useful after adding the person's card (card-edit UI is
      deferred; cards can be set at member creation today).

**Done when:**
- [x] Unmatched transfers can be assigned to a member and charge the wallet. *(Verified against
      the real backend: assign txn 2 → member 1, wallet 500,000 → 600,000; queue count → 0.)*
- [x] Already-charged and rematch edge cases are handled by `code`. *(Re-assign →
      `BANK_TRANSACTION_ALREADY_CHARGED` 400; rematch with no matching card → stays unmatched.
      User confirmed the full flow in the browser.)*

---

## Phase 10 — Wallet detail: ledger + adjustments + settle

**Goal:** full wallet management for a member.

**Implements:** FRONTEND_API §6.5–6.7.

**Build:**
- [x] Paginated ledger view with `balance`, direction/type per row (server-side limit/offset,
      `keepPreviousData`; added a description column). (`MemberWalletPage`, `wallets/hooks.ts`)
- [x] Manual adjustment (`POST .../adjustments/`, `AdjustmentModal`): credit/debit + required
      description; `WALLET_OVERDRAFT` shows attempted-vs-current balance; a slipped-through
      `VALIDATION_ERROR` lands inline. Refetches wallet (+ loans) after a credit (it auto-settles).
      *(Doc note: the live backend returns `VALIDATION_ERROR{description:["blank"]}` for a blank
      description, not the documented `ADJUSTMENT_DESCRIPTION_REQUIRED` — FRONTEND_API §6.6 updated.)*
- [x] Manual settle button (`POST .../settle/`) → confirm dialog → refetch wallet + fund loans.
- [x] Added Ant's `<App>` provider (`main.tsx`) so `App.useApp()` gives RTL/theme-aware
      message + modal.

**Done when:**
- [x] Adjustments and manual settlement work; overdraft is blocked with a clear message.
      *(Verified against the real backend: credit `201`; overdraft `400 WALLET_OVERDRAFT
      {requested,balance}`; settle `200`. User confirmed the full flow in the browser.)*

---

## Phase 11 — Loans & installments

**Goal:** issue loans and view their installment schedules.

**Implements:** FRONTEND_API §7, §8.

**Build:**
- [x] Loans list per fund (`GET .../loans/`, each with inlined installments) — `LoansPage`, new
      fund nav tab; member name, amount, paid/total installments, status tag; row → detail.
- [x] Create loan (`POST .../loans/`, `CreateLoanModal`) with fund-default fallbacks (empty
      optional fields); handles `INSTALLMENTS_TO_GENERATE_EXCEEDS_COUNT`, `LOAN_AMOUNT_TOO_SMALL`,
      inline field errors. Create body hand-written (generated schema reuses read-only `Loan`).
- [x] Loan detail (`GET /api/loans/{id}/`, `LoanDetailPage`) with the installment schedule.
- [x] Reverse a paid due (`POST /api/dues/{id}/reverse-payment/`, `ReverseDueModal`); handles
      `DUE_NOT_PAID`; refetches loan + list + wallet (a reversal can flip `COMPLETED` → `ACTIVE`).
- [x] `issue_date` uses `isoToDateOnly` (`lib/jalali.ts`) so the Jalali→UTC round-trip keeps the
      picked calendar day. Settle/credit-adjustment now also refetch fund loans (Phase 10 deferral).

**Done when:**
- [x] Loans can be created and viewed with their schedules; payment reversal works.
      *(Verified against the real backend: create `201` with generated installments; all three
      create errors; settle paid installments oldest-first → loan `COMPLETED`; reverse →
      `PAYMENT_REVERSAL` credit + loan `ACTIVE`; re-reverse → `DUE_NOT_PAID`. User confirmed in the
      browser.)*

---

## Phase 12 — Fund settings + monthly report

**Goal:** edit fund settings and read the monthly summary.

**Implements:** FRONTEND_API §5.4, §5.6.

> **⚠️ Reports sub-section PARKED (2026-07-11).** The user parked the monthly-report work —
> "so tricky", "we will have to change a lot" — and asked to leave `src/reports/*` untouched and
> work on everything else until the end of the project. The report code below is committed as a
> first pass but is **slated for redesign**; don't build on it. Fund-*settings* editing is not parked.

**Build:**
- [x] Edit fund settings (`PATCH /api/funds/{id}/`, `EditFundModal`); "settings apply to future ops
      only" note shown. Shared `fundForm.ts` + `FundFormFields.tsx` extracted so create/edit stay in
      sync (`CreateFundModal` refactored onto them). *(Backend contract verified: partial PATCH →
      `200`; `contribution_day=40` → `VALIDATION_ERROR{max_value}`. Browser test still pending.)*
- [x] *(first pass, PARKED — will change)* Monthly report screen (`ReportsPage`,
      `GET .../reports/monthly/?period_start=...`) — expected/received contributions, active-loan
      total/count, member balances. Report GET contract verified via curl; UI unreviewed by design.

**Done when:**
- [ ] Settings can be edited (code done; browser test pending).
- [ ] ~~the monthly report renders for a chosen period~~ — **parked; redesign pending.**

---

## Deferred (not scheduled yet)

- **Excel bulk import** (`POST .../bank-transactions/import/`, FRONTEND_API §9.4) — deferred
  in `CLAUDE.md` until the sheet format is finalized.
- **Automated end-to-end tests** (e.g. Playwright driving the Phase 6 skeleton flow) — optional;
  add once the skeleton is stable if regressions start to hurt.

---

## Suggested "definition of done" for every phase

Regardless of the phase, before ticking its last box:
- `npm run build` (TypeScript) passes with no errors — generated types make API drift a
  compile error, so this is a real check (ADR 0005).
- The manual "How to verify" steps pass against the **real** backend.
- New user-facing strings live in the central strings file, in Persian (ADR 0003).
- Any date on the wire is Gregorian/UTC (ADR 0004); any money on the wire is a raw integer.
- Every English/numeric input (phone, amounts, card numbers, tracking codes) uses
  `normalize={normalizeDigits}` so Persian/Arabic digits become ASCII at the edge (ADR 0007) —
  never on passwords/names.
