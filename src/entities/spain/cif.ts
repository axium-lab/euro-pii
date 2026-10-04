import { defineEntity } from '../../core/entity';
import { DASH, SPACE } from '../../core/separators';
import { cifValid } from './checksums';

const LETTER = '[ABCDEFGHJNPQRSUVW]';

const GAP = `(?:${SPACE}|${DASH})?`;

/**
 * The NIF of a legal person, still called CIF everywhere. `ES_NIF` cannot catch
 * it: its regex wants digits before the letter, and a CIF starts with one.
 *
 * K, L and M are left out of the leading class: those are NIFs of natural
 * persons with the DNI control letter, not organisations.
 *
 * The eight characters after the letter are written bare, with a dash before
 * the control (`B-1234567-4`) or grouped by dots (`B-12.345.674`). Spaces go to
 * a case-sensitive pattern, as in `ES_NIF`, and below the threshold: the CIF
 * control is mod 10, so a stray `A 12345678` passes it one time in ten.
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
      regex: String.raw`\b${LETTER}${DASH}?(?:[0-9]{7}${DASH}?|[0-9]{2}\.[0-9]{3}\.[0-9]{2})[0-9A-J]\b`,
      score: 0.4,
    },
    {
      name: 'cif-spaced',
      regex: String.raw`\b${LETTER}${GAP}(?:[0-9]{7}${GAP}|[0-9]{2}\.[0-9]{3}\.[0-9]{2}|[0-9]{2}${SPACE}[0-9]{3}${SPACE}[0-9]{2})[0-9A-J]\b`,
      score: 0.3,
      caseSensitive: true,
    },
  ],
  validation: { kind: 'checksum', run: cifValid },
  context: ['cif', 'nif', 'razón social', 'sociedad', 'empresa'],
});
