# Fundora API — Frontend Integration Guide

Everything the frontend needs to build against the Fundora backend: every endpoint,
its request and response schema, authentication, and every error code the API can
return.

- **Base path:** all endpoints are under `/api/`.
- **Content type:** `application/json` for all requests/responses, except the Excel
  import endpoint which is `multipart/form-data`.
- **Money:** all amounts are **integers** (Toman). No decimals, no currency object.
- **Timestamps:** ISO-8601, UTC (e.g. `2026-07-05T14:30:00Z`). The backend stores
  and returns everything in UTC.
- **Dates:** `YYYY-MM-DD`.
- **Interactive docs:** a live OpenAPI schema is served at `/api/schema/` and a
  Swagger UI at `/api/docs/`.

---

## 1. Authentication

Fundora uses **JWT (SimpleJWT)** with a split token model:

- The **access token** is returned in the response body and sent as a bearer header on
  every authenticated request:

  ```
  Authorization: Bearer <access_token>
  ```

- The **refresh token** is **never** returned in a body or exposed to JavaScript. It is
  set by the server as an **httpOnly cookie** (`refresh_token`, `SameSite=Strict`,
  `Path=/api/auth/`, `Secure` in production). The browser attaches it automatically to
  the refresh and logout endpoints — the client never reads, stores, or sends it manually.
  Because of this, all requests to `/api/auth/` must be made **with credentials**
  (`fetch(..., { credentials: "include" })` / `axios` `withCredentials: true`).

The identity is a **User**, identified by **phone** (there is no username/email login).
A user who creates funds is that fund's owner; ownership gates all fund-scoped data.

> **Deployment:** the cookie requires the SPA and API to be **same-site**. In development,
> proxy `/api` from the dev server to Django so the browser sees one origin. In production,
> serve both under one registrable domain (e.g. `app.example.ir` + `api.example.ir`).

### Token lifetimes
- **Access token:** ~5 minutes (held in memory by the client).
- **Refresh token:** ~1 day (httpOnly cookie).
- **Logout / revocation:** `POST /api/auth/logout/` (§4.5) blacklists the refresh token
  from the cookie so it can no longer mint access tokens, and clears the cookie. Access
  tokens already issued stay valid until they expire (a few minutes) — there is no
  server-side access-token revocation, so keep access-token lifetime in mind when
  reasoning about "logged out."
- Session handling: silently call `POST /api/auth/token/refresh/` on a `401` (the cookie
  rides along automatically); on a `401` from the refresh endpoint (missing/expired/
  blacklisted refresh cookie) send the user back to login.

---

## 2. Standard error shape

Every error returns a JSON body with a `code` field. There are three broad families.

### 2.1 Domain errors — `400`
Business-rule violations from the service layer. Shape:

```json
{ "code": "WALLET_OVERDRAFT", "requested": 5000, "balance": 1200 }
```

`code` is a stable machine string; the remaining keys are context fields specific to
that code (documented per-endpoint and in the master table in §9).

### 2.2 Validation errors — `400`
Malformed/invalid request payloads (wrong types, missing required fields, out-of-range
values). Shape:

```json
{
  "code": "VALIDATION_ERROR",
  "fields": {
    "share_count": ["min_value"],
    "phone": ["required"]
  }
}
```

`fields` maps each offending field name to a list of **error codes** (not human
sentences). Common field codes: `required`, `null`, `blank`, `invalid`, `min_value`,
`max_value`, `max_length`, `does_not_exist`. Nested/list fields nest the same way.

### 2.3 Auth / permission / not-found errors
Uniform `code`-only bodies:

| HTTP | Body | When |
|------|------|------|
| `401` | `{"code": "NOT_AUTHENTICATED"}` | No/blank credentials on a protected endpoint. |
| `401` | `{"code": "TOKEN_NOT_VALID"}` | Expired/invalid/blacklisted token. |
| `401` | `{"code": "NO_ACTIVE_ACCOUNT"}` | Wrong phone/password at `token/`. |
| `403` | `{"code": "PERMISSION_DENIED"}` | Authenticated but not the owner of the resource. |
| `404` | `{"code": "NOT_FOUND"}` | Resource doesn't exist **or** isn't yours (see note). |

