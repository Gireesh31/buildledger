import { wordsToNumbers } from "@/lib/number-words";

/**
 * Turns free text (a voice transcript or OCR text from a bill) into material form values.
 * Keyword and pattern matching only; whatever it can't find stays empty for the user to fill.
 */

export const UNIT_WORDS: Record<string, string> = {
  bag: "bag",
  bags: "bag",
  kg: "kg",
  kgs: "kg",
  kilo: "kg",
  kilos: "kg",
  ton: "ton",
  tons: "ton",
  tonne: "ton",
  tonnes: "ton",
  mt: "ton",
  brass: "brass",
  load: "load",
  loads: "load",
  trip: "load",
  trips: "load",
  piece: "nos",
  pieces: "nos",
  pcs: "nos",
  nos: "nos",
  no: "nos",
  numbers: "nos",
  litre: "litre",
  litres: "litre",
  liter: "litre",
  liters: "litre",
  ltr: "litre",
  cft: "cft",
  "cubic feet": "cft",
  "sq ft": "sqft",
  sqft: "sqft",
  "square feet": "sqft",
  rft: "rft",
  "running feet": "rft",
};

const UNIT_PATTERN = Object.keys(UNIT_WORDS)
  .sort((a, b) => b.length - a.length)
  .map((u) => u.replace(" ", "\\s*"))
  .join("|");

export const MATERIAL_KEYWORDS: [string, RegExp][] = [
  ["cement", /\b(cement|opc|ppc|ultratech|acc|ramco|dalmia|birla)\b/],
  ["steel", /\b(steel|tmt|rod|rods|bar|bars|fe\s?500|fe\s?550|binding wire)\b/],
  ["sand", /\b(sand|m-?sand|p-?sand|river sand)\b/],
  ["aggregate", /\b(aggregate|jelly|jalli|gravel|metal|20\s?mm|40\s?mm|6\s?mm|12\s?mm)\b/],
  ["bricks", /\b(bricks?|blocks?|aac|hollow block|solid block|fly ?ash)\b/],
  ["wood", /\b(wood|plywood|ply|timber|teak|door frame|shuttering)\b/],
  ["electrical", /\b(wires?|cables?|switch(es)?|mcb|conduit|electrical)\b/],
  ["plumbing", /\b(pipes?|pvc|cpvc|upvc|fittings?|tap|valve|plumbing)\b/],
  ["paint", /\b(paint|primer|putty|emulsion|enamel|asian paints|berger)\b/],
  ["tiles", /\b(tiles?|granite|marble|vitrified|kota)\b/],
];

export interface MaterialValues {
  paymentMode?: string;
  category?: string;
  unit?: string;
  quantity?: string;
  unitPrice?: string;
  date?: string;
}

const NUM = String.raw`(\d+(?:\.\d+)?)`;
const CURRENCY = String.raw`(?:₹|rs\.?|inr|rupees?)`;

/** Lowercase, spoken numbers to digits, drop thousands separators, expand "24 thousand" / "1.5 lakh". */
function normalise(text: string): string {
  return wordsToNumbers(text)
    .toLowerCase()
    .replace(/(\d),(?=\d)/g, "$1")
    .replace(/(\d+(?:\.\d+)?)\s*(thousand|k\b)/g, (_, n) => String(Number(n) * 1_000))
    .replace(/(\d+(?:\.\d+)?)\s*(lakhs?|lacs?)/g, (_, n) => String(Number(n) * 100_000));
}

const clean = (n: number) => String(Math.round(n * 100) / 100);

const PAYMENT_KEYWORDS: [string, RegExp][] = [
  ["upi", /\b(upi|gpay|google pay|phone ?pe|paytm|bhim)\b/],
  ["netbanking", /\b(net ?banking|neft|rtgs|imps|bank transfer|online transfer)\b/],
  ["cheque", /\b(cheque|check|chq)\b/],
  ["cash", /\bcash\b/],
];

/** "paid by UPI", "cash", "NEFT" → payment mode. */
export function findPaymentMode(text: string): string | undefined {
  const lower = text.toLowerCase();
  return PAYMENT_KEYWORDS.find(([, pattern]) => pattern.test(lower))?.[0];
}

