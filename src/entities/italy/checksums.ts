// ── IT_FISCAL_CODE ──────────────────────────────────────────────────────────

/** Alphanumeric position: '0'-'9' -> 0-9 · 'A'-'Z' -> 0-25. */
const idx = (char: string) =>
  char <= '9' ? char.charCodeAt(0) - 48 : char.charCodeAt(0) - 65;

/** Even positions: the value IS the position, no table needed. */
const even = idx;

/**
 * Odd positions: the Italian spec defines an arbitrary table with no formula.
 * Compressed to 26 letters, one per position: the letter at position N encodes
 * the value (A=0, B=1 … Z=25).
 */
const ODD_TABLE = 'BAFHJNPRTVCESULDGIMOQKWZYX';
const odd = (char: string) => ODD_TABLE.charCodeAt(idx(char)) - 65;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function fiscalCodeValid(raw: string): boolean {
  const text = raw.toUpperCase();
  if (!/^[A-Z0-9]{16}$/.test(text)) return false;

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    sum += i % 2 === 0 ? odd(text[i] ?? '0') : even(text[i] ?? '0');
  }

  return LETTERS[sum % 26] === text[15];
}

// ── IT_VAT_CODE ─────────────────────────────────────────────────────────────

/** Luhn-like: odd positions doubled, then the complement mod 10. */
export function itVatValid(raw: string): boolean {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length !== 11) return false;

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const digit = Number(digits[i]);
    if (i % 2 === 0) {
      sum += digit;
    } else {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }

  return (10 - (sum % 10)) % 10 === Number(digits[10]);
}
