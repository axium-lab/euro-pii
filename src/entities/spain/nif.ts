import { defineEntity } from '../../core/entity';
import { nifValid } from './checksums';

export const ES_NIF = defineEntity({
  // ── Classification ──────────────────────────
  name: 'ES_NIF',
  country: 'ES',
  kind: 'TAX_ID',
  dataClass: 'PERSONAL',

  // ── Detection ───────────────────────────────
  description: 'Spanish tax identification number',
  patterns: [
    { name: 'nif', regex: String.raw`\b[0-9]?[0-9]{7}[-]?[A-Z]\b`, score: 0.5 },
  ],
  validation: { kind: 'checksum', run: nifValid },
  context: ['dni', 'nif', 'documento nacional de identidad', 'identificación'],
});
