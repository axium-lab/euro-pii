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
