import type { Validation } from '../../core/types';

const digitsOf = (raw: string) => raw.replace(/[^0-9]/g, '');

/** The last two digits are 97 minus the rest mod 97. A result of 0 never occurs. */
function mod97Key(body: string, key: string): boolean {
  return 97 - (Number(body) % 97) === Number(key);
}

/**
 * Birth date (6) + sequence (3) + key (2). For someone born in 2000 or later
 * the key is computed with a `2` in front of the nine digits, so both readings
 * are tried. `Number` is safe: ten digits stay far below 2^53.
 */
export function nationalNumberValid(raw: string): Validation {
  const digits = digitsOf(raw);

  if (digits.length !== 11) return false;

  const body = digits.slice(0, 9);
  const key = digits.slice(9);

  return mod97Key(body, key) || mod97Key(`2${body}`, key);
}

/**
 * Enterprise number: a leading 0 or 1, then eight digits and a mod 97 key.
 * Also the core of `BE_VAT_ID`.
 */
export function enterpriseNumberValid(raw: string): Validation {
  const digits = digitsOf(raw.replace(/^BE/i, ''));

  if (!/^[01][0-9]{9}$/.test(digits)) return false;

  return mod97Key(digits.slice(0, 8), digits.slice(8));
}

/**
 * eID card number: ten digits and a two-digit key, the ten digits mod 97. Here
 * a remainder of 0 is written as 97.
 */
export function eidCardValid(raw: string): Validation {
  const digits = digitsOf(raw);

  if (digits.length !== 12) return false;

  const remainder = Number(digits.slice(0, 10)) % 97;

  return (remainder === 0 ? 97 : remainder) === Number(digits.slice(10));
}
