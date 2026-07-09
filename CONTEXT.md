# Fundora Frontend

The web UI for Fundora: a Persian, RTL, end-user-facing web app where anyone can
self-register and run the family loan funds they own. It is multi-tenant — each user is
the owner/administrator of their own funds and sees only those. It talks to an API-first
Django/DRF backend that is deliberately calendar- and locale-agnostic, so this frontend
owns all Jalali conversion, RTL layout, and Toman formatting.

## Language

### Money & calendar

**Toman**:
The single money unit. All amounts are integers — no decimals, no currency object. The
UI formats them for display (grouping, Persian numerals) but sends/receives raw integers.
_Avoid_: Rial, currency, price.

**Jalali**:
The Persian solar calendar shown to and entered by the user. Exists **only** in the
frontend — every Jalali value is converted to/from Gregorian at the API boundary.
_Avoid_: Shamsi, Persian date, Khorshidi (use "Jalali" in code and prose).

**Gregorian / UTC**:
The calendar and timezone the backend stores and returns. Dates are `YYYY-MM-DD`;
timestamps are ISO-8601 UTC. The frontend never persists Jalali — it converts at the edge.

### Core domain

**Fund**:
A single family loan fund, owned by the user who created it. The tenancy boundary: a
user only ever sees funds they own. Carries settings (monthly share amount, loan
defaults, contribution day).
_Avoid_: Account, group, pool.

**Member**:
A person's financial profile inside one Fund (their share count). Always backed by a
platform-level User (identified by phone); the same person across funds is one User with
one shared card list.
_Avoid_: Client, participant.

**Contribution Day**:
A fund-level Gregorian day-of-month (1–28) that drives both monthly contribution
generation and installment due dates. The lever that keeps the backend calendar-agnostic.

**Due**:
One payment obligation — either a monthly `CONTRIBUTION` or a loan `INSTALLMENT`. Created
by the system, never by hand. The only user action on a Due is reversing its payment.
_Avoid_: Payment, bill, charge (a Due is the obligation, not the money that settles it).

**Wallet**:
A member's running ledger inside a fund. Balance is always computed (SUM credits − SUM
debits), never stored, and can never go negative. The ledger is immutable — corrections
are new rows, never edits.

**Settlement**:
The event-driven process that pays pending Dues oldest-first from a member's balance,
triggered automatically by a balance-increasing credit (a matched deposit or a credit
adjustment). Stops at the first Due the balance can't cover.
_Avoid_: Payment run, billing (settlement is not scheduled).

**Bank Transaction**:
The raw record of money that arrived in the fund's bank account. Auto-matched by card
number → person → fund member; if matched it "charges" the member's Wallet (a DEPOSIT),
which then triggers Settlement. Unmatched ones sit in a queue for manual assignment.
_Avoid_: Transfer, payment (reserve "Bank Transaction" for this raw inbound record).