> **Tenant isolation note:** fund-scoped resources you don't own generally return
> `404 NOT_FOUND` (they're filtered out of your queryset), not `403`. Treat `404` on a
> resource you expected to exist as "not yours or gone."

> **⚠️ Observed drift (verified against the live backend, 2026-07):** some `404`s do **not**
> use the `{"code": "NOT_FOUND"}` shape above — a fund-detail lookup that isn't yours returns
> DRF's default `{"detail": "No Fund matches the given query."}` (no `code` field). This
> happens wherever the backend uses `get_object_or_404`/`NotFound` instead of the custom
> code-emitting handler. **Do not rely on `code` being present on a `404`; branch on the HTTP
> status.** The frontend handles this by deriving a fallback code from the status when the
> body has no `code` (see `src/lib/errors.ts`). Same caveat may apply to other DRF-default
> `401`/`403`/`404` responses. (Backend TODO: emit `{"code": …}` consistently, or accept
> that clients key off status.)

The `401` code for an invalid token comes straight from SimpleJWT, upper-cased
(`token_not_valid` → `TOKEN_NOT_VALID`).

### 2.4 Pagination (all list endpoints)

Every list endpoint is paginated with **limit/offset** and returns an **envelope**, not
a bare array:

```json
{
  "count": 137,
  "next": "https://api.example.com/api/funds/1/members/?limit=50&offset=50",
  "previous": null,
  "results": [ /* the page of objects */ ]
}
```

- `count` — total number of items across all pages.
- `next` / `previous` — absolute URLs for the adjacent pages, or `null` at the ends.
- `results` — the current page of objects.

**Query params:** `?limit=<n>&offset=<n>`. Default page size is **50**; omit the params
to get the first 50.

This envelope applies to: fund list, member list, loan list, bank-transaction list, the
**unmatched** queue, and the **wallet ledger** (which additionally carries a top-level
`balance` — see §6.5). Action results that aren't browsable collections (e.g.
`settle`, which returns just the dues it paid) are returned as plain arrays.

---

## 3. Enumerations

Use these exact string values.

| Enum | Values |
|------|--------|
| **Direction** (wallet) | `CREDIT`, `DEBIT` |
| **WalletTxnType** | `DEPOSIT`, `CONTRIBUTION_PAYMENT`, `INSTALLMENT_PAYMENT`, `ADJUSTMENT`, `PAYMENT_REVERSAL` |
| **DueType** | `CONTRIBUTION`, `INSTALLMENT` |
| **DueStatus** | `PENDING`, `PAID` |
| **LoanStatus** | `ACTIVE`, `COMPLETED` |

---

## 4. Auth endpoints — `/api/auth/`

### 4.1 `POST /api/auth/register/` — self-registration (public)
No auth required.

**Request**
```json
{ "phone": "09120000000", "full_name": "Ali", "password": "s3cret-pass" }
```
- `phone` (string, required, max 20) — unique platform identity.
- `password` (string, required, write-only) — validated by Django's password
  validators (minimum length applies; see codes below).
- `full_name` (string, optional).

**Responses**
- `201 Created` — a brand-new phone was registered.
- `200 OK` — the phone already existed as a **pre-created, password-less member**
  (added to a fund by an owner) and was **activated** by setting this password. The
  account can now log in.

Both return the user (no password):
```json
{ "id": 12, "phone": "09120000000", "full_name": "Ali" }
```

**Errors**
- `400 VALIDATION_ERROR` with `fields`:
  - `phone: ["already_registered"]` — phone already has a usable password (a real,
    activated account). Prompt the user to log in instead.
  - `phone: ["required"]`, `password: ["required"]` — missing fields.
  - `password: ["password_too_short"]` (and other Django password-validator codes such
    as `password_too_common`, `password_too_similar`, `password_entirely_numeric`) —
    weak password.

### 4.2 `POST /api/auth/token/` — log in / obtain tokens (public)
Log in with phone + password. Returns the access token in the body and sets the refresh
token as an httpOnly cookie (see §1).

**Request**
```json
{ "phone": "09120000000", "password": "s3cret-pass" }
```

**Response `200`** — access token in the body; refresh token in a `Set-Cookie` header
(`refresh_token`, httpOnly, `SameSite=Strict`, `Path=/api/auth/`):
```json
{ "access": "<jwt>" }
```

