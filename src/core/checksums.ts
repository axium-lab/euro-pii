/**
 * Check-digit algorithms shared by several entities. Every function here
 * receives the value already sanitized (no spaces, no dashes).
 */

/** Alphanumeric weight: '0'-'9' -> 0-9, 'A'-'Z' -> 10-35. */
export function alphaValue(char: string): number {
  return char >= '0' && char <= '9'
    ? Number(char)
    : char.toUpperCase().charCodeAt(0) - 55;
}

/** Used by CREDIT_CARD and both Swedish numbers. */
export function luhnValid(digits: string): boolean {
  if (digits === '') return false;

  const reversed = [...digits].reverse();
  let sum = 0;

  for (let i = 0; i < reversed.length; i++) {
    const digit = Number(reversed[i]);
    if (Number.isNaN(digit)) return false;

    if (i % 2 === 1) {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    } else {
      sum += digit;
    }
  }

  return sum % 10 === 0;
}

/**
 * Remainder mod 97 by blocks.
 *
 * An IBAN turns into a 26-digit number, well past Number.MAX_SAFE_INTEGER.
 * `Number(...) % 97` returns a wrong answer in silence; this never overflows
 * because the running remainder never exceeds 96.
 */
export function mod97(numeric: string): number {
  let remainder = 0;

  for (const char of numeric) {
    remainder = (remainder * 10 + Number(char)) % 97;
  }

  return remainder;
}

/**
 * ISO 7064 Mod 11,10, for any length: the last digit is the check digit.
 *
 * Length-agnostic on purpose. The German tax id is 11 digits and the German VAT
 * id is 9, and hardcoding 11 here meant no VAT id could ever be confirmed. The
 * extra rules of the tax id (no leading zero, no digit more than three times)
 * belong to that entity, not to the algorithm.
 */
export function iso7064Mod1110(text: string): boolean {
  if (text.length < 2 || !/^[0-9]+$/.test(text)) return false;

  const digits = [...text].map(Number);
  const last = digits.length - 1;

  let product = 10;
  for (let i = 0; i < last; i++) {
    let total = ((digits[i] ?? 0) + product) % 10;
    if (total === 0) total = 10;
    product = (total * 2) % 11;
  }

  let check = 11 - product;
  if (check === 10) check = 0;

  return check === digits[last];
}

/** The extra rules the German tax id adds on top of ISO 7064 Mod 11,10. */
export function deTaxIdValid(text: string): boolean {
  if (text.length !== 11 || text.startsWith('0')) return false;
  if (!/^[0-9]+$/.test(text)) return false;

  // Rule that is easy to miss: no digit may repeat more than three times.
  const counts = new Map<string, number>();
  for (const digit of text.slice(0, 10)) {
    counts.set(digit, (counts.get(digit) ?? 0) + 1);
  }
  if (Math.max(...counts.values()) > 3) return false;

  return iso7064Mod1110(text);
}

/** ICAO weights 7,3,1 over the first 8 characters. DE_ID_CARD and DE_PASSPORT. */
export function icao731Valid(text: string): boolean {
  if (text.length < 9) return false;

  const WEIGHTS = [7, 3, 1];
  let total = 0;

  for (let i = 0; i < 8; i++) {
    total += alphaValue(text[i] ?? '0') * (WEIGHTS[i % 3] ?? 1);
  }

  return total % 10 === Number(text.at(-1));
}

/** Weighted sum mod 10 against a trailing check digit. */
export function weightedMod10(
  text: string,
  weights: readonly number[],
  checkIndex: number,
): boolean {
  if (text.length <= checkIndex || !/^[0-9]+$/.test(text)) return false;

  const sum = weights.reduce(
    (acc, weight, i) => acc + Number(text[i] ?? 0) * weight,
    0,
  );

  return sum % 10 === Number(text[checkIndex]);
}

/**
 * Calendar check that does not trust the Date constructor.
 *
 * `new Date(Date.UTC(1800, 1, 29))` does not throw on an impossible date, it
 * normalizes it to March 1st. The three components have to be compared back.
 */
export function realDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
