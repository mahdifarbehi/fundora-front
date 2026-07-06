# Persian-only, RTL UI with no i18n runtime

The UI ships in a single Persian (Farsi) locale with a full right-to-left layout and
Persian numerals for display. Strings are authored in Persian and kept in one central
place, but we deliberately do **not** pull in an i18n framework (react-i18next) or any
runtime language/direction switching.

The app is an internal tool for a single Iranian family-fund operator, so a second locale
is speculative; paying the i18n tax now (keying every string, testing both directions)
would be cost without benefit. Direction is set once at the document root (`dir="rtl"`).

## Consequences

- Every UI-kit, date-picker, and layout choice **must** support RTL; this is a hard
  filter on component-library selection, not a nice-to-have.
- If a second locale is ever needed, retrofitting i18n is real work — this is an accepted
  bet that it won't be needed for this phase.
