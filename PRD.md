# Family Loan Fund Platform — PRD v5

**Multi-Tenant · API-First (DRF) · Separated Frontend · Wallet-Based Payments**

> **Changes since v4** (decided with engineering):
> 1. **No Django Admin; open multi-tenant.** The platform is **API-first (DRF)** with a separated frontend. Anyone can self-register and create their own funds; access is protected by JWT auth + per-user fund ownership scoping.
> 2. **Calendar-agnostic backend.** The backend stores and computes **only Gregorian, UTC, timezone-aware** values. **No Jalali anywhere in the backend** — the frontend performs all Jalali↔Gregorian conversion. This makes the backend internationally reusable.
> 3. **Card numbers belong to `User`**, not `Member` — a card is the person's identity data. No `fund_id` on cards; the number is globally unique.
> 4. **`transfer_datetime`** on bank transactions is a full timestamp (date + time), tz-aware UTC.
> 5. **No receipt image** (no object storage for now).
> 6. **Members must have ≥ 1 share** — there is no dormant / zero-share state.
> 7. **No negative wallet balances** — debit operations that would overdraw are rejected.
> 8. **Loan defaults are editable** at creation, and loans support a **custom installment count to generate** (for loans already in progress when a fund adopts the software).
> 9. **Payment reversal** — a mistaken due payment can be undone via a compensating `PAYMENT_REVERSAL` credit.
> 10. **No separate Withdrawal type.** Returning funds and correcting errors both use `ADJUSTMENT` (CREDIT or DEBIT) with a **required reason**.
> 11. **Settlement is event-driven, not scheduled.** Dues are settled the moment a balance-increasing credit (a deposit or a credit adjustment) is recorded — there is no daily settlement job.
> 12. **Per-fund billing day.** `Fund.contribution_day` (a Gregorian day 1–28) drives both contribution generation and installment due dates, removing all calendar coupling.

---

## 1. Overview

This platform hosts family loan funds. Any registered user can create one or more funds and runs all operations for their funds through an API-first backend with a separated frontend. There is no member-facing interface at launch — members communicate with the administrator in person or by phone, and the administrator records all activity on their behalf.

The system automates payment tracking, wallet balancing, and installment settlement so the administrator spends less time on bookkeeping.

---

## 2. Architecture

### 2.1 Multi-Fund / Multi-Tenant
The system supports multiple independent funds, each owned by its creator, from day one via a `fund_id` on the relevant records and per-user ownership scoping (§2.2).

| Entity | Has fund_id? | Reason |
|--------|-------------|--------|
| `funds` | — | This IS the fund |
| `users` | No | Platform-level accounts |
| `card_numbers` | No | Belong to the **person** (`User`); globally unique |
| `members` | Yes | A user inside a specific fund, with fund-specific data |
| `bank_transactions` | Yes | Top-level fund entity |
| `wallet_transactions` | Yes | Top-level fund entity |
| `dues` | Yes | Top-level fund entity |
| `loans` | Yes | Top-level fund entity |

Child entities (e.g. individual dues belonging to a loan) inherit fund context through their parent's FK.

### 2.2 API-First & Access Control
- All operations are exposed as **DRF endpoints** consumed by a separated frontend.
- **Django's admin site is not used / not mounted.**
- The platform is **multi-tenant from day one**: **anyone can self-register** (phone as username + password) and create their own funds. No invitation or secret is required.
- Authentication is **JWT** (login via phone + password). Only users with a usable password can authenticate; member accounts created by an admin have no password until the future portal is activated.
- Access is gated by `IsAuthenticated` **plus per-user fund ownership**: every fund-scoped resource (members, dues, loans, bank/wallet transactions) is filtered so a user only sees and manages funds they created. Cross-tenant access is denied (404/403).
- `is_staff` / `is_superuser` are reserved for platform operators, not for the application's access control.

