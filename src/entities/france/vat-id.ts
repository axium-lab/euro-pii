import { defineEntity } from '../../core/entity';
import { DASH, SPACE } from '../../core/separators';
import { frVatValid } from './checksums';

/**
 * `FR` + key + SIREN. The bare SIREN is not an entity: nine digits with Luhn
 * collide with `DE_LANR`, `DE_BSNR` and every other nine-digit number, while
 * the prefix makes this one unambiguous.
 *
 * It also fits the `IBAN_CODE` pattern, but a French IBAN is 27 characters,
 * so the IBAN length check rejects it.
 */
export const FR_VAT_ID = defineEntity({
  // ── Classification ──────────────────────────
  name: 'FR_VAT_ID',
  country: 'FR',
  kind: 'VAT_ID',
  dataClass: 'CORPORATE',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'French VAT identification number',
  patterns: [
    {
      name: 'vat',
      regex: String.raw`\bFR(?:${SPACE}|${DASH})?[0-9A-HJ-NP-Z]{2}${SPACE}?[0-9]{3}${SPACE}?[0-9]{3}${SPACE}?[0-9]{3}\b`,
      score: 0.5,
      caseSensitive: true,
    },
  ],
  validation: { kind: 'checksum', run: (_value, raw) => frVatValid(raw) },
  context: ['tva', 'tva intracommunautaire', 'n° tva', 'vat'],
});
