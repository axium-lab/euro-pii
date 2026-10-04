import { defineEntity } from '../../core/entity';
import { DASH } from '../../core/separators';

/** SIV letters: no I, O or U, which read too much like 1, 0 and V. */
const LETTER = '[A-HJ-NP-TV-Z]';

/**
 * SIV plates since 2009, `AB-123-CD`. The dashes are required: without them
 * `AB123CD` is just a reference code. No check digit, so like the other plates
 * it needs a context word.
 */
export const FR_VEHICLE_PLATE = defineEntity({
  // ── Classification ──────────────────────────
  name: 'FR_VEHICLE_PLATE',
  country: 'FR',
  kind: 'VEHICLE_PLATE',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'French vehicle registration plate',
  patterns: [
    {
      name: 'siv',
      regex: String.raw`\b${LETTER}{2}${DASH}[0-9]{3}${DASH}${LETTER}{2}\b`,
      score: 0.3,
      caseSensitive: true,
    },
  ],
  context: ['immatriculation', 'plaque', 'véhicule', 'vehicule', 'voiture'],
});
