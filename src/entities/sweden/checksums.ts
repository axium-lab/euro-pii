import { luhnValid } from '../../core/checksums';

export function personnummerValid(raw: string): boolean {
  const digits = raw.replace(/[^0-9]/g, '');
  const core = digits.length === 12 ? digits.slice(2) : digits;

  if (core.length !== 10) return false;

  const month = Number(core.slice(2, 4));
  // Coordination numbers add 60 to the day, so the range check allows for it.
  const day = Number(core.slice(4, 6));
  const realDay = day > 60 ? day - 60 : day;

  if (month < 1 || month > 12) return false;
  if (realDay < 1 || realDay > 31) return false;

  return luhnValid(core);
}

export function organisationsnummerValid(raw: string): boolean {
  const digits = raw.replace(/[^0-9]/g, '');

  if (digits.length !== 10) return false;
  // The third digit of a company number is always 2 or more.
  if (Number(digits[2]) < 2) return false;

  return luhnValid(digits);
}
