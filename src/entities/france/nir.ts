import { defineEntity } from '../../core/entity';
import { DASH, SPACE } from '../../core/separators';
import { nirValid } from './checksums';

const SEP = String.raw`(?:${SPACE}|${DASH}|\.)`;

/**
 * Only the grouped form, `1 85 05 78 006 084 36`. The compact 15 digits are
 * left out on purpose: when they start with 1 they also fit `CREDIT_CARD`,
 * pass Luhn one time in ten, and the alphabetical tie-break hands the match
 * to the card.
 *
 * Sex 1-4, 7 or 8 (temporary numbers use the last two). The department is two
 * digits or Corsica's `2A`/`2B`.
 */
export const FR_NIR = defineEntity({
  // ── Classification ──────────────────────────
  name: 'FR_NIR',
  country: 'FR',
  kind: 'SOCIAL_SECURITY',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'French social security number (NIR)',
  patterns: [
    {
      name: 'grouped',
      regex: String.raw`\b[1-478]${SEP}[0-9]{2}${SEP}[0-9]{2}${SEP}(?:[0-9]{2}|2[AB])${SEP}[0-9]{3}${SEP}[0-9]{3}${SEP}[0-9]{2}\b`,
      score: 0.5,
    },
  ],
  validation: { kind: 'checksum', run: (_value, raw) => nirValid(raw) },
  context: [
    'sécurité sociale',
    'securite sociale',
    'numéro de sécu',
    'nir',
    'insee',
    'carte vitale',
  ],
});
