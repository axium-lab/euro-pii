import { defineEntity } from '../../core/entity';

export const IT_PASSPORT = defineEntity({
  // ── Classification ──────────────────────────
  name: 'IT_PASSPORT',
  country: 'IT',
  kind: 'PASSPORT',

  // ── Detection ───────────────────────────────
  description: 'Italian passport number',
  patterns: [
    { name: 'passport', regex: String.raw`\b[A-Z]{2}[0-9]{7}\b`, score: 0.01 },
  ],
  context: ['passaporto', 'passport'],
});
