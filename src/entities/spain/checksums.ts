import { sanitize } from '../../core/sanitize';
import type { Validation } from '../../core/types';

const CONTROL = 'TRWAGMYFPDXBNJZSQVHLCKE';

/** Check letter of a NIF: CONTROL[digits % 23]. */
export function nifValid(raw: string): Validation {
  const text = sanitize(raw).toUpperCase();
  const digits = text.replace(/[^0-9]/g, '');

  if (digits === '') return false;

  return text.at(-1) === CONTROL[Number(digits) % 23];
}

/** Same maths as the NIF once the prefix becomes a digit: X -> 0, Y -> 1, Z -> 2. */
export function nieValid(raw: string): Validation {
  const text = sanitize(raw).toUpperCase();
  const prefix = text[0];

  if (prefix === undefined || !'XYZ'.includes(prefix)) return false;
  if (text.length < 8 || text.length > 9) return false;
  if (!/^[0-9]+$/.test(text.slice(1, -1))) return false;

  const digits = Number(String('XYZ'.indexOf(prefix)) + text.slice(1, -1));

  return text.at(-1) === CONTROL[digits % 23];
}

/**
 * Organisation letters of a CIF. The control is a letter for P, Q, R, S, N, W,
 * a digit for A, B, E, H, and either one for the rest.
 */
const CIF_LETTER_CONTROL = 'PQRSNW';
const CIF_DIGIT_CONTROL = 'ABEH';

/**
 * Over the 7 digits: odd positions doubled and added digit by digit, even
 * positions added as they are. The control is (10 - sum % 10) % 10, written as
 * itself or as 'JABCDEFGHI'[control].
 */
export function cifValid(raw: string): Validation {
  const text = sanitize(raw).toUpperCase();

  if (!/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/.test(text)) return false;

  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = Number(text[i + 1]);
    if (i % 2 === 0) {
      const doubled = digit * 2;
      sum += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      sum += digit;
    }
  }

  const control = (10 - (sum % 10)) % 10;
  const letter = text[0] ?? '';
  const last = text.at(-1) ?? '';
  const asDigit = last === String(control);
  const asLetter = last === 'JABCDEFGHI'[control];

  if (CIF_LETTER_CONTROL.includes(letter)) return asLetter;
  if (CIF_DIGIT_CONTROL.includes(letter)) return asDigit;

  return asDigit || asLetter;
}

/**
 * `ES` plus a NIF, a NIE or a CIF: the first character after the prefix says
 * which of the three checksums applies.
 */
export function vatValid(raw: string): Validation {
  const text = sanitize(raw).toUpperCase().replace(/^ES/, '');
  const first = text[0] ?? '';

  if (/[0-9]/.test(first)) return nifValid(text);
  if ('XYZ'.includes(first)) return nieValid(text);

  return cifValid(text);
}

/**
 * Province (2) + number (8) + control (2). The control is mod 97 over the
 * province followed by the number, except that a number below 10,000,000 is
 * glued to the province without its leading zero.
 *
 * Takes the raw match: the NUSS is usually written `28/12345678/40`, and
 * `sanitize` does not strip slashes.
 */
export function nussValid(raw: string): Validation {
  const digits = raw.replace(/[^0-9]/g, '');

  if (digits.length !== 12) return false;

  const province = Number(digits.slice(0, 2));
  const number = Number(digits.slice(2, 10));
  const base =
    number < 10_000_000
      ? province * 10_000_000 + number
      : province * 100_000_000 + number;

  return base % 97 === Number(digits.slice(10));
}

/** Mod 11 with weights ending at the check digit: 10 -> 1, 11 -> 0. */
function cccControl(digits: string): number {
  const WEIGHTS = [1, 2, 4, 8, 5, 10, 9, 7, 3, 6];
  const offset = WEIGHTS.length - digits.length;
  let sum = 0;

  for (let i = 0; i < digits.length; i++) {
    sum += Number(digits[i]) * (WEIGHTS[i + offset] ?? 0);
  }

  const control = 11 - (sum % 11);
  if (control === 11) return 0;
  if (control === 10) return 1;
  return control;
}

/**
 * Bank (4) + branch (4) + control (2) + account (10). The first control digit
 * covers bank and branch, the second one the account.
 */
export function cccValid(raw: string): Validation {
  const text = sanitize(raw);

  if (!/^[0-9]{20}$/.test(text)) return false;

  return (
    cccControl(text.slice(0, 8)) === Number(text[8]) &&
    cccControl(text.slice(10)) === Number(text[9])
  );
}
