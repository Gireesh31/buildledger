/**
 * Reads a number the way people type or dictate it: "1,200", "₹ 4500", "450 rupees", "12.5 bags",
 * "five hundred", "two lakh fifty thousand", "1.5 crore", "three point five". Shared by the website,
 * the app and the server, so voice typing on a phone keyboard works in every number box.
 */

const ONES: Record<string, number> = {
  zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const SCALES: Record<string, number> = {
  hundred: 100, thousand: 1_000, k: 1_000, lakh: 100_000, lakhs: 100_000, lac: 100_000, lacs: 100_000,
  million: 1_000_000, crore: 10_000_000, crores: 10_000_000, cr: 10_000_000,
};
const SKIP = new Set(["and", "a", "rs", "inr", "rupee", "rupees", "only", "₹"]);

/** Words after the number that only describe it ("bags", "kg", "per ton"): ignored. */
const isUnitTail = (word: string) => /^[a-z]+$/.test(word) && !(word in ONES) && !(word in TENS) && !(word in SCALES) && word !== "point";

export function readNumber(input: string | number | null | undefined): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input !== "string") return null;
  const text = input.toLowerCase().replace(/₹/g, " ₹ ").replace(/,/g, "").replace(/-/g, " ").trim();
  if (!text) return null;

  // Plain digits, the common case (with currency or unit words around them).
  const plain = text.replace(/\b(rs|inr|rupees?|only)\b\.?/g, " ").replace(/₹/g, " ").replace(/\s+/g, " ").trim();
  if (/^\d+(\.\d+)?$/.test(plain)) return Number(plain);
  const lead = plain.match(/^(\d+(?:\.\d+)?)\s*([a-z ]*)$/);
  if (lead) {
    const rest = lead[2].trim().split(/\s+/).filter(Boolean);
    const scale = rest[0] && SCALES[rest[0]];
    if (scale) return Number(lead[1]) * scale; // "2 lakh", "1.5 crore"
    if (rest.every(isUnitTail)) return Number(lead[1]); // "450 bags"
  }

  // Number words, with Indian scales: total of finished groups plus the group being built.
  let total = 0;
  let group = 0;
  let decimals: string | null = null;
  let seen = false;
  const words = plain.split(/\s+/);
  // Unit words may only end the number ("forty two bags"), never sit inside it ("12 bags 4").
  const onlyUnitsFrom = (i: number) => words.slice(i).every((w) => SKIP.has(w) || isUnitTail(w));
  for (const [i, word] of words.entries()) {
    if (SKIP.has(word)) continue;
    if (decimals !== null) {
      const d = ONES[word] ?? (/^\d$/.test(word) ? Number(word) : undefined);
      if (d === undefined || d > 9) {
        if (onlyUnitsFrom(i)) break;
        return null;
      }
      decimals += String(d);
      continue;
    }
    if (word === "point") {
      decimals = "";
      continue;
    }
    if (/^\d+(\.\d+)?$/.test(word)) {
      group += Number(word);
      seen = true;
    } else if (word in ONES) {
      group += ONES[word];
      seen = true;
    } else if (word in TENS) {
      group += TENS[word];
      seen = true;
    } else if (word === "hundred") {
      group = (group || 1) * 100;
      seen = true;
    } else if (word in SCALES) {
      total += (group || 1) * SCALES[word];
      group = 0;
      seen = true;
    } else if (seen && onlyUnitsFrom(i)) {
      break;
    } else {
      return null;
    }
  }
  if (!seen) return null;
  const whole = total + group;
  return decimals ? Number(`${whole}.${decimals}`) : whole;
}

/** For a number box: the dictated text turned into digits ("five hundred" → "500"), or left as it is. */
export function tidyNumberText(raw: string): string {
  if (/^\s*$/.test(raw) || /^\d+(\.\d*)?$/.test(raw.trim())) return raw.trim();
  const n = readNumber(raw);
  return n === null ? raw : String(Math.round(n * 100) / 100);
}
