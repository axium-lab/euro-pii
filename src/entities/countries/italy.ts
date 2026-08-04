import type { EntityDefinition } from '../../core/types';

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

/**
 * The most elaborate pattern of the reference. It encodes the consonant and
 * vowel charsets of surname and given name, plus the month-day with the digit
 * for letter substitution the Italian system uses (L=0, M=1, N=2, P=3…).
 */
const FISCAL_CODE_PATTERN = String.raw`((?:[A-Z][AEIOU][AEIOUX]|[AEIOU]X{2}|[B-DF-HJ-NP-TV-Z]{2}[A-Z]){2}(?:[\dLMNP-V]{2}(?:[A-EHLMPR-T](?:[04LQ][1-9MNP-V]|[15MR][\dLMNP-V]|[26NS][0-8LMNP-U])|[DHPS][37PT][0L]|[ACELMRT][37PT][01LM]|[AC-EHLMPR-T][26NS][9V])|(?:[02468LNQSU][048LQU]|[13579MPRTV][26NS])B[26NS][9V])(?:[A-MZ][1-9MNP-V][\dLMNP-V]{2}|[A-M][0L](?:[1-9MNP-V][\dLMNP-V]|[0L][1-9MNP-V]))[A-Z])`;

export const IT_FISCAL_CODE: EntityDefinition = {
  name: 'IT_FISCAL_CODE',
  description: 'Italian fiscal code',
  patterns: [
    { name: 'codice-fiscale', regex: FISCAL_CODE_PATTERN, score: 0.3 },
  ],
  validation: { kind: 'checksum', run: (value) => fiscalCodeValid(value) },
  context: ['codice fiscale', 'fiscal code', 'cf'],
};

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

export const IT_VAT_CODE: EntityDefinition = {
  name: 'IT_VAT_CODE',
  description: 'Italian VAT code',
  patterns: [
    {
      // Eleven digits with optional spaces or underscores BETWEEN each one.
      // Extremely loose, hence the 0.1: only the checksum makes it usable.
      name: 'partita-iva',
      regex: String.raw`\b([0-9][ _]?){11}\b`,
      score: 0.1,
    },
  ],
  validation: { kind: 'checksum', run: (value) => itVatValid(value) },
  context: ['partita iva', 'vat', 'iva'],
};

// ── the low-score group ─────────────────────────────────────────────────────

export const IT_DRIVER_LICENSE: EntityDefinition = {
  name: 'IT_DRIVER_LICENSE',
  description: 'Italian driving licence number',
  patterns: [
    {
      name: 'licence',
      regex: String.raw`\b(([A-Z]{2}[0-9]{7}[A-Z])|(U1[BCDEFGHLJKMNPRSTUWYXZ0-9]{7}[A-Z]))\b`,
      score: 0.2,
    },
  ],
  context: ['patente', 'driving licence'],
};

/**
 * Collides with IT_PASSPORT and UK_PASSPORT: the paper card, the Italian
 * passport and the British one all match `[A-Z]{2}\d{7}`, and none of the three
 * has a validation to tell them apart. Enable all of them and `AB1234567`
 * yields three detections — the overlap layer picks one, arbitrarily.
 */
export const IT_IDENTITY_CARD: EntityDefinition = {
  name: 'IT_IDENTITY_CARD',
  description: 'Italian identity card number',
  patterns: [
    { name: 'paper', regex: String.raw`\b[A-Z]{2}\s?[0-9]{7}\b`, score: 0.01 },
    { name: 'cie-2', regex: String.raw`\b[0-9]{7}[A-Z]{2}\b`, score: 0.01 },
    {
      name: 'cie-3',
      regex: String.raw`\b[A-Z]{2}[0-9]{5}[A-Z]{2}\b`,
      score: 0.01,
    },
  ],
  context: ['carta di identità', 'identity card'],
};

export const IT_PASSPORT: EntityDefinition = {
  name: 'IT_PASSPORT',
  description: 'Italian passport number',
  patterns: [
    { name: 'passport', regex: String.raw`\b[A-Z]{2}[0-9]{7}\b`, score: 0.01 },
  ],
  context: ['passaporto', 'passport'],
};