### 2.3 Calendar & Time
- The backend is **calendar-agnostic**: it stores and computes only **Gregorian** dates and **UTC, timezone-aware** timestamps.
- **No Jalali logic lives in the backend.** The frontend converts Jalali↔Gregorian for all display and input.
- Each fund has a **billing day** — `contribution_day`, a Gregorian day-of-month (1–28) stored in fund settings. It drives **both** contribution generation and installment due dates. Because both calendars are solar, setting it to ~20 lands ~1–2 days around each Jalali month start, with no drift in count (12 periods/year ↔ 12 Jalali months). Capping at 28 avoids missing-day issues at month end.
- A single daily background job checks each fund's `contribution_day`; settlement itself is **not** scheduled (see §12).

---

## 3. User & Member Model

### 3.1 The Relationship
```
User (phone, full_name, password)
 ├──→ CardNumber (user_id, number)        # cards belong to the person
 └──→ Member (user_id, fund_id, share_count)
```

- `User` — platform identity. Only phone is required; full name and password are optional at creation.
- `Member` — the person's financial profile inside a specific fund. Always linked to exactly one `User`. **Must have ≥ 1 share.**
- `CardNumber` — one or more bank card numbers used for auto-matching incoming transfers. **Belongs to `User`**, because a physical card is the person's, independent of fund. Globally unique.

### 3.2 Creating a Member
1. Reuse the `User` with the given phone if it exists, else create one (phone required; full name optional).
2. Create a `Member` linked to that `User` and the fund, with `share_count ≥ 1`.

Phone is unique across the platform. The same person in multiple funds shares one `User` and one card list.

### 3.3 User Fields
| Field | Required | Notes |
|-------|----------|-------|
| Phone Number | Yes | Unique. Login identifier. |
| Full Name | No | Editable any time. |
| Password | No | Not set at creation. Set later to activate the member portal. |

### 3.4 Member Portal Activation
A pre-created member (a `User` with no usable password) activates their account by self-registering with their phone: `POST /api/auth/register/` sets the password on their **existing** `User` (returns 200) instead of creating a duplicate — no migration needed. A phone that already has a usable password is an active account and is rejected. **Known, accepted risk (for now):** activation is unverified, so anyone who knows a pre-created member's phone number can register and claim that account. This is a deliberate tradeoff for the current phase. A future phase (major *v2*) adds **OTP phone verification** at registration — no one can register or activate without validating ownership of the phone number — which closes this account-takeover vector (see §17).

---

## 4. Roles
At launch there is one effective role: **Administrator** — any registered user, acting as administrator of the funds they create. A member-portal role is reserved for the future.

| Role | Capabilities |
|------|-------------|
| Administrator (fund creator) | Full API access **within their own funds**: manage members, shares, settings, bank transactions, loans, adjustments, reversals, reports |
| Member *(future)* | Reserved — no functionality at launch |

---

## 5. Fund

### 5.1 Fund Record
| Field | Notes |
|-------|-------|
| Name | Name of the fund |
| Creator | FK to the `User` who created the fund |
| Monthly Share Amount | Contribution amount per share per month. Positive integer (**≥ 1**) — a zero share amount would produce meaningless zero-amount contributions. |
| Default Loan Amount | **Editable default** loan amount for new loans. Positive integer (**≥ 1**). |
| Default Installment Count | **Editable default** installment count for new loans. Positive integer (**≥ 1**). |
| Contribution Day | Gregorian day-of-month (1–28). Billing day used for contribution generation and installment due dates. |

### 5.2 Settings Rules
Settings changes affect future operations only — existing loans and dues snapshot their values at creation time.

---

## 6. Members

### 6.1 Member Record
| Field | Notes |
|-------|-------|
| User | FK to `User` — always required |
| Fund | FK to fund |
| Share Count | Integer **≥ 1**. There is no dormant / zero-share state. |

### 6.2 Card Numbers
Card numbers are stored on the `User` (see §3.1). Each number is **globally unique** and is used to auto-match incoming bank transfers. Matching resolves a card to its owning user, then to that user's membership in the transaction's fund.

