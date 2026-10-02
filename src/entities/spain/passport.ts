import { defineEntity } from '../../core/entity';

/**
 * Three letters and six digits, no validation. With the `i` flag this also
 * matches `abc123456`: any order reference or product code. Score 0.05 says it
 * is noise unless context words raise it — consider leaving it disabled.
 */
export const ES_PASSPORT = defineEntity({
  // ── Classification ──────────────────────────
  name: 'ES_PASSPORT',
  country: 'ES',
  kind: 'PASSPORT',

  // ── Detection ───────────────────────────────
  description: 'Spanish passport number',
  patterns: [
    { name: 'passport', regex: String.raw`\b[A-Z]{3}[0-9]{6}\b`, score: 0.05 },
  ],
  context: ['pasaporte', 'passport'],
});
