import { defineEntity } from '../../core/entity';
import { SPACE } from '../../core/separators';
import { uidValid } from './checksums';

/**
 * `ATU12345678`. The `U` keeps it out of the `IBAN_CODE` pattern, which wants
 * two digits after the country code.
 */
export const AT_VAT_ID = defineEntity({
  // ── Classification ──────────────────────────
  name: 'AT_VAT_ID',
  country: 'AT',
  kind: 'VAT_ID',
  dataClass: 'CORPORATE',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Austrian VAT identification number (UID)',
  patterns: [
    {
      name: 'uid',
      regex: String.raw`\bAT${SPACE}?U${SPACE}?[0-9]{8}\b`,
      score: 0.5,
      caseSensitive: true,
    },
  ],
  validation: { kind: 'checksum', run: (_value, raw) => uidValid(raw) },
  context: ['uid', 'uid-nummer', 'umsatzsteuer', 'ust-idnr', 'vat'],
});
