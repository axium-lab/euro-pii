import { defineEntity } from '../../core/entity';
import { ICAO_PATTERN, icaoValidation } from './icao';

export const DE_PASSPORT = defineEntity({
  // ── Classification ──────────────────────────
  name: 'DE_PASSPORT',
  country: 'DE',
  category: 'PASSPORT',

  // ── Detection ───────────────────────────────
  description: 'German passport number',
  patterns: [{ name: 'icao', regex: ICAO_PATTERN, score: 0.4 }],
  validation: icaoValidation,
  context: ['pass', 'passnummer', 'reisepass', 'passport'],
});