**Errors**
- `401 {"code": "NO_ACTIVE_ACCOUNT"}` — wrong phone or password.
- `400 VALIDATION_ERROR` — missing `phone`/`password`.

### 4.3 `POST /api/auth/token/refresh/` — refresh access token (public)
Reads the refresh token from the httpOnly cookie — **send the request with credentials and
an empty body** (no `refresh` field).

**Request** — empty body; the `refresh_token` cookie is attached automatically by the
browser.
```json
{}
```
**Response `200`** — a new access token; if the server rotates refresh tokens, the cookie
is refreshed too:
```json
{ "access": "<jwt>" }
```
**Errors**
- `401 {"code": "TOKEN_NOT_VALID"}` — refresh cookie missing, expired, invalid, or
  blacklisted (e.g. after logout).

### 4.4 `GET /api/auth/me/` — current user (auth required)
**Response `200`**
```json
{
  "id": 12,
  "phone": "09120000000",
  "full_name": "Ali",
  "date_joined": "2026-07-05T14:30:00Z"
}
```

### 4.5 `POST /api/auth/logout/` — revoke a refresh token (public)
Reads the refresh token from the httpOnly cookie, blacklists it, and clears the cookie.
Does **not** require an access token (the cookie itself is the credential), so a client
can log out even after its access token has expired. **Send with credentials and an empty
body.**

**Request** — empty body; the `refresh_token` cookie is attached automatically.
```json
{}
```
**Response `205 Reset Content`** — empty body; the `Set-Cookie` header clears the refresh
cookie. The refresh token is now revoked; any later `token/refresh/` returns
`401 TOKEN_NOT_VALID`.

**Idempotent:** logging out with no cookie, or with an already-invalid/expired cookie,
also returns `205` (there is simply nothing left to revoke). Discard the in-memory access
token client-side on logout.

> The short-lived access token is **not** invalidated by logout; it remains usable until
> it expires. Discard the in-memory access token client-side on logout (the refresh
> cookie is already cleared and blacklisted by the server).

---

## 5. Funds — `/api/funds/`

All endpoints require auth. **You only see and act on funds you created.**

### Fund object
```json
{
  "id": 1,
  "name": "Family Fund",
  "creator": 12,
  "monthly_share_amount": 1000000,
  "default_loan_amount": 5000000,
  "default_installment_count": 10,
  "contribution_day": 5,
  "created_at": "2026-07-01T09:00:00Z",
  "updated_at": "2026-07-01T09:00:00Z"
}
```
- `creator` is read-only, stamped from the authenticated user.
- `monthly_share_amount`, `default_loan_amount` — integers ≥ 1.
- `default_installment_count` — integer ≥ 1.
- `contribution_day` — integer **1–28** (kept ≤ 28 so it exists in every month).

### 5.1 `GET /api/funds/` — list your funds
Returns a **paginated envelope** (§2.4) of Fund objects in `results`.

### 5.2 `POST /api/funds/` — create a fund
**Request** (all required except read-only fields)
```json
{
  "name": "Family Fund",
  "monthly_share_amount": 1000000,
  "default_loan_amount": 5000000,
  "default_installment_count": 10,
  "contribution_day": 5
}
```
**Response `201`** — the Fund object.
**Errors:** `400 VALIDATION_ERROR` (e.g. `monthly_share_amount: ["min_value"]`,
`contribution_day: ["max_value"]`).

### 5.3 `GET /api/funds/{id}/` — retrieve one fund
`200` Fund object, or `404 NOT_FOUND` if not yours.

### 5.4 `PUT /api/funds/{id}/` / `PATCH /api/funds/{id}/` — update
Same writable fields as create (`PATCH` allows partial). `200` Fund object.

> Settings changes apply to **future** operations only. Existing loans and dues
> snapshot the values they used at creation time; editing a fund never rewrites them.

### 5.5 `DELETE /api/funds/{id}/` — delete
`204 No Content`. Note related records use `PROTECT`, so a fund with members/loans/etc.
cannot be deleted (a `400`/`500`-class protected-error will result); delete only makes
sense for empty funds.

### 5.6 `GET /api/funds/{id}/reports/monthly/?period_start=YYYY-MM-DD`
Monthly summary for one billing period.

**Query params**
- `period_start` (required, `YYYY-MM-DD`) — the period's start date.