### 6.3 Share Rules
- Monthly Contribution = Share Count × Monthly Share Amount.
- Share count is live — changing it affects the next auto-generated contribution amount.
- Existing loans and dues are never retroactively changed.

---

## 7. Monthly Contributions

A single daily background job generates one contribution per member for each fund **on that fund's `contribution_day`**. The period anchor is `period_start = date(year, month, contribution_day)`.

| Field | Notes |
|-------|-------|
| Member | FK to member |
| Period | Gregorian period anchor (`period_start` date). Jalali label rendered by the frontend. |
| Expected Amount | Snapshotted at generation: Share Count × Monthly Share Amount |
| Status | `Pending` → `Paid` |
| Paid At | tz-aware UTC timestamp set by settlement |

Contributions are settled automatically by event-driven settlement (§12). The administrator never manually marks a contribution as paid.

---

## 8. Bank Transactions

A bank transaction is the raw record of money that arrived in the fund's bank account.

### 8.1 Manual Entry
| Field | Notes |
|-------|-------|
| Amount | Exact amount received (integer) |
| Transfer Datetime | Full timestamp (date + time), tz-aware UTC |
| Tracking Code | Bank reference (optional) |
| From Card | Card number the transfer came from |
| Note | Free-text admin note |
| Matched Member | Set automatically or manually (§8.3) |
| Wallet Charged | Boolean — prevents double-spending |

*(No receipt image field.)*

### 8.2 Excel Import (Deferred)
Bulk import from a spreadsheet will be supported. **The file format is not finalized**, so no column schema is enforced yet. When defined, the import will validate all rows before writing any, show per-row errors, and route accepted rows through the same auto-matching logic as manual entries.

### 8.3 Auto-Matching Logic
After a transaction is saved, the system looks up the `From Card` among registered card numbers, resolves the owning user, and finds that user's membership in the transaction's fund:
- **Match found** → Matched Member set, Wallet Charged = true, DEPOSIT wallet transaction created immediately.
- **No match** (unknown card, or owner not a member of this fund) → Wallet Charged = false; transaction enters the Unmatched Queue.

### 8.4 Unmatched Queue
For transactions with Wallet Charged = false, the administrator can:
- Manually assign the transaction to a member → creates the deposit, sets Wallet Charged = true.
- Add the card to a user and trigger **Re-match**, which re-runs matching **for uncharged transactions only** (already-charged transactions are never re-evaluated or re-charged).

A bank transaction is never charged to a wallet more than once.

---

## 9. Wallet

Every member has a wallet — a running ledger. Balance is always computed as `SUM(credits) − SUM(debits)`; no stored balance column exists.

### 9.1 Wallet Transaction Record
| Field | Notes |
|-------|-------|
| Member | FK to member |
| Fund | FK to fund |
| Amount | Always positive (integer) |
| Direction | `CREDIT` or `DEBIT` |
| Type | See §9.2 |
| `bank_transaction_id` | FK — populated for DEPOSIT |
| `due_id` | FK — populated for CONTRIBUTION_PAYMENT, INSTALLMENT_PAYMENT, PAYMENT_REVERSAL |
| Description | Free text — **required for ADJUSTMENT** |
| Created At | tz-aware UTC timestamp |

### 9.2 Wallet Transaction Types
| Type | Direction | Triggered By | Required FK | Triggers Settlement |
|------|-----------|-------------|-------------|---------------------|
| `DEPOSIT` | CREDIT | Bank transaction matched to member | `bank_transaction_id` | Yes |
| `CONTRIBUTION_PAYMENT` | DEBIT | Settlement | `due_id` | — |
| `INSTALLMENT_PAYMENT` | DEBIT | Settlement | `due_id` | — |
| `ADJUSTMENT` | CREDIT or DEBIT | Admin returns funds / corrects an error | — (description required) | Only when CREDIT |
| `PAYMENT_REVERSAL` | CREDIT | Admin cancels a mistaken due payment | `due_id` | No |

