import { defineEntity } from '../../core/entity';

export const UK_PASSPORT = defineEntity({
  // ── Classification ──────────────────────────
  name: 'UK_PASSPORT',
  country: 'GB',
  category: 'PASSPORT',

  // ── Detection ───────────────────────────────
  description: 'UK passport number',
  patterns: [
    { name: 'passport', regex: String.raw`\b[A-Z]{2}[0-9]{7}\b`, score: 0.1 },
  ],
  context: ['passport', 'pasaporte'],
});
