// Persian/Arabic → ASCII digit normalization.
//
// The Persian keyboard produces Persian digits (۰–۹, U+06F0–U+06F9); some inputs paste
// Arabic-Indic digits (٠–٩, U+0660–U+0669). Any field whose value must be English/ASCII
// for the backend — phone, money amounts (Toman), card numbers, tracking codes — must be
// normalized to ASCII at the input boundary, before validation or sending. See ADR 0007.
//
// NOT for free-text fields where the literal characters matter (passwords, names): converting
// those would corrupt the value. Apply only to fields that are semantically English/numeric.

const PERSIAN_ZERO = 0x06f0;
const ARABIC_ZERO = 0x0660;
const ASCII_ZERO = 0x30;

/** Convert any Persian/Arabic-Indic digits in a string to ASCII 0–9. Other chars untouched. */
export function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - PERSIAN_ZERO))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - ARABIC_ZERO));
}

/** Convert ASCII digits in a string/number to Persian numerals — display-only. */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) =>
    String.fromCharCode(PERSIAN_ZERO + (d.charCodeAt(0) - ASCII_ZERO)),
  );
}

/**
 * Drop-in `normalize` for an Ant Design `Form.Item` on an English/numeric field. Runs on
 * every change so the stored (and later validated + submitted) value is always ASCII, and
 * the field visibly shows ASCII as the user types. Tolerates non-string values.
 */
export const normalizeDigits = (value: unknown): unknown =>
  typeof value === "string" ? toEnglishDigits(value) : value;