**Response `200`**
```json
{
  "period_start": "2026-07-05",
  "expected_contributions": 5000000,
  "received_contributions": 3000000,
  "active_loan_total": 15000000,
  "active_loan_count": 3,
  "member_balances": [
    { "member_id": 4, "balance": 200000 },
    { "member_id": 5, "balance": 0 }
  ]
}
```
- `expected_contributions` — sum of all contribution dues for the period.
- `received_contributions` — sum of the **paid** ones.
- `member_balances` — every member of the fund, with current wallet balance
  (0 if they have no transactions).

**Errors**
- `400 VALIDATION_ERROR` with `period_start: ["required"]` (param omitted) or
  `period_start: ["invalid_date"]` (unparseable date).
- `404 NOT_FOUND` — fund not yours.

---

## 6. Members

Members are created **nested under a fund**; updates and wallet actions use the
standalone `/api/members/{id}/` routes.

### Member object
```json
{
  "id": 4,
  "user": 20,
  "user_phone": "09121111111",
  "user_full_name": "Sara",
  "fund": 1,
  "share_count": 2,
  "created_at": "2026-07-01T09:05:00Z",
  "updated_at": "2026-07-01T09:05:00Z"
}
```
`user`, `user_phone`, `user_full_name`, and `fund` are read-only. `user` is the linked User
id; `user_phone`/`user_full_name` are that person's identity, denormalized onto the Member so
a roster can show names/phones without a separate user lookup.

### 6.1 `GET /api/funds/{fund_pk}/members/` — list members of a fund
Paginated envelope (§2.4) of Member objects. `404 NOT_FOUND` if the fund isn't yours.

### 6.2 `POST /api/funds/{fund_pk}/members/` — add a member
Creates (or reuses) a User by phone and links them to the fund. If the phone is new,
a **password-less User** is created that the person can later activate via
`register/` (§4.1).

**Request**
```json
{
  "phone": "09121111111",
  "full_name": "Sara",
  "share_count": 2,
  "cards": ["6037991111111111", "6037992222222222"]
}
```
- `phone` (string, required).
- `share_count` (integer, required, ≥ 1).
- `full_name` (string, optional, default `""`).
- `cards` (array of strings, optional) — bank card numbers used to auto-match incoming
  transfers to this person. Omit or send `null` to skip. If provided, this becomes the
  person's complete card set (see §6.5 semantics).

**Response `201`** — the Member object.

**Errors**
- `400 {"code": "MEMBER_ALREADY_EXISTS", "phone": "09121111111"}` — this user is
  already a member of this fund.
- `400 {"code": "CARD_ALREADY_REGISTERED", "number": "6037991111111111"}` — one of the
  `cards` is already registered to a different person (card numbers are globally unique). The
  whole request is rejected atomically — **no member is created** in this case.
- `400 VALIDATION_ERROR` — e.g. `share_count: ["min_value"]`, `phone: ["required"]`.
- `404 NOT_FOUND` — fund not yours.

### 6.3 `PATCH /api/members/{id}/` — update a member
Only `share_count` is editable.
**Request** `{ "share_count": 3 }` → **Response `200`** Member object.
Errors: `400 VALIDATION_ERROR` (`share_count: ["min_value"]`), `404 NOT_FOUND`.

### 6.4 `PUT /api/members/{id}/cards/` — replace the person's card set
Sets the **exact** list of cards for the member's underlying User (cards not in the
list are removed; the operation is idempotent).

**Request**
```json
{ "numbers": ["6037991111111111", "6037993333333333"] }
```
**Response `200`** — the resulting cards:
```json
[
  { "id": 8, "number": "6037991111111111", "created_at": "2026-07-01T09:05:00Z" },
  { "id": 9, "number": "6037993333333333", "created_at": "2026-07-05T10:00:00Z" }
]
```
Errors: `400 VALIDATION_ERROR`, `404 NOT_FOUND`.

> Cards belong to the **person (User)**, not to one fund membership, and are globally
> unique across the platform. They drive auto-matching of bank transfers.

### 6.5 `GET /api/members/{id}/wallet/` — wallet balance + ledger
A **paginated** ledger (§2.4) plus a top-level `balance`. The pagination envelope
carries the page of ledger rows in `results`; `balance` is the full-history balance
(independent of the current page).

