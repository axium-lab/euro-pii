import type { EntityDefinition, Validation } from '../../core/types';

// ── UK_NHS ──────────────────────────────────────────────────────────────────

/** Modulo 11 with multipliers 10, 9, 8 … 1. */
export function nhsValid(value: string): boolean {
  if (value.length !== 10 || !/^[0-9]+$/.test(value)) return false;

  let total = 0;
  for (let i = 0; i < 10; i++) total += Number(value[i]) * (10 - i);

  return total % 11 === 0;
}

export const UK_NHS: EntityDefinition = {
  name: 'UK_NHS',
  description: 'UK National Health Service number',
  patterns: [
    {
      name: 'nhs',
      regex: String.raw`\b([0-9]{3})[- ]?([0-9]{3})[- ]?([0-9]{4})\b`,
      score: 0.5,
    },
  ],
  validation: { kind: 'checksum', run: (value) => nhsValid(value) },
  context: ['nhs', 'national health service', 'health service number'],
};

// ── UK_NINO ─────────────────────────────────────────────────────────────────

/**
 * The best built pattern of the whole reference: the entire specification lives
 * inside the regex, so there is nothing left to validate afterwards. The
 * negative lookahead drops the forbidden prefixes, each letter class excludes
 * the letters that position never takes, and the suffix can only be A-D.
 */
export const UK_NINO: EntityDefinition = {
  name: 'UK_NINO',
  description: 'UK National Insurance number',
  patterns: [
    {
      name: 'nino',
      // The source pattern opens with an optional space after the `\b`, which
      // pulls the preceding space INTO the match: masking `NINO AB123456C` then
      // produces `NINO<UK_NINO_1>`. Dropped here, the internal ones stay so
      // `AB 12 34 56 C` still matches.
      regex: String.raw`\b(?!bg|gb|nk|kn|nt|tn|zz|BG|GB|NK|KN|NT|TN|ZZ)([a-ceghj-pr-tw-zA-CEGHJ-PR-TW-Z]{1}[a-ceghj-npr-tw-zA-CEGHJ-NPR-TW-Z]{1}) ?([0-9]{2}) ?([0-9]{2}) ?([0-9]{2}) ?([a-dA-D]{1})\b`,
      score: 0.5,
    },
  ],
  context: ['national insurance', 'nino', 'ni number'],
};

// ── UK_DRIVING_LICENCE ──────────────────────────────────────────────────────

/** The DVLA check digit is not public, so this can only reject. Never true. */
const drivingLicenceCheck = (value: string): Validation => {
  const surname = value.toUpperCase().slice(0, 5);

  if (surname === '99999') return false;
  if (!/^[A-Z]+9*$/.test(surname)) return false; // the padding 9s go last

  return null;
};

export const UK_DRIVING_LICENCE: EntityDefinition = {
  name: 'UK_DRIVING_LICENCE',
  description: 'UK driving licence number',
  patterns: [
    {
      // The month group encodes the date of birth: 51-62 marks women (month+50).
      name: 'licence',
      regex: String.raw`\b[A-Z9]{5}[0-9](?:0[1-9]|1[0-2]|5[1-9]|6[0-2])(?:0[1-9]|[12][0-9]|3[01])[0-9][A-Z9]{2}[A-Z0-9][A-Z]{2}\b`,
      score: 0.5,
    },
  ],
  validation: { kind: 'filter', run: drivingLicenceCheck },
  context: ['driving licence', 'dvla', 'driver licence'],
};

// ── UK_VEHICLE_REGISTRATION ─────────────────────────────────────────────────

/** Current format only: the age identifier must be 02-29 or 51-79. */
const vehicleAgeCheck = (value: string): Validation => {
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length !== 2) return null; // prefix and suffix formats: plausible

  const age = Number(digits);

  return (age >= 2 && age <= 29) || (age >= 51 && age <= 79) ? true : false;
};

export const UK_VEHICLE_REGISTRATION: EntityDefinition = {
  name: 'UK_VEHICLE_REGISTRATION',
  description: 'UK vehicle registration plate',
  patterns: [
    {
      name: 'current',
      regex: String.raw`\b[A-HJ-PR-Y][A-HJ-PR-Y](?:0[1-9]|[1-7][0-9])[- ]?[A-HJ-PR-Z]{3}\b`,
      score: 0.3,
    },
    {
      name: 'prefix',
      regex: String.raw`\b[A-HJ-NPR-TV-Y][0-9]{1,3}[- ]?[A-HJ-PR-Y][A-HJ-PR-Z]{2}\b`,
      score: 0.2,
    },
    {
      name: 'suffix',
      regex: String.raw`\b[A-HJ-PR-Z]{3}[- ]?[0-9]{1,3}[- ]?[A-HJ-NPR-TV-Y]\b`,
      score: 0.15,
    },
  ],
  validation: { kind: 'checksum', run: vehicleAgeCheck },
  context: ['registration', 'number plate', 'vehicle', 'matrícula'],
};

// ── the low-score pair ──────────────────────────────────────────────────────

export const UK_PASSPORT: EntityDefinition = {
  name: 'UK_PASSPORT',
  description: 'UK passport number',
  patterns: [
    { name: 'passport', regex: String.raw`\b[A-Z]{2}[0-9]{7}\b`, score: 0.1 },
  ],
  context: ['passport', 'pasaporte'],
};

/**
 * The restricted character classes drop the letters Royal Mail never uses in
 * each position — same technique as UK_NINO. The score is still 0.1 because a
 * postcode looks a lot like any alphanumeric reference.
 */
export const UK_POSTCODE: EntityDefinition = {
  name: 'UK_POSTCODE',
  description: 'UK postal code',
  patterns: [
    {
      name: 'postcode',
      regex: String.raw`\b(GIR\s?0AA|[A-PR-UWYZ][0-9][ABCDEFGHJKPSTUW]?\s?[0-9][ABD-HJLNP-UW-Z]{2}|[A-PR-UWYZ][0-9]{2}\s?[0-9][ABD-HJLNP-UW-Z]{2}|[A-PR-UWYZ][A-HK-Y][0-9][ABEHMNPRVWXY]?\s?[0-9][ABD-HJLNP-UW-Z]{2}|[A-PR-UWYZ][A-HK-Y][0-9]{2}\s?[0-9][ABD-HJLNP-UW-Z]{2})\b`,
      score: 0.1,
    },
  ],
  context: ['postcode', 'post code', 'postal code'],
};
