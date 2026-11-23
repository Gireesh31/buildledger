/**
 * Sign-ups over time for the admin overview graph, shared by the website and the app.
 * Days and months are counted in India time, where BuildLedger's users are.
 */

export interface SignupPoint {
  /** "2026-11-23" for a day, "2026-11" for a month. */
  key: string;
  /** Short label for the axis, e.g. "23 Nov" or "Nov ’26". */
  label: string;
  /** People who signed up in this day or month. */
  count: number;
  /** Everyone signed up by the end of it. */
  total: number;
}

export interface SignupSeries {
  daily: SignupPoint[];
  monthly: SignupPoint[];
}

const TZ = "Asia/Kolkata";
const dayKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Builds the last `days` days and the last `months` months from every account's sign-up time. */
export function signupSeries(createdAt: string[], now = new Date(), days = 30, months = 12): SignupSeries {
  const keys = createdAt.map((iso) => dayKey(new Date(iso))).sort();
  const today = dayKey(now);

  const dayKeys: string[] = [];
  for (let i = days - 1; i >= 0; i--) dayKeys.push(dayKey(new Date(now.getTime() - i * 86_400_000)));
  const daily = dayKeys.map((key) => {
    const [, m, d] = key.split("-");
    return {
      key,
      label: key === today ? "Today" : `${Number(d)} ${MONTHS[Number(m) - 1]}`,
      count: keys.filter((k) => k === key).length,
      total: keys.filter((k) => k <= key).length,
    };
  });

  const [ty, tm] = today.split("-").map(Number);
  const monthly: SignupPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const index = ty * 12 + (tm - 1) - i;
    const y = Math.floor(index / 12);
    const m = (index % 12) + 1;
    const key = `${y}-${String(m).padStart(2, "0")}`;
    monthly.push({
      key,
      label: `${MONTHS[m - 1]} ’${String(y).slice(2)}`,
      count: keys.filter((k) => k.startsWith(key)).length,
      total: keys.filter((k) => k.slice(0, 7) <= key).length,
    });
  }
  return { daily, monthly };
}

/** "23 Nov 2026" or "November 2026", for tooltips. */
export function signupPointTitle(point: SignupPoint): string {
  const [y, m, d] = point.key.split("-");
  const month = MONTHS[Number(m) - 1];
  return d ? `${Number(d)} ${month} ${y}` : `${month} ${y}`;
}
