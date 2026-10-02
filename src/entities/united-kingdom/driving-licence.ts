import { defineEntity } from '../../core/entity';
import type { Validation } from '../../core/types';

/** The DVLA check digit is not public, so this can only reject. Never true. */
const drivingLicenceCheck = (value: string): Validation => {
  const surname = value.toUpperCase().slice(0, 5);

  if (surname === '99999') return false;
  if (!/^[A-Z]+9*$/.test(surname)) return false; // the padding 9s go last

  return null;
};

export const UK_DRIVING_LICENCE = defineEntity({
  // ── Classification ──────────────────────────
  name: 'UK_DRIVING_LICENCE',
  country: 'GB',
  category: 'DRIVER_LICENCE',

  // ── Detection ───────────────────────────────
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
});