export function findCategory(text: string): string | undefined {
  const lower = text.toLowerCase();
  return MATERIAL_KEYWORDS.find(([, pattern]) => pattern.test(lower))?.[0];
}

function findQuantity(lower: string): { quantity: string; unit: string } | undefined {
  const match = lower.match(new RegExp(`${NUM}\\s*(${UNIT_PATTERN})\\b`));
  if (!match) return undefined;
  return { quantity: match[1], unit: UNIT_WORDS[match[2].replace(/\s+/g, " ")] ?? UNIT_WORDS[match[2].replace(/\s+/g, "")] };
}

/**
 * Speech like "cement 50 bags at 380 rupees per bag", "sand 3 loads total 36 thousand",
 * "bricks 5000 nos 9 rupees each".
 */
export function parseMaterialSpeech(transcript: string): MaterialValues {
  const lower = normalise(transcript);
  const result: MaterialValues = { category: findCategory(lower), paymentMode: findPaymentMode(lower) };
  const qty = findQuantity(lower);
  if (qty) Object.assign(result, qty);

  const perUnit =
    lower.match(new RegExp(`(?:at|@|rate|price|cost)\\s*(?:of\\s*|is\\s*)?${CURRENCY}?\\s*${NUM}`)) ??
    lower.match(new RegExp(`${CURRENCY}?\\s*${NUM}\\s*${CURRENCY}?\\s*(?:per|each|a|an|/)\\b`));
  const total = lower.match(new RegExp(`(?:total|for|amount|altogether)\\s*(?:of\\s*|is\\s*)?${CURRENCY}?\\s*${NUM}`));

  if (perUnit) {
    result.unitPrice = perUnit[1];
  } else if (total && result.quantity && Number(result.quantity) > 0) {
    result.unitPrice = clean(Number(total[1]) / Number(result.quantity));
  } else {
    // A lone price with no "per" or "total": treat it as the price of one unit.
    const money = lower.match(new RegExp(`${CURRENCY}\\s*${NUM}|${NUM}\\s*${CURRENCY}`));
    if (money) result.unitPrice = money[1] ?? money[2];
  }
  return result;
}

const DATE_RE = /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/;

/** dd/mm/yyyy (Indian bills) → yyyy-mm-dd, if it's a real date. */
function parseBillDate(text: string): string | undefined {
  for (const match of text.matchAll(new RegExp(DATE_RE, "g"))) {
    const [, d, m, y] = match;
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    const day = Number(d);
    const month = Number(m);
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000 || year > 2100) continue;
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (!Number.isNaN(Date.parse(iso))) return iso;
  }
  return undefined;
}

/** Common OCR misreads inside numbers: "38O" → "380", "l9250" → "19250", "1 9,250" stays as is. */
function fixOcrDigits(line: string): string {
  return line.replace(/\b[\dOoIl|SB.,]*\d[\dOoIl|SB.,]*\b/g, (token) =>
    token.replace(/[Oo]/g, "0").replace(/[Il|]/g, "1").replace(/S/g, "5").replace(/B/g, "8"),
  );
}

/**
 * Numbers that could be a quantity, rate or amount. Dates, percentages, phone numbers,
 * GSTINs and invoice numbers are removed first so they're never mistaken for prices.
 */
