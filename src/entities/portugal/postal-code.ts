import { defineEntity } from '../../core/entity';
import { DASH } from '../../core/separators';

/** `1234-567`. The dash is required: without it, it is just a 7-digit number. */
export const PT_POSTAL_CODE = defineEntity({
  // ── Classification ──────────────────────────
  name: 'PT_POSTAL_CODE',
  country: 'PT',
  kind: 'POSTAL_CODE',
  dataClass: 'PERSONAL',
  identifiability: 'QUASI',

  // ── Detection ───────────────────────────────
  description: 'Portuguese postal code',
  patterns: [
    {
      name: 'cp4-cp3',
      regex: String.raw`\b[1-9][0-9]{3}${DASH}[0-9]{3}\b`,
      score: 0.1,
    },
  ],
  context: ['código postal', 'codigo postal', 'morada', 'cp'],
});
