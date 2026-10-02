import { deTaxIdValid } from '../../core/checksums';
import type { EntityDefinition } from '../../core/types';

export const DE_TAX_ID: EntityDefinition = {
  name: 'DE_TAX_ID',
  description: 'German tax identification number',
  patterns: [
    { name: 'tax-id', regex: String.raw`\b[1-9][0-9]{10}\b`, score: 0.5 },
  ],
  validation: { kind: 'checksum', run: (value) => deTaxIdValid(value) },
  context: ['steuerliche identifikationsnummer', 'steuer-id', 'idnr'],
};