**Response `200`**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 55,
      "amount": 1000000,
      "direction": "CREDIT",
      "type": "DEPOSIT",
      "description": "",
      "bank_transaction": 30,
      "created_at": "2026-07-05T10:00:00Z"
    },
    {
      "id": 56,
      "amount": 800000,
      "direction": "DEBIT",
      "type": "CONTRIBUTION_PAYMENT",
      "description": "",
      "bank_transaction": null,
      "created_at": "2026-07-05T10:00:01Z"
    }
  ],
  "balance": 200000
}
```
- `balance` = sum of credits − sum of debits, across the member's whole history.
- `results` — a page of the immutable ledger, oldest first. Paginate with
  `?limit=&offset=`. Ledger rows are never updated or deleted.

### 6.6 `POST /api/members/{id}/adjustments/` — manual wallet adjustment
Credit or debit a member's wallet directly (corrections, manual entries). A **credit**
adjustment automatically triggers settlement of pending dues; a **debit** does not.

**Request**
```json
{ "amount": 50000, "direction": "CREDIT", "description": "Correction for July" }
```
- `amount` (integer, required, ≥ 1).
- `direction` (required) — `CREDIT` or `DEBIT`.
- `description` (string, required, non-blank).

**Response `201`** — the created WalletTransaction (same shape as ledger rows above,
`type: "ADJUSTMENT"`).

**Errors**
- `400 VALIDATION_ERROR` — a blank/whitespace description returns
  `{"code": "VALIDATION_ERROR", "fields": {"description": ["blank"]}}` (verified against the
  live backend). Other field codes: `amount: ["min_value"]`, `direction: ["invalid_choice"]`.
  *(The serializer's field-level `blank` check fires first, so the dedicated
  `ADJUSTMENT_DESCRIPTION_REQUIRED` code below is not currently emitted for the empty-description
  case — kept documented in case a code path still raises it.)*
- `400 {"code": "WALLET_OVERDRAFT", "requested": 50000, "balance": 1200}` — a `DEBIT`
  larger than the current balance. The wallet can never go negative.
- `404 NOT_FOUND`.

### 6.7 `POST /api/members/{id}/settle/` — run settlement manually
Pays as many pending dues as the balance allows, **oldest due first**, stopping at the
first due the balance can't cover. Normally settlement runs automatically on deposits
and credit adjustments; this endpoint forces a run.

**Request:** empty body.
**Response `200`** — array of the payment WalletTransactions created (may be empty):
```json
[
  { "id": 57, "amount": 800000, "direction": "DEBIT", "type": "CONTRIBUTION_PAYMENT",
    "description": "", "bank_transaction": null, "created_at": "2026-07-05T10:05:00Z" }
]
```
Errors: `404 NOT_FOUND`.

---

## 7. Loans & installments

### Loan object
```json
{
  "id": 3,
  "member": 4,
  "fund": 1,
  "loan_amount": 5000000,
  "installment_count": 10,
  "installments_to_generate": 10,
  "issue_date": "2026-07-05",
  "status": "ACTIVE",
  "created_at": "2026-07-05T09:00:00Z",
  "installments": [
    {
      "id": 100,
      "installment_number": 1,
      "due_date": "2026-08-05",
      "amount": 500000,
      "status": "PENDING",
      "paid_at": null
    }
  ]
}
```
- `installments` — always ordered by `installment_number`.
- `status` — `ACTIVE` until every generated installment is `PAID`, then `COMPLETED`.
  A payment reversal can flip a `COMPLETED` loan back to `ACTIVE`.
- `installment_count` — total installments the loan is divided into.
- `installments_to_generate` — how many due rows are actually created now (≤
  `installment_count`; lets you back-date a loan that's partway through).

### 7.1 `GET /api/funds/{fund_pk}/loans/` — list loans in a fund
Paginated envelope (§2.4) of Loan objects in `results`, newest first, each with its
(ordered) installments. `404 NOT_FOUND` if fund not yours.

> Note: each loan still inlines **all** of its own installments (installments are not
> separately paginated), so a single loan with many installments is still a large
> object — pagination only bounds the number of loans per page.

### 7.2 `POST /api/funds/{fund_pk}/loans/` — create a loan
Generates installment dues automatically. Amounts split evenly
(`loan_amount // installment_count`); any remainder is added to installment #1.

