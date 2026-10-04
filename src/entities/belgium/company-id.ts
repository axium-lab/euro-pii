import { defineEntity } from '../../core/entity';
import { enterpriseNumberValid } from './checksums';

/**
 * Only the dotted form, `0123.456.789`. The compact ten digits collide with
 * `GB_NHS`, and the spaced form is exactly how a Belgian mobile number is
 * written (`0471 234 567`). Below the threshold unless the key passes.
 */
export const BE_COMPANY_ID = defineEntity({
  // ── Classification ──────────────────────────
  name: 'BE_COMPANY_ID',
  country: 'BE',
  kind: 'COMPANY_ID',
  dataClass: 'CORPORATE',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Belgian enterprise number (KBO/BCE)',
  patterns: [
    {
      name: 'grouped',
      regex: String.raw`\b[01][0-9]{3}\.[0-9]{3}\.[0-9]{3}\b`,
      score: 0.3,
    },
  ],
  validation: {
    kind: 'checksum',
    run: (_value, raw) => enterpriseNumberValid(raw),
  },
  context: [
    'ondernemingsnummer',
    "numéro d'entreprise",
    'kbo',
    'bce',
    'kruispuntbank',
  ],
});
