import { defineEntity } from '../../core/entity';
import { DASH, SPACE } from '../../core/separators';
import { enterpriseNumberValid } from './checksums';

const SEP = String.raw`(?:\.|${SPACE})?`;

/**
 * `BE` + the enterprise number: `BE0123456789` or `BE 0123.456.789`.
 *
 * It also fits the `IBAN_CODE` pattern, but a Belgian IBAN is 16 characters,
 * so the IBAN length check rejects it.
 */
export const BE_VAT_ID = defineEntity({
  // ── Classification ──────────────────────────
  name: 'BE_VAT_ID',
  country: 'BE',
  kind: 'VAT_ID',
  dataClass: 'CORPORATE',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Belgian VAT identification number',
  patterns: [
    {
      name: 'vat',
      regex: String.raw`\bBE(?:${SPACE}|${DASH})?[01][0-9]{3}${SEP}[0-9]{3}${SEP}[0-9]{3}\b`,
      score: 0.5,
      caseSensitive: true,
    },
  ],
  validation: {
    kind: 'checksum',
    run: (_value, raw) => enterpriseNumberValid(raw),
  },
  context: ['btw', 'tva', 'vat', 'btw-nummer', 'numéro de tva'],
});
