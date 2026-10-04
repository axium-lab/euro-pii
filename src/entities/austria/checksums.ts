import type { Validation } from '../../core/types';

/**
 * Serial (3) + check digit (1) + birth date DDMMYY (6). Weights 3 7 9 over the
 * serial and 5 8 4 2 1 6 over the date, mod 11. A remainder of 10 is never
 * issued, so it can only be a typo.
 */
export function svnrValid(raw: string): Validation {
  const digits = raw.replace(/[^0-9]/g, '');

  if (!/^[1-9][0-9]{9}$/.test(digits)) return false;

  const WEIGHTS = [3, 7, 9, 0, 5, 8, 4, 2, 1, 6];
  const sum = WEIGHTS.reduce((acc, w, i) => acc + Number(digits[i]) * w, 0);
  const check = sum % 11;

  return check !== 10 && check === Number(digits[3]);
}

/**
 * `ATU` + seven digits + a check digit. The check is 6 minus the Luhn sum of
 * the seven digits, mod 10: from the right, the 2nd, 4th and 6th digits are
 * doubled and lose 9 when they pass 9.
 */
export function uidValid(raw: string): Validation {
  const digits = raw.replace(/[^0-9]/g, '');

  if (digits.length !== 8) return false;

  let sum = 0;
  [...digits.slice(0, 7)].reverse().forEach((char, i) => {
    const digit = Number(char);
    if (i % 2 === 1) {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    } else {
      sum += digit;
    }
  });

  return (((6 - sum) % 10) + 10) % 10 === Number(digits[7]);
}

/** Check letters of a Firmenbuchnummer, indexed by the weighted sum mod 17. */
const FN_LETTERS = 'abdfghikmpstvwxyz';

/**
 * Up to six digits, right-aligned with zeros, weights 6 4 14 15 10 1, mod 17.
 * Checked against real entries: `FN 33209m` and `FN 93363z`.
 */
export function firmenbuchValid(raw: string): Validation {
  const text = raw.replace(/^FN/i, '').replace(/[^0-9a-z]/gi, '').toLowerCase();
  const match = /^([0-9]{1,6})([a-z])$/.exec(text);

  if (match === null) return false;

  const digits = (match[1] ?? '').padStart(6, '0');
  const WEIGHTS = [6, 4, 14, 15, 10, 1];
  const sum = WEIGHTS.reduce((acc, w, i) => acc + Number(digits[i]) * w, 0);

  return FN_LETTERS[sum % 17] === match[2];
}