There is no separate `WITHDRAWAL` type: returning excess funds to a member is a DEBIT `ADJUSTMENT` with a reason.

### 9.3 Balance Calculation
```
Balance = SUM(CREDIT) − SUM(DEBIT)  WHERE member_id = ? AND fund_id = ?
```
Calculated fresh on every request. **Balance can never go negative** — any withdrawal or debit adjustment that would overdraw is rejected.

---

## 10. Dues Table (Contributions & Installments)

Contributions and loan installments share a single `dues` table.

| Field | Notes |
|-------|-------|
| Member | FK to member |
| Fund | FK to fund |
| Type | `CONTRIBUTION` or `INSTALLMENT` |
| Loan | FK to loan — only for INSTALLMENT |
| Installment Number | Sequence within the loan — only for INSTALLMENT |
| Period | Gregorian period anchor — only for CONTRIBUTION |
| Due Date | Gregorian date |
| Amount | Snapshotted at generation |
| Status | `Pending` → `Paid` |
| Paid At | tz-aware UTC timestamp set by the Daily Settlement Job |

---

## 11. Loans

The administrator creates loans directly for any member at any time. No loan request or lottery in this version.

### 11.1 Loan Record
| Field | Notes |
|-------|-------|
| Member | FK to member |
| Fund | FK to fund |
| Loan Amount | **Editable**; defaults from fund settings; snapshotted at creation. Must be **≥ Installment Count** so every installment is a positive amount. |
| Installment Count | Full/original plan; **editable**; defaults from fund settings; snapshotted |
| Installments To Generate | How many installment dues to actually create (≤ Installment Count). See §11.2. |
| Issue Date | Gregorian date the loan was created |
| Status | `Active` → `Completed` |

#### 11.2 Installment Generation
When a loan is created, installment dues are generated immediately:
- **Per-installment amount** = Loan Amount ÷ Installment Count. Any integer remainder is added to installment **#1**. Loan Amount must be **≥ Installment Count** (rejected otherwise) so the base per-installment amount is at least 1 — every due, contribution or installment, is a strictly positive amount.
- **Installments To Generate** lets the admin record a loan that is **already in progress** when the fund adopts the software. Example: a loan of 300,000 over 10 installments (30,000 each) where 4 are already paid → set *Installments To Generate = 6*; the system creates only the 6 future dues (numbered 5–10, 30,000 each). The remainder applies only to installment #1, so partial generations that exclude #1 carry no remainder.
- **Due dates:** monthly (Gregorian) on the fund's `contribution_day`, starting the month following the issue date.

### 11.3 Loan Completion
When all installment dues linked to a loan reach `Paid`, the loan automatically transitions to `Completed`.

---

## 12. Event-Driven Settlement

Settlement is **not scheduled**. It runs for a member **immediately after a balance-increasing credit is recorded** — a `DEPOSIT` (matched bank transfer) or a CREDIT `ADJUSTMENT`. It settles whatever is payable from the member's current balance. (A `PAYMENT_REVERSAL` credit does **not** trigger settlement.)

### 12.1 Rules
- Dues are settled oldest-first by due date (ties are arbitrary — ordering between equal-dated dues does not matter).
- Each due is settled in full or not at all — no partial payment.
- Settlement deducts the amount, creates a DEBIT wallet transaction, and marks the due `Paid`.
- Processing stops for a member when their balance can't cover the next pending due.
- After settling, any loan whose installments are all paid transitions to `Completed`.

### 12.2 Example
| Wallet Balance | Pending Dues (oldest first) | Result |
|---------------|----------------------------|--------|
| 2,000,000 | Contribution 1,000,000 + Installment 1,000,000 | Both paid. Balance = 0. |
| 1,500,000 | Contribution 1,000,000 + Installment 1,000,000 | Contribution paid. Installment stays Pending. Balance = 500,000. |
| 800,000 | Contribution 1,000,000 | Nothing paid. |

---

## 13. Payment Reversal

