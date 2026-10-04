import { defineEntity } from '../../core/entity';
import { cifValid } from './checksums';

/**
 * The NIF of a legal person, still called CIF everywhere. `ES_NIF` cannot catch
 * it: its regex wants digits before the letter, and a CIF starts with one.
 *
 * K, L and M are left out of the leading class: those are NIFs of natural
 * persons with the DNI control letter, not organisations.
 */
export const ES_CIF = defineEntity({
  // ── Classification ──────────────────────────
  name: 'ES_CIF',
  country: 'ES',
  kind: 'COMPANY_ID',
  dataClass: 'CORPORATE',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Spanish tax identification number of a legal entity',
  patterns: [
    {
      name: 'cif',
      regex: String.raw`\b[ABCDEFGHJNPQRSUVW][-]?[0-9]{7}[-]?[0-9A-J]\b`,
      score: 0.4,
    },
  ],
  validation: { kind: 'checksum', run: cifValid },
  context: ['cif', 'nif', 'razón social', 'sociedad', 'empresa'],
});
