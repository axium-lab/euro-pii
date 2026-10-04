import { defineEntity } from '../../core/entity';
import { DASH } from '../../core/separators';
import { eidCardValid } from './checksums';

/**
 * `591-1234567-89`, or the same twelve digits together. No other entity takes
 * twelve digits. The dashed form contains a 3-3-4 run that `GB_NHS` can
 * confirm, but this match is longer and wins the overlap.
 */
export const BE_EID_CARD = defineEntity({
  // ── Classification ──────────────────────────
  name: 'BE_EID_CARD',
  country: 'BE',
  kind: 'NATIONAL_ID',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Belgian identity card number',
  patterns: [
    {
      name: 'dashed',
      regex: String.raw`\b[0-9]{3}${DASH}[0-9]{7}${DASH}[0-9]{2}\b`,
      score: 0.5,
    },
    { name: 'compact', regex: String.raw`\b[0-9]{12}\b`, score: 0.2 },
  ],
  validation: { kind: 'checksum', run: (_value, raw) => eidCardValid(raw) },
  context: [
    'identiteitskaart',
    'eid',
    'kaartnummer',
    "carte d'identité",
    'numéro de carte',
  ],
});
