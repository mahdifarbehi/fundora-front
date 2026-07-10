// Jalali (Persian-calendar) helpers used ONLY at the display/input edge (ADR 0004) — nothing
// here changes what's stored or sent; the backend stays Gregorian/UTC. Display conversions use
// the browser's built-in Persian calendar (Intl); the date-*input* conversions (Jalali→Gregorian)
// use jalaali-js, the canonical dependency-free algorithm.
//
// Purpose: the fund's `contribution_day` is a *Gregorian* day-of-month, but because the two
// calendars drift, a fixed Gregorian day lands on a small SET of Jalali days across the year.
// We surface that set (and a recommendation) so the user understands what they're picking.

import { toGregorian, toJalaali, isValidJalaaliDate } from "jalaali-js";

/** The six Jalali date-time parts as raw ASCII strings, as edited in a JalaliDateTimeInput. */
export interface JalaliParts {
  jy: string;
  jm: string;
  jd: string;
  hh: string;
  mm: string;
  ss: string;
}

const EMPTY_PARTS: JalaliParts = { jy: "", jm: "", jd: "", hh: "", mm: "", ss: "" };

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/** ISO/UTC string → Jalali date-time parts (using the browser's local wall-clock time). */
export function isoToJalaliParts(iso?: string): JalaliParts {
  if (!iso) return EMPTY_PARTS;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return EMPTY_PARTS;
  const { jy, jm, jd } = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return {
    jy: String(jy),
    jm: String(jm),
    jd: String(jd),
    hh: String(d.getHours()),
    mm: String(d.getMinutes()),
    ss: String(d.getSeconds()),
  };
}

/**
 * Jalali parts → ISO/UTC string, or undefined if the date is incomplete/invalid. The wall-clock
 * time is interpreted in the browser's local timezone (Tehran for the target users), then
 * converted to UTC by toISOString(). `withTime` false ignores the time parts (midnight local).
 */
export function jalaliPartsToIso(p: JalaliParts, withTime: boolean): string | undefined {
  const jy = Number(p.jy);
  const jm = Number(p.jm);
  const jd = Number(p.jd);
  if (!jy || !jm || !jd || !isValidJalaaliDate(jy, jm, jd)) return undefined;
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  const hh = withTime ? clamp(Number(p.hh) || 0, 0, 23) : 0;
  const mm = withTime ? clamp(Number(p.mm) || 0, 0, 59) : 0;
  const ss = withTime ? clamp(Number(p.ss) || 0, 0, 59) : 0;
  const d = new Date(gy, gm - 1, gd, hh, mm, ss);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

const jalaliDayFmt = new Intl.DateTimeFormat("en-US-u-ca-persian", { day: "numeric" });
const jalaliDateFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** Jalali day-of-month for a given Gregorian date. */
export function jalaliDayOfMonth(date: Date): number {
  return Number(jalaliDayFmt.format(date));
}

/** Format an ISO/Date value as a full Jalali date in Persian (e.g. «۱۹ تیر ۱۴۰۵»). Display-only. */
export function formatJalaliDate(input: string | Date): string {
  return jalaliDateFmt.format(new Date(input));
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
