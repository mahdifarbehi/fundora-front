// Jalali (Persian-calendar) helpers used ONLY at the display edge (ADR 0004) — nothing here
// changes what's stored or sent; the backend stays Gregorian. Conversion uses the browser's
// built-in Persian calendar (Intl), so no dependency is needed for pure day-of-month math.
//
// Purpose: the fund's `contribution_day` is a *Gregorian* day-of-month, but because the two
// calendars drift, a fixed Gregorian day lands on a small SET of Jalali days across the year.
// We surface that set (and a recommendation) so the user understands what they're picking.

const jalaliDayFmt = new Intl.DateTimeFormat("en-US-u-ca-persian", { day: "numeric" });

/** Jalali day-of-month for a given Gregorian date. */
export function jalaliDayOfMonth(date: Date): number {
  return Number(jalaliDayFmt.format(date));
}

/**
 * The distinct Jalali day-of-month values a fixed Gregorian day-of-month falls on across the
 * next 12 months (sorted). Usually 3–4 values; a "wrapping" day (near a Jalali month boundary)
 * returns both small and large values (e.g. {1, 2, 30, 31}).
 */
export function jalaliDayPossibilities(gregorianDay: number, from: Date = new Date()): number[] {
  const set = new Set<number>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + i, gregorianDay));
    set.add(jalaliDayOfMonth(d));
  }
  return [...set].sort((a, b) => a - b);
}

/** True if a Gregorian day straddles a Jalali month boundary (lands on both early and late days). */
export function wrapsJalaliMonth(possibilities: number[]): boolean {
  if (possibilities.length === 0) return false;
  return possibilities[possibilities.length - 1] - possibilities[0] > 4;
}

/**
 * A recommended Gregorian contribution day (1–28) that lands as close to the start of the
 * Jalali month as possible without wrapping to the previous month's end. Returns the day and
 * its Jalali possibilities. Computed against `from` so it stays correct across leap cycles.
 */
export function recommendedContributionDay(from: Date = new Date()): {
  day: number;
  possibilities: number[];
} {
  let best: { day: number; possibilities: number[] } | null = null;
  for (let day = 1; day <= 28; day++) {
    const possibilities = jalaliDayPossibilities(day, from);
    if (wrapsJalaliMonth(possibilities)) continue; // skip month-boundary-straddling days
    const latest = possibilities[possibilities.length - 1];
    if (!best || latest < best.possibilities[best.possibilities.length - 1]) {
      best = { day, possibilities };
    }
  }
  // Fallback (should never happen): the middle of the month never wraps.
  return best ?? { day: 15, possibilities: jalaliDayPossibilities(15, from) };
}
