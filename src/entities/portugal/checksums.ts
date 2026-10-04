import { alphaValue } from '../../core/checksums';
import type { Validation } from '../../core/types';

/**
 * Civil id (8) + its check digit (1) + version letters (2) + final check (1).
 * Luhn over all twelve characters, with letters worth 10-35: from the right,
 * every second value is doubled and loses 9 when it passes 9.
 */
export function citizenCardValid(raw: string): Validation {
  const text = raw.replace(/[^0-9A-Z]/gi, '').toUpperCase();

  if (!/^[0-9]{9}[A-Z0-9]{2}[0-9]$/.test(text)) return false;

  let sum = 0;
  [...text].reverse().forEach((char, i) => {
    const value = alphaValue(char);
    if (i % 2 === 1) {
      const doubled = value * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    } else {
      sum += value;
    }
  });

  return sum % 10 === 0;
}
