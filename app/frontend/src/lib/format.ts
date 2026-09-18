/** Parse "YYYY-MM-DD" as a local calendar date (no UTC shift). */
export function parseDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayISO() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// The UI copy is English, so dates are too (otherwise a Russian browser gets "20 нояб." next to "Planned").
const LOCALE = "en-GB";

const dateFormatter = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric" });
const longFormatter = new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export const formatDate = (iso: string) => dateFormatter.format(parseDate(iso));
export const formatLongDate = (iso: string) => longFormatter.format(parseDate(iso));

export function dateParts(iso: string) {
  const date = parseDate(iso);
  return {
    day: date.getDate(),
    month: date.toLocaleString(LOCALE, { month: "short" }),
    year: date.getFullYear(),
  };
}

const relative = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

export function relativeDay(iso: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const days = Math.round((parseDate(iso).getTime() - start.getTime()) / 86_400_000);
  const abs = Math.abs(days);
  if (abs < 14) return relative.format(days, "day");
  if (abs < 60) return relative.format(Math.round(days / 7), "week");
  if (abs < 365) return relative.format(Math.round(days / 30), "month");
  return relative.format(Math.round(days / 365), "year");
}

export function formatCoords(lat: number, lng: number) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`;
}

export function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
