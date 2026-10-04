import { defineEntity } from '../../core/entity';
import { DASH, SPACE } from '../../core/separators';
import { vatValid } from './checksums';

/**
 * `ES` plus a NIF, a NIE or a CIF. `PERSONAL` and not `CORPORATE` like
 * `DE_VAT_ID`: a self-employed person bills under their own DNI, and the regex
 * cannot tell `ES12345678Z` from a company's number.
 *
 * Case-sensitive because `es` is also a Spanish verb: with the `i` flag,
 * `El NIF es 12345678Z` came out as a VAT id and took the label from `ES_NIF`.
 */
export const ES_VAT_ID = defineEntity({
  // ── Classification ──────────────────────────
  name: 'ES_VAT_ID',
  country: 'ES',
  kind: 'VAT_ID',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Spanish VAT identification number',
  patterns: [
    {
      name: 'vat',
      regex: String.raw`\bES(?:${SPACE}|${DASH})?[0-9A-Z][0-9]{7}[0-9A-Z]\b`,
      score: 0.5,
      caseSensitive: true,
    },
  ],
  validation: { kind: 'checksum', run: vatValid },
  context: ['iva', 'nif-iva', 'vat', 'intracomunitario'],
});
