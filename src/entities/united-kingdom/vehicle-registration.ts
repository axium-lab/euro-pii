import { defineEntity } from '../../core/entity';
import type { Validation } from '../../core/types';

/** Current format only: the age identifier must be 02-29 or 51-79. */
const vehicleAgeCheck = (value: string): Validation => {
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length !== 2) return null; // prefix and suffix formats: plausible

  const age = Number(digits);

  return (age >= 2 && age <= 29) || (age >= 51 && age <= 79) ? true : false;
};

export const GB_VEHICLE_REGISTRATION = defineEntity({
  // ── Classification ──────────────────────────
  name: 'GB_VEHICLE_REGISTRATION',
  country: 'GB',
  kind: 'VEHICLE_PLATE',
  dataClass: 'PERSONAL',

  // ── Detection ───────────────────────────────
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
});
