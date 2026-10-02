import { defineEntity } from '../../core/entity';
import { ICAO_PATTERN, icaoValidation } from './icao';

export const DE_ID_CARD = defineEntity({
  // ── Classification ──────────────────────────
  name: 'DE_ID_CARD',
  country: 'DE',
  category: 'NATIONAL_ID',

  // ── Detection ───────────────────────────────
  description: 'German identity card number',
  patterns: [
    { name: 'icao', regex: ICAO_PATTERN, score: 0.4 },
    // The only shape that is exclusively an ID card and not a passport.
    { name: 'legacy-t', regex: String.raw`\bT[0-9]{8}\b`, score: 0.5 },
  ],
  validation: icaoValidation,
  context: ['personalausweis', 'ausweisnummer', 'identity card'],
});
