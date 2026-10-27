/**
 * Converts spoken numbers to digits: "fifty bags" → "50 bags",
 * "eighteen thousand five hundred" → "18500", "1.5 lakh" → "150000", "18 thousand 500" → "18500".
 */

const SMALL: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fourty: 40,
  fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const SCALES: Record<string, number> = {
  thousand: 1_000, k: 1_000, lakh: 100_000, lakhs: 100_000, lac: 100_000, lacs: 100_000,
  crore: 10_000_000, crores: 10_000_000, million: 1_000_000,
};

const isNumeric = (token: string) => /^\d+(\.\d+)?$/.test(token);
const isNumberWord = (token: string) => token in SMALL || token === "hundred" || token in SCALES || isNumeric(token);

export function wordsToNumbers(text: string): string {
  const tokens = text.replace(/(\d),(?=\d{2})/g, "$1").split(/(\s+|-)/);
  const out: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const word = tokens[i].toLowerCase();
    // A run must start with a number (word or digits); "and" / spaces / hyphens may join its parts.
    if (!(word in SMALL) && !isNumeric(word)) {
      out.push(tokens[i]);
      i++;
      continue;
    }
    let total = 0;
    let current = 0;
    let j = i;
    let lastNumberIndex = i;
    let words = 0;
    while (j < tokens.length) {
      const t = tokens[j].toLowerCase();
      if (/^\s+$|^-$/.test(t) || (t === "and" && words > 0)) {
        j++;
        continue;
      }
      if (!isNumberWord(t)) break;
      // Two plain digit groups in a row ("50 380") are separate numbers, not one.
      if (isNumeric(t) && words > 0 && !/^(thousand|lakhs?|lacs?|crores?|million|k|hundred)$/.test(tokens[lastNumberIndex].toLowerCase())) break;
      if (t in SMALL) current += SMALL[t];
      else if (isNumeric(t)) current += Number(t);
      else if (t === "hundred") current = (current || 1) * 100;
      else {
        total += (current || 1) * SCALES[t];
        current = 0;
      }
      words++;
      lastNumberIndex = j;
      j++;
    }
    out.push(String(Math.round((total + current) * 100) / 100));
    // Keep whatever separated the number from the next word.
    for (let k = lastNumberIndex + 1; k < j; k++) out.push(tokens[k]);
    i = j;
  }
  return out.join("");
}
