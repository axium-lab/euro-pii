import { luhnValid, realDate } from '../../core/checksums';
import type { EntityDefinition } from '../../core/types';

/**
 * Sweden, Finland and Poland share a technique worth copying: two identical
 * patterns except for the `\b`. The delimited one scores high, the free one
 * low, so an identifier embedded in a longer string (`ref:8112189876`) is still
 * caught without being trusted the same.
 */

// ── Sweden ──────────────────────────────────────────────────────────────────

const SE_PERSON_PATTERN = String.raw`([0-9]{6,8})([-+]?)[0-9]{4}`;

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

export const SE_PERSONNUMMER: EntityDefinition = {
  name: 'SE_PERSONNUMMER',
  description: 'Swedish personal identity number',
  patterns: [
    {
      name: 'delimited',
      regex: String.raw`\b${SE_PERSON_PATTERN}\b`,
      score: 0.5,
    },
    { name: 'free', regex: SE_PERSON_PATTERN, score: 0.1 },
  ],
  validation: {
    kind: 'checksum',
    run: (_value, raw) => personnummerValid(raw),
  },
  context: ['personnummer', 'personal identity number'],
};

const SE_ORG_PATTERN = String.raw`[0-9]{6}[-]?[0-9]{4}`;

export function organisationsnummerValid(raw: string): boolean {
  const digits = raw.replace(/[^0-9]/g, '');

  if (digits.length !== 10) return false;
  // The third digit of a company number is always 2 or more.
  if (Number(digits[2]) < 2) return false;

  return luhnValid(digits);
}

export const SE_ORGANISATIONSNUMMER: EntityDefinition = {
  name: 'SE_ORGANISATIONSNUMMER',
  description: 'Swedish organisation number',
  patterns: [
    { name: 'delimited', regex: String.raw`\b${SE_ORG_PATTERN}\b`, score: 0.6 },
    { name: 'free', regex: SE_ORG_PATTERN, score: 0.2 },
  ],
  validation: {
    kind: 'checksum',
    run: (_value, raw) => organisationsnummerValid(raw),
  },
  context: ['organisationsnummer', 'organisation number', 'företag'],
};

// ── Finland ─────────────────────────────────────────────────────────────────

/** The separator encodes the century. Three groups, no table needed. */
const century = (separator: string): number | undefined =>
  separator === '+'
    ? 1800
    : '-YXWVU'.includes(separator)
      ? 1900
      : 'ABCDEF'.includes(separator)
        ? 2000
        : undefined;

const FI_CONTROL = '0123456789ABCDEFHJKLMNPRSTUVWXY';

export function hetuValid(raw: string): boolean {
  const text = raw.toUpperCase();
  if (text.length !== 11) return false;

  const base = century(text[6] ?? '');
  if (base === undefined) return false;

  const day = Number(text.slice(0, 2));
  const month = Number(text.slice(2, 4));
  const year = base + Number(text.slice(4, 6));

  // Two traps at once: without resolving the century a two-digit year reads as
  // the 2000s and 290200+ (29 Feb 1800) would pass, and `new Date` normalizes
  // impossible dates instead of failing. `realDate` compares the parts back.
  if (!realDate(year, month, day)) return false;

  const number = Number(text.slice(0, 6) + text.slice(7, 10));

  return FI_CONTROL[number % 31] === text.at(-1);
}

const FI_PATTERN = String.raw`([0-9]{6})([-+ABCDEFYXWVU])([0-9]{3})([0123456789ABCDEFHJKLMNPRSTUVWXY])`;

export const FI_PERSONAL_IDENTITY_CODE: EntityDefinition = {
  name: 'FI_PERSONAL_IDENTITY_CODE',
  description: 'Finnish personal identity code',
  patterns: [
    { name: 'delimited', regex: String.raw`\b${FI_PATTERN}\b`, score: 0.5 },
    { name: 'free', regex: FI_PATTERN, score: 0.1 },
  ],
  validation: { kind: 'checksum', run: (_value, raw) => hetuValid(raw) },
  context: ['henkilötunnus', 'hetu', 'personal identity code'],
};

// ── Poland ──────────────────────────────────────────────────────────────────

export function peselValid(value: string): boolean {
  if (value.length !== 11 || !/^[0-9]+$/.test(value)) return false;

  const WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  const digits = [...value].map(Number);
  const sum = WEIGHTS.reduce(
    (acc, weight, i) => acc + (digits[i] ?? 0) * weight,
    0,
  );

  return (10 - (sum % 10)) % 10 === digits[10];
}

export const PL_PESEL: EntityDefinition = {
  name: 'PL_PESEL',
  description: 'Polish national identification number',
  patterns: [
    {
      // The century lives inside the month group: 01-12 (1900), 21-32 (2000),
      // 41-52 (2100)…
      name: 'pesel',
      regex: String.raw`[0-9]{2}([02468][1-9]|[13579][012])(0[1-9]|1[0-9]|2[0-9]|3[01])[0-9]{5}`,
      score: 0.4,
    },
  ],
  validation: { kind: 'checksum', run: (value) => peselValid(value) },
  context: ['pesel', 'numer pesel'],
};
