import { defineEntity } from '../../core/entity';

export const GB_PASSPORT = defineEntity({
  // ── Classification ──────────────────────────
  name: 'GB_PASSPORT',
  country: 'GB',
  kind: 'PASSPORT',

  // ── Detection ───────────────────────────────
  description: 'UK passport number',
  patterns: [
    { name: 'passport', regex: String.raw`\b[A-Z]{2}[0-9]{7}\b`, score: 0.1 },
  ],
  context: ['passport', 'pasaporte'],
});
