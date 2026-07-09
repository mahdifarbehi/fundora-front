# Persian/Arabic digits are normalized to ASCII at the input boundary

Any field whose value must be **English/ASCII** for the backend — phone numbers, money
amounts (Toman), bank card numbers, tracking codes — is normalized from Persian
(`۰–۹`, U+06F0–U+06F9) or Arabic-Indic (`٠–٩`, U+0660–U+0669) digits to ASCII `0–9` **at the
input edge**, before any validation or network call. Everything downstream — Zod schemas,
query keys, API payloads — only ever sees ASCII digits.

Iranian users type on a Persian keyboard, so a phone entered as `۰۹۱۲…` is the common case,
not the exception. Our validators rely on ASCII (`\d` in JS regex matches ASCII only), and
the backend expects ASCII strings/integers, so an un-normalized Persian-digit value both
fails client validation and would be wrong on the wire. Converting once, at the boundary,
mirrors the Jalali rule (ADR 0004): the foreign representation exists only at the very edge
and never leaks inward.

## How

- `src/lib/digits.ts` — `toEnglishDigits(str)` is the single converter; `normalizeDigits` is
  its Ant Design `Form.Item` adapter.
- English/numeric fields set `normalize={normalizeDigits}` on their `Form.Item`, so the stored
  (and thus validated + submitted) value is always ASCII, and the field visibly shows ASCII as
  the user types.

## Scope — where it applies, where it must not

- **Apply** to semantically English/numeric fields: phone, Toman amounts, card numbers,
  tracking codes, and any numeric ID typed by hand.
- **Do not apply** to free-text fields where the literal characters matter — **passwords**
  (converting a digit in a password changes the secret) and **names/notes** (Persian text is
  valid and expected). Normalizing these would corrupt the value.
- Dates are out of scope here: they go through the Jalali date picker (ADR 0004), which owns
  its own digit handling.

## Consequences

- Every new English/numeric input must opt in with `normalize={normalizeDigits}` — it is not
  automatic. Reviewers should check for it on such fields (this is the analogue of "did you
  convert the date at the edge?" for ADR 0004).
