import { deTaxIdValid } from '../../core/checksums';
import { defineEntity } from '../../core/entity';

export const DE_TAX_ID = defineEntity({
  // ── Classification ──────────────────────────
  name: 'DE_TAX_ID',
  country: 'DE',
  kind: 'TAX_ID',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'German tax identification number',
  patterns: [
    { name: 'tax-id', regex: String.raw`\b[1-9][0-9]{10}\b`, score: 0.5 },
  ],
  validation: { kind: 'checksum', run: (value) => deTaxIdValid(value) },
  context: ['steuerliche identifikationsnummer', 'steuer-id', 'idnr'],
});
