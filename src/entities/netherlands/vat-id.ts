import { defineEntity } from '../../core/entity';
import { DASH, SPACE } from '../../core/separators';
import { nlVatValid } from './checksums';

const SEP = String.raw`(?:${SPACE}|${DASH}|\.)?`;

/**
 * `NL123456789B01`. `PERSONAL` and not `CORPORATE`: since 2020 a sole trader
 * gets a btw-id of their own, and the regex cannot tell it from a company's.
 *
 * It also fits the `IBAN_CODE` pattern, but a Dutch IBAN is 18 characters, so
 * the IBAN length check rejects it.
 */
export const NL_VAT_ID = defineEntity({
  // ── Classification ──────────────────────────
  name: 'NL_VAT_ID',
  country: 'NL',
  kind: 'VAT_ID',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Dutch VAT identification number (btw-id)',
  patterns: [
    {
      name: 'btw',
      regex: String.raw`\bNL${SEP}[0-9]{9}${SEP}B${SEP}[0-9]{2}\b`,
      score: 0.5,
      caseSensitive: true,
    },
  ],
  validation: { kind: 'checksum', run: (_value, raw) => nlVatValid(raw) },
  context: ['btw', 'btw-id', 'btw-nummer', 'omzetbelasting', 'vat'],
});
