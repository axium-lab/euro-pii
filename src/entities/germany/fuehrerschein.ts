import { defineEntity } from '../../core/entity';

export const DE_FUEHRERSCHEIN = defineEntity({
  // ── Classification ──────────────────────────
  name: 'DE_FUEHRERSCHEIN',
  country: 'DE',
  kind: 'DRIVER_LICENCE',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'German driving licence number',
  patterns: [
    {
      name: 'licence',
      regex: String.raw`\b[A-Z]{2}[0-9]{8}[A-Z0-9]\b`,
      score: 0.35,
    },
  ],
  context: ['führerschein', 'fuehrerschein', 'driving licence'],
});