If a due payment was made by mistake, the administrator can reverse it:
- A compensating `PAYMENT_REVERSAL` **credit** (linked to the due) is added — the immutable ledger is never edited or deleted.
- The due returns to `Pending` and its `Paid At` is cleared.
- If the due is an installment whose loan had auto-completed, the loan returns to `Active`.
- The reversal **does not trigger settlement**, so the due is not re-paid immediately. A *later* deposit or credit adjustment would settle the now-pending due unless the administrator first removes the restored balance (e.g. a debit adjustment).

---

## 14. State Machine Summary

| Entity | States | Transition |
|--------|--------|-----------|
| Bank Transaction | Unmatched → Matched | Auto on card match, or manual assignment |
| Bank Transaction | Matched → Wallet Charged | Auto on match confirmation |
| Wallet Transaction | *(immutable log entry)* | Created once, never changed |
| Due | `Pending` → `Paid` | Event-driven settlement (on deposit / credit adjustment) |
| Due | `Paid` → `Pending` | Payment Reversal (§13) |
| Loan | `Active` → `Completed` | Auto when all installments Paid |
| Loan | `Completed` → `Active` | Payment Reversal of one of its installments |

---

## 15. API Surface — Screen/Capability Summary

| Capability | Key Actions |
|------------|------------|
| Auth | Admin registration (phone + password); obtain/refresh JWT; current user |
| Dashboard | Summaries: wallet balances, unpaid dues, unmatched transactions, active loans |
| Members | Add member (creates/reuses User + Member), edit share count, manage card numbers (on User) |
| Bank Transactions | Manual entry, (future) Excel import, unmatched queue, manual assignment, re-match |
| Wallet (per member) | Full ledger, current balance, issue adjustment (credit/debit, with reason), reverse a payment |
| Dues | List pending/paid contributions and installments by member/period |
| Loans | Create loan (editable defaults + custom installments-to-generate), list active/completed + installments |
| Fund Settings | Edit monthly share amount, loan amount, installment count |
| Reports | Monthly summary: expected vs received contributions, loan totals, wallet balances |

---

## 16. Key Design Decisions
- API-first (DRF) with a separated frontend; **no Django admin**; **open multi-tenant self-registration**; access gated by JWT + per-user fund ownership scoping.
- **Calendar-agnostic backend** — Gregorian/UTC/tz-aware only; **no Jalali in the backend**; frontend handles all conversion; a per-fund `contribution_day` (1–28) drives contribution generation and installment due dates.
- Card numbers belong to the **person** (`User`), globally unique — no `fund_id` on cards.
- **Settlement is event-driven** (on deposit / credit adjustment), not scheduled. Only the monthly contribution generator is a scheduled job.
- No interest, no late-payment penalties.
- No member portal, no loan requests/lottery in this version.
- Wallet balance is always computed, never stored; **never negative**.
- Bank transactions are immutable; corrections and fund returns via `ADJUSTMENT` (with reason) — there is no separate `WITHDRAWAL`. Mistaken due payments undone via `PAYMENT_REVERSAL`.
- All monetary amounts are integers.
- Installment remainder goes to the first installment; loans support a **custom count of installments to generate** for already-in-progress loans.
- Every member is backed by a `User` and has **≥ 1 share** (no dormant state).
- Fund settings live on the `Fund` record; loan defaults are editable at creation.
- Phone number is the only required user field.

---

## 17. Future Enhancements
- Member portal (activate by setting a password on the existing `User`).
- Loan request and lottery system.
- SMS notifications for due dates and payment confirmations.
- Multiple administrators per fund; per-fund role scoping.
- Share purchase and transfer workflows.
- Full audit log of all admin actions.
- **OTP phone verification at registration/activation** (future *v2*): registration sends a one-time code to the phone, so no one can register or activate a member without proving they own the number — closing the known phone-claim account-takeover vector described in §3.4.
- Direct bank API integration for automatic transaction import.
- Excel import (once the file format is finalized).
