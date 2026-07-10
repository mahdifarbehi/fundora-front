# Jalali lives only at the UI boundary

Jalali dates exist **only** at the presentation edge — in what the user reads on
screen and types into a date picker. Every date is converted to Gregorian the instant it
leaves an input, and converted back to Jalali only when rendered. Application state, our
data-fetching cache, and all API requests/responses are Gregorian (`YYYY-MM-DD`) and UTC,
identical to the backend.

This mirrors the backend's own "no Jalali in the backend" rule and keeps a single, thin
conversion layer instead of Jalali values leaking through the app where they could be
compared, stored, or sent to the API by mistake.

## Mechanism (as built — supersedes the original "dayjs + plugin into Ant DatePicker" plan)

The original plan was `dayjs` + a Persian-calendar plugin wired into Ant Design's
`DatePicker`. In practice that wiring is impractical on Ant Design v6 (the `generatePicker`
path), and it was more than we needed. What we actually use, all confined to
`src/lib/jalali.ts`:

- **Display (Gregorian → Jalali):** the browser's built-in Persian calendar via
  `Intl.DateTimeFormat('…-u-ca-persian', …)` — no dependency. Used for read-only labels
  (e.g. `formatJalaliDate`) and the contribution-day "possibilities" hint.
- **Input (Jalali → Gregorian):** `jalaali-js` (the canonical, dependency-free conversion
  algorithm) inside `jalaliPartsToIso` / `isoToJalaliParts`.
- **Date input widget:** a plain field-entry `JalaliDateTimeInput` (day / month-name select /
  year, plus optional hour:minute:second) — **not** a calendar popup. It displays Persian
  numerals + month names and emits a Gregorian/UTC ISO string. Wall-clock time is interpreted
  in the browser's local timezone (Tehran for the target users).

The **decision** is unchanged — Jalali only at the edge, Gregorian/UTC everywhere else; only
the implementation library/widget differs from the original note.

## Consequences

- All Jalali↔Gregorian conversion is confined to `src/lib/jalali.ts` and the input/display
  components that use it — nowhere else.
- Any date in a network payload, in a query key, or in a comparison must be Gregorian/UTC; a
  Jalali value anywhere but a rendered label or a raw input is a bug.
- The local-timezone assumption for time entry is acceptable while users are in Iran; revisit
  if the app ever serves other timezones.