function moneyNumbers(line: string): number[] {
  const stripped = line
    .replace(new RegExp(DATE_RE, "g"), " ")
    .replace(/\b\d+(\.\d+)?\s*%/g, " ")
    .replace(/\b\d{2}[a-z]{5}\d{4}[a-z]\d[a-z\d]{2}\b/g, " ") // GSTIN
    .replace(/\b(?:inv(?:oice)?|bill|no|sl|s\.no|hsn|sac|ph|mob(?:ile)?|gst(?:in)?)\.?\s*[:#.]?\s*\d+/g, " ")
    .replace(/\b\d{9,}\b/g, " "); // phone / account numbers
  return [...stripped.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
}

const close = (a: number, b: number) => Math.abs(a - b) <= Math.max(1, b * 0.01);

/** First q, r, a (in reading order) with q × r ≈ a, i.e. a quantity × rate = amount row. */
function findLineItem(nums: number[]): { quantity: number; rate: number; amount: number } | undefined {
  for (let k = nums.length - 1; k >= 2; k--) {
    const amount = nums[k];
    if (amount < 10) continue;
    for (let i = 0; i < k; i++) {
      for (let j = i + 1; j < k; j++) {
        const [q, r] = [nums[i], nums[j]];
        if (q > 0 && r > 0 && q <= 100_000 && close(q * r, amount)) return { quantity: q, rate: r, amount };
      }
    }
  }
  return undefined;
}

export interface BillValues extends MaterialValues {
  /** The bill's total, when quantity and rate couldn't both be found. */
  billTotal?: string;
  matchedLine?: string;
}

/**
 * OCR text from a bill photo. Looks for quantity × rate ≈ amount on the item's line or the
 * lines just after it, then falls back to "Qty 50" / "50 bags", "Rate 380" / "@ 380" and the bill total.
 */
export function parseMaterialBill(ocrText: string): BillValues {
  const lines = ocrText
    .split(/\r?\n/)
    .map((l) => normalise(fixOcrDigits(l)).trim())
    .filter(Boolean);
  const whole = lines.join("\n");
  const result: BillValues = { date: parseBillDate(whole), paymentMode: findPaymentMode(whole) };

  const itemIndexes = lines.flatMap((l, i) => (findCategory(l) ? [i] : []));
  // Item rows first (alone, then with the next two lines, since OCR often splits a row); then every line.
  const windows = [
    ...itemIndexes.map((i) => [i]),
    ...itemIndexes.map((i) => [i, i + 1, i + 2].filter((n) => n < lines.length)),
    ...lines.map((_, i) => [i]),
    ...lines.map((_, i) => [i, i + 1].filter((n) => n < lines.length)),
  ];
  for (const window of windows) {
    const text = window.map((i) => lines[i]).join(" ");
    const item = findLineItem(moneyNumbers(text));
    if (!item) continue;
    // Whichever number sits next to a unit word ("50 bags") is the quantity.
    const unitQty = findQuantity(text);
    const swap = unitQty && close(Number(unitQty.quantity), item.rate) && !close(Number(unitQty.quantity), item.quantity);
    result.quantity = clean(swap ? item.rate : item.quantity);
    result.unitPrice = clean(swap ? item.quantity : item.rate);
    result.unit = unitQty?.unit;
    result.category = findCategory(text);
    result.matchedLine = text;
    break;
  }

  if (!result.quantity) {
    const labelledQty = whole.match(/\b(?:qty|quantity|nos?)\b\.?\s*[:\-]?\s*(\d+(?:\.\d+)?)/);
    const unitQty = findQuantity(itemIndexes.map((i) => lines[i]).join("\n")) ?? findQuantity(whole);
    if (unitQty) Object.assign(result, unitQty);
    else if (labelledQty) result.quantity = labelledQty[1];

    const rate = whole.match(/(?:\brate\b|@)\s*[:\-]?\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)/);
    if (rate && Number(rate[1]) > 0) result.unitPrice = clean(Number(rate[1]));

    const totals = lines
      .filter((l) => /(grand\s*total|net\s*(amount|total|payable)|total\s*amount|amount\s*payable|\btotal\b|\bamount\b)/.test(l))
      .flatMap(moneyNumbers)
      .filter((n) => n >= 10);
    const total = totals.length > 0 ? Math.max(...totals) : undefined;

    if (!result.unitPrice && total && result.quantity && Number(result.quantity) > 0) {
      result.unitPrice = clean(total / Number(result.quantity));
    } else if (!result.quantity && result.unitPrice && total) {
      const qty = total / Number(result.unitPrice);
      if (Math.abs(qty - Math.round(qty * 100) / 100) < 0.01) result.quantity = clean(qty);
    }
    if (total && !(result.quantity && result.unitPrice)) result.billTotal = clean(total);
  }

  result.category ??= findCategory(itemIndexes.map((i) => lines[i]).join("\n") || whole);
  result.unit ??= (findQuantity(itemIndexes.map((i) => lines[i]).join("\n")) ?? findQuantity(whole))?.unit;
  return result;
}
