import { defineEntity } from '../../core/entity';

/**
 * Two digits, two letters, five digits: `12AB34567`. No check digit, but no
 * other entity shares the shape. Below the threshold on its own.
 */
export const FR_PASSPORT = defineEntity({
  // ── Classification ──────────────────────────
  name: 'FR_PASSPORT',
  country: 'FR',
  kind: 'PASSPORT',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'French passport number',
  patterns: [
    {
      name: 'passport',
      regex: String.raw`\b[0-9]{2}[A-Z]{2}[0-9]{5}\b`,
      score: 0.1,
      caseSensitive: true,
    },
  ],
  context: ['passeport', 'passport', 'numéro de passeport'],
});
