// Toman is the single money unit — always an integer on the wire (CONTEXT). Formatting is
// display-only: we send/receive raw integers and only group + Persian-numeralize for the
// screen. `Intl.NumberFormat('fa-IR')` gives both grouping and Persian digits for free.

const faNumber = new Intl.NumberFormat("fa-IR");

/** Group + Persian-numeralize a plain integer (counts, day-of-month, etc.). */
export function formatNumber(value: number): string {
  return faNumber.format(value);
}

/** A Toman amount for display: grouped Persian numerals + the «تومان» unit. */
export function formatToman(value: number): string {
  return `${faNumber.format(value)} تومان`;
}
