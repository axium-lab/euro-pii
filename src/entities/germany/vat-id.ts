import { iso7064Mod1110 } from '../../core/checksums';
import type { EntityDefinition } from '../../core/types';

export const DE_VAT_ID: EntityDefinition = {
  name: 'DE_VAT_ID',
  description: 'German VAT identification number',
  patterns: [
    { name: 'compact', regex: String.raw`\bDE[0-9]{9}\b`, score: 0.5 },
    {
      name: 'spaced',
      regex: String.raw`\bDE[\s.\-]?[0-9]{3}[\s.\-]?[0-9]{3}[\s.\-]?[0-9]{3}\b`,
      score: 0.4,
    },
  ],
  // Upstream defaults to non-strict, where a bad check digit returns null and
  // the detection survives on its base score. `onChecksumFail: 'keep'` already
  // gives us that behaviour, so this stays a real checksum.
  validation: {
    kind: 'checksum',
    run: (value) =>
      iso7064Mod1110(value.replace(/^DE/i, '').replace(/\./g, '')),
  },
  context: ['umsatzsteuer', 'ust-idnr', 'vat'],
};