**Request** (all fields optional except `member_id`; omitted fields fall back to the
fund's defaults)
```json
{
  "member_id": 4,
  "loan_amount": 5000000,
  "installment_count": 10,
  "installments_to_generate": 10,
  "issue_date": "2026-07-05"
}
```
- `member_id` (integer, required) — must be a member of this fund.
- `loan_amount` (integer, optional, ≥ 1; default = fund's `default_loan_amount`).
- `installment_count` (integer, optional, ≥ 1; default = fund's
  `default_installment_count`).
- `installments_to_generate` (integer, optional, ≥ 1; default = `installment_count`).
- `issue_date` (date, optional; default = today). Installment due dates are computed
  from `issue_date` + N months, pinned to the fund's `contribution_day`.

**Response `201`** — the Loan object with its installments.

**Errors**
- `400 {"code": "INSTALLMENTS_TO_GENERATE_EXCEEDS_COUNT", "installments_to_generate": 12, "installment_count": 10}`
  — you asked to generate more installments than the loan has.
- `400 {"code": "LOAN_AMOUNT_TOO_SMALL", "loan_amount": 5, "installment_count": 10}`
  — `loan_amount < installment_count`, which would produce zero-amount installments.
- `400 VALIDATION_ERROR` — e.g. `member_id: ["required"]`, `loan_amount: ["min_value"]`.
- `404 NOT_FOUND` — fund not yours, or `member_id` not in this fund.

### 7.3 `GET /api/loans/{id}/` — retrieve one loan
`200` Loan object (with ordered installments), or `404 NOT_FOUND`.

> There is **no** direct update/delete for loans or individual installments. Installments
> are paid via settlement (§6.7) and can be undone via due reversal (§8).

---

## 8. Dues — `/api/dues/`

A **Due** is a single payment obligation: either a monthly `CONTRIBUTION` or a loan
`INSTALLMENT`. Dues are created by the system (monthly contribution generation; loan
creation), not directly by the client. The only client action on a due is reversing a
payment.

Due fields (as embedded in loan installments): `id`, `installment_number` (null for
contributions), `due_date`, `amount`, `status` (`PENDING`/`PAID`), `paid_at`.

### 8.1 `POST /api/dues/{id}/reverse-payment/` — undo a paid due
Restores the due to `PENDING`, credits the member's wallet with a `PAYMENT_REVERSAL`,
and reverts a `COMPLETED` loan to `ACTIVE` if this was one of its installments. Does
**not** re-trigger settlement (the credit is a correction, not new funds — call
`settle` explicitly if you want to re-apply it).

**Request**
```json
{ "description": "Reversed — bank transfer bounced" }
```
- `description` (string, optional, may be blank).

**Response `200`** — the created `PAYMENT_REVERSAL` WalletTransaction:
```json
{
  "id": 60,
  "amount": 800000,
  "direction": "CREDIT",
  "type": "PAYMENT_REVERSAL",
  "description": "Reversed — bank transfer bounced",
  "bank_transaction": null,
  "created_at": "2026-07-05T11:00:00Z"
}
```

**Errors**
- `400 {"code": "DUE_NOT_PAID", "due_id": 100}` — the due isn't currently `PAID`
  (already pending, or already reversed).
- `404 NOT_FOUND` — due not yours.

---

## 9. Bank transactions & Excel import

Bank transactions represent incoming transfers. On creation the system **auto-matches**
by card number → person → fund member and, if matched, credits ("charges") the member's
wallet (which then settles pending dues). Unmatched transactions can be assigned
manually.

### BankTransaction object
```json
{
  "id": 30,
  "fund": 1,
  "amount": 1000000,
  "transfer_datetime": "2026-07-05T09:30:00Z",
  "tracking_code": "TRK123",
  "from_card": "6037991111111111",
  "note": "",
  "matched_member": 4,
  "wallet_charged": true,
  "created_at": "2026-07-05T09:31:00Z"
}
```
- `matched_member` — member id, or `null` if unmatched.
- `wallet_charged` — `true` once the member's wallet has been credited. A charged
  transaction cannot be re-charged.

### 9.1 `GET /api/funds/{fund_pk}/bank-transactions/` — list
Paginated envelope (§2.4) of BankTransaction objects in `results`, newest first.
`404 NOT_FOUND` if fund not yours.

### 9.2 `POST /api/funds/{fund_pk}/bank-transactions/` — record one transfer
Creates the transaction and immediately attempts auto-matching.

**Request**
```json
{
  "amount": 1000000,
  "transfer_datetime": "2026-07-05T09:30:00Z",
  "from_card": "6037991111111111",
  "tracking_code": "TRK123",
  "note": "July share"
}
```
- `amount` (integer, required, ≥ 1).
- `transfer_datetime` (datetime, required).
- `from_card` (string, required, max 32).
- `tracking_code` (string, optional, max 64, default `""`).
- `note` (string, optional, default `""`).

**Response `201`** — the BankTransaction (already matched/charged if a card matched a
member).
**Errors:** `400 VALIDATION_ERROR`, `404 NOT_FOUND`.

### 9.3 `GET /api/funds/{fund_pk}/bank-transactions/unmatched/` — the unmatched queue
Paginated envelope (§2.4); `results` holds this fund's BankTransaction objects with
`matched_member == null`. Use this to drive a manual-assignment UI.

### 9.4 `POST /api/funds/{fund_pk}/bank-transactions/import/` — bulk Excel import
**`multipart/form-data`.** Upload one `.xlsx` file under the key `file`.

**Expected sheet layout** (row 1 is a header and is skipped):

| Col | Field | Required | Notes |
|-----|-------|----------|-------|
| A | amount | yes | positive integer |
| B | transfer_datetime | yes | `YYYY-MM-DDTHH:MM:SS`, `YYYY-MM-DD HH:MM:SS`, `YYYY-MM-DD`, or an Excel datetime |
| C | from_card | yes | ≤ 32 chars |
| D | tracking_code | no | ≤ 64 chars |
| E | note | no | free text |

**Validation is all-or-nothing.** Every row is validated first; if **any** row is
invalid, nothing is written.

**Success `201`**
```json
{
  "imported": 42,
  "errors": [],
  "transactions": [ /* array of BankTransaction objects */ ]
}
```

**Validation failure `400`** — no rows written:
```json
{
  "imported": 0,
  "errors": [
    { "row": 3, "field": "amount", "error": "min_value" },
    { "row": 7, "field": "transfer_datetime", "error": "invalid" },
    { "row": 9, "field": "from_card", "error": "required" }
  ]
}
```
Row-level `error` codes: `required`, `invalid`, `min_value`, `max_length`. `row` is the
1-based sheet row number. A completely empty/unreadable workbook returns a single
`{ "row": 0, "field": "file", "error": "empty_workbook" }`.

**Missing file** — `400 VALIDATION_ERROR` with `file: ["required"]`.

> Note: this import runs synchronously in the request and settles every imported row
> inline. Large files can be slow; keep uploads reasonably sized.

### 9.5 `POST /api/bank-transactions/{id}/assign/` — manually assign a member
Assigns a member to an unmatched transaction and charges their wallet.

**Request**
```json
{ "member_id": 4 }
```
- `member_id` (integer, required) — must belong to the transaction's fund.

**Response `200`** — the updated BankTransaction (`matched_member` set,
`wallet_charged: true`).

**Errors**
- `400 {"code": "BANK_TRANSACTION_ALREADY_CHARGED", "bank_transaction_id": 30}` — the
  transaction was already charged (e.g. auto-matched, or a double request).
- `400 VALIDATION_ERROR` — `member_id: ["required"]`.
- `404 NOT_FOUND` — transaction not yours, or `member_id` not in its fund.

### 9.6 `POST /api/bank-transactions/{id}/rematch/` — re-run auto-matching
Re-attempts card-based matching on an **uncharged** transaction (no-op if already
charged). Useful after you've added the person's card via §6.4.

**Request:** empty body.
**Response `200`** — the BankTransaction (now matched/charged if a card matched).
`404 NOT_FOUND` if not yours.

---

## 10. Endpoint index

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/auth/register/` | Register / activate account | public |
| POST | `/api/auth/token/` | Log in (get tokens) | public |
| POST | `/api/auth/token/refresh/` | Refresh access token | public |
| POST | `/api/auth/logout/` | Revoke a refresh token | public |
| GET | `/api/auth/me/` | Current user | yes |
| GET | `/api/funds/` | List your funds | yes |
| POST | `/api/funds/` | Create fund | yes |
| GET | `/api/funds/{id}/` | Retrieve fund | yes |
| PUT/PATCH | `/api/funds/{id}/` | Update fund | yes |
| DELETE | `/api/funds/{id}/` | Delete fund | yes |
| GET | `/api/funds/{id}/reports/monthly/` | Monthly summary | yes |
| GET | `/api/funds/{fund_pk}/members/` | List members | yes |
| POST | `/api/funds/{fund_pk}/members/` | Add member | yes |
| PATCH | `/api/members/{id}/` | Update member share count | yes |
| PUT | `/api/members/{id}/cards/` | Replace member's cards | yes |
| GET | `/api/members/{id}/wallet/` | Balance + ledger | yes |
| POST | `/api/members/{id}/adjustments/` | Credit/debit adjustment | yes |
| POST | `/api/members/{id}/settle/` | Run settlement | yes |
| GET | `/api/funds/{fund_pk}/loans/` | List loans | yes |
| POST | `/api/funds/{fund_pk}/loans/` | Create loan | yes |
| GET | `/api/loans/{id}/` | Retrieve loan | yes |
| POST | `/api/dues/{id}/reverse-payment/` | Reverse a paid due | yes |
| GET | `/api/funds/{fund_pk}/bank-transactions/` | List transactions | yes |
| POST | `/api/funds/{fund_pk}/bank-transactions/` | Record transaction | yes |
| GET | `/api/funds/{fund_pk}/bank-transactions/unmatched/` | Unmatched queue | yes |
| POST | `/api/funds/{fund_pk}/bank-transactions/import/` | Excel import | yes |
| POST | `/api/bank-transactions/{id}/assign/` | Assign member | yes |
| POST | `/api/bank-transactions/{id}/rematch/` | Re-run matching | yes |
| GET | `/api/schema/` | OpenAPI schema | public |
| GET | `/api/docs/` | Swagger UI | public |

---

## 11. Domain error code reference

Every `400` domain error (`{ "code": ..., ...context }`). Validation and
auth/permission errors are covered in §2.

| Code | Context fields | Raised by |
|------|----------------|-----------|
| `MEMBER_ALREADY_EXISTS` | `phone` | Add member (§6.2) |
| `CARD_ALREADY_REGISTERED` | `number` | Add member (§6.2), replace cards (§6.4) |
| `DUE_NOT_PAID` | `due_id` | Reverse payment (§8.1) |
| `BANK_TRANSACTION_ALREADY_CHARGED` | `bank_transaction_id` | Assign member (§9.5) |
| `INSTALLMENTS_TO_GENERATE_EXCEEDS_COUNT` | `installments_to_generate`, `installment_count` | Create loan (§7.2) |
| `LOAN_AMOUNT_TOO_SMALL` | `loan_amount`, `installment_count` | Create loan (§7.2) |
| `ADJUSTMENT_DESCRIPTION_REQUIRED` | — | Adjustment (§6.6) — *not currently emitted; blank description returns `VALIDATION_ERROR {description:["blank"]}` instead* |
| `WALLET_OVERDRAFT` | `requested`, `balance` | Debit adjustment (§6.6) |

---

## 12. Behavioral notes worth building around

- **Settlement is automatic** on deposits (matched bank transactions) and on **credit**
  adjustments. It pays pending dues oldest-first until the balance runs out. After such
  actions, re-fetch the member's wallet and any affected loans to reflect new payments.
- **The wallet never goes negative.** Debit adjustments are rejected with
  `WALLET_OVERDRAFT` rather than overdrawing.
- **The ledger is immutable.** Corrections are new rows (`ADJUSTMENT`,
  `PAYMENT_REVERSAL`), never edits.
- **All list endpoints are paginated** with limit/offset and return the `{count, next,
  previous, results}` envelope (§2.4), default page size 50. The wallet ledger adds a
  top-level `balance`. Build list UIs against `results` and page with `?limit=&offset=`.
- **Tenant isolation is strict.** You only ever see funds you created and everything
  under them; other tenants' resources surface as `404`.
- **Pre-created members can self-activate.** When an owner adds a member by phone, a
  password-less account is created; that person later calls `register/` with the same
  phone to set a password (returns `200`, "activated"), rather than being rejected.
</content>
</invoke>
