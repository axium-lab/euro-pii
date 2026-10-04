import { defineEntity } from '../../core/entity';
import { DASH, SPACE } from '../../core/separators';
import { nationalNumberValid } from './checksums';

/**
 * Only the official grouping, `85.07.30-033.28`. The compact 11 digits are
 * left out on purpose: they collide with `DE_TAX_ID` and `IT_VAT_CODE`, and
 * a mod 97 key does not separate them.
 *
 * The month goes up to 59: BIS numbers, for people outside the register, add
 * 20 or 40 to it.
 */
export const BE_NATIONAL_NUMBER = defineEntity({
  // ── Classification ──────────────────────────
  name: 'BE_NATIONAL_NUMBER',
  country: 'BE',
  kind: 'NATIONAL_ID',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Belgian national register number',
  patterns: [
    {
      name: 'grouped',
      regex: String.raw`\b[0-9]{2}\.[0-5][0-9]\.[0-9]{2}(?:${DASH}|${SPACE})[0-9]{3}\.[0-9]{2}\b`,
      score: 0.5,
    },
  ],
  validation: {
    kind: 'checksum',
    run: (_value, raw) => nationalNumberValid(raw),
  },
  context: [
    'rijksregisternummer',
    'rijksregister',
    'registre national',
    'numéro national',
    'insz',
    'niss',
  ],
});
