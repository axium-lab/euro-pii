import { defineEntity } from '../../core/entity';

export const DE_PLZ = defineEntity({
  // ── Classification ──────────────────────────
  name: 'DE_PLZ',
  country: 'DE',
  kind: 'POSTAL_CODE',
  dataClass: 'PERSONAL',

  // ── Detection ───────────────────────────────
  description: 'German postal code',
  patterns: [
    {
      name: 'plz',
      regex: String.raw`\b(?!01000\b|99999\b)(0[1-9][0-9]{3}|[1-9][0-9]{4})\b`,
      score: 0.05,
    },
  ],
  context: ['plz', 'postleitzahl', 'postal code'],
});
