# Jalali lives only at the UI boundary

Jalali dates exist **only** at the presentation edge — in what the user reads on
screen and types into a date picker. Every date is converted to Gregorian the instant it
leaves an input, and converted back to Jalali only when rendered. Application state, our
data-fetching cache, and all API requests/responses are Gregorian (`YYYY-MM-DD`) and UTC,
identical to the backend.

This mirrors the backend's own "no Jalali in the backend" rule and keeps a single, thin
conversion layer instead of Jalali values leaking through the app where they could be
compared, stored, or sent to the API by mistake. Conversion runs on `dayjs` plus a
Persian-calendar plugin, wired into Ant Design's date components.

## Consequences

- All Jalali↔Gregorian conversion is confined to a small set of formatting/parsing
  helpers used by input and display components — nowhere else.
- Any date in a network payload, in a query key, or in a comparison must be Gregorian; a
  Jalali string anywhere but a rendered label or a raw input is a bug.
