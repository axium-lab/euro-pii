import { alphaValue, mod97 } from '../../core/checksums';
import type { Validation } from '../../core/types';

/**
 * "11-proef" over nine digits: weights 9 down to 2, and -1 for the last one.
 * The total has to be a multiple of 11.
 */
function elevenProof(digits: string): boolean {
  if (!/^[0-9]{9}$/.test(digits) || Number(digits) === 0) return false;

  let sum = 0;
  for (let i = 0; i < 8; i++) sum += Number(digits[i]) * (9 - i);
  sum -= Number(digits[8]);

  return sum % 11 === 0;
}

/**
 * `NL` + nine digits + `B` + two digits. Company numbers (from the RSIN) pass
 * the 11-proef on their nine digits. The btw-id of a sole trader, issued since
 * 2020, passes ISO 7064 mod 97-10 over the whole string instead, letters
 * included (N = 23, L = 21, B = 11).
 */
export function nlVatValid(raw: string): Validation {
  const text = raw.replace(/[^0-9A-Z]/gi, '').toUpperCase();

  if (!/^NL[0-9]{9}B[0-9]{2}$/.test(text)) return false;
  if (Number(text.slice(12)) === 0) return false;

  if (elevenProof(text.slice(2, 11))) return true;

  const numeric = [...text].map((char) => String(alphaValue(char))).join('');

  return mod97(numeric) === 1;
}
