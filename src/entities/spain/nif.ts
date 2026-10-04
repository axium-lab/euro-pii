import { defineEntity } from '../../core/entity';
import { DASH, SPACE } from '../../core/separators';
import { CONTROL, nifValid } from './checksums';

/** Seven or eight digits, bare or grouped by thousands with dots. */
const DIGITS = String.raw`(?:[0-9]?[0-9]{7}|[0-9]{1,2}\.[0-9]{3}\.[0-9]{3})`;

/** Only the 23 letters the checksum can produce: no I, Ñ, O or U. */
const LETTER = `[${CONTROL}]`;

/**
 * Not after a dot or a comma, so `1.12.345.678-Z` yields nothing instead of
 * its tail, and not after `X-`, `Y-` or `Z-`, where the digits belong to an
 * `ES_NIE`.
 */
const START = String.raw`(?<![\w.,])(?<![XYZ]${DASH})`;

/**
 * Two patterns because a space before the letter needs case sensitivity. With
 * the `i` flag, `pagó 12345678 a Juan` would be a NIF: `a` is a control letter.
 * The spaced one also groups by spaces, which joins unrelated numbers more
 * easily, so it starts below the threshold and needs the checksum or context.
 */
export const ES_NIF = defineEntity({
  // ── Classification ──────────────────────────
  name: 'ES_NIF',
  country: 'ES',
  kind: 'TAX_ID',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Spanish tax identification number',
  patterns: [
    {
      name: 'nif',
      regex: String.raw`${START}${DIGITS}${DASH}?${LETTER}\b`,
      score: 0.5,
    },
    {
      name: 'nif-spaced',
      regex: String.raw`${START}(?:${DIGITS}|[0-9]{1,2}${SPACE}[0-9]{3}${SPACE}[0-9]{3})(?:${SPACE}|${DASH})?${LETTER}\b`,
      score: 0.3,
      caseSensitive: true,
    },
  ],
  validation: { kind: 'checksum', run: nifValid },
  context: ['dni', 'nif', 'documento nacional de identidad', 'identificación'],
});
