import { defineEntity } from '../../core/entity';
import { SPACE } from '../../core/separators';

/**
 * `1234 AB`. No leading zero, and `SA`, `SD` and `SS` are never issued.
 * Case-sensitive, so `2024 en` in running prose is left alone; even so, a year
 * followed by an uppercase word fits, so it needs a context word.
 */
export const NL_POSTCODE = defineEntity({
  // ── Classification ──────────────────────────
  name: 'NL_POSTCODE',
  country: 'NL',
  kind: 'POSTAL_CODE',
  dataClass: 'PERSONAL',
  identifiability: 'QUASI',

  // ── Detection ───────────────────────────────
  description: 'Dutch postcode',
  patterns: [
    {
      name: 'postcode',
      regex: String.raw`\b[1-9][0-9]{3}${SPACE}?(?!SA|SD|SS)[A-Z]{2}\b`,
      score: 0.1,
      caseSensitive: true,
    },
  ],
  context: ['postcode', 'woonplaats', 'adres'],
});
