import { defineEntity } from '../../core/entity';
import { vatValid } from './checksums';

/**
 * `ES` plus a NIF, a NIE or a CIF. `PERSONAL` and not `CORPORATE` like
 * `DE_VAT_ID`: a self-employed person bills under their own DNI, and the regex
 * cannot tell `ES12345678Z` from a company's number.
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
      regex: String.raw`\bES[\s-]?[0-9A-Z][0-9]{7}[0-9A-Z]\b`,
      score: 0.5,
    },
  ],
  validation: { kind: 'checksum', run: vatValid },
  context: ['iva', 'nif-iva', 'vat', 'intracomunitario'],
});
