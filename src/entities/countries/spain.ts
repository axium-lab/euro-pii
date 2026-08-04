import { sanitize } from '../../core/sanitize';
import type { EntityDefinition, Validation } from '../../core/types';

const CONTROL = 'TRWAGMYFPDXBNJZSQVHLCKE';

/** Check letter of a NIF: CONTROL[digits % 23]. */
export function nifValid(raw: string): Validation {
  const text = sanitize(raw).toUpperCase();
  const digits = text.replace(/[^0-9]/g, '');

  if (digits === '') return false;

  return text.at(-1) === CONTROL[Number(digits) % 23];
}

/** Same maths as the NIF once the prefix becomes a digit: X -> 0, Y -> 1, Z -> 2. */
export function nieValid(raw: string): Validation {
  const text = sanitize(raw).toUpperCase();
  const prefix = text[0];

  if (prefix === undefined || !'XYZ'.includes(prefix)) return false;
  if (text.length < 8 || text.length > 9) return false;
  if (!/^[0-9]+$/.test(text.slice(1, -1))) return false;

  const digits = Number(String('XYZ'.indexOf(prefix)) + text.slice(1, -1));

  return text.at(-1) === CONTROL[digits % 23];
}

export const ES_NIF: EntityDefinition = {
  name: 'ES_NIF',
  description: 'Spanish tax identification number',
  patterns: [
    { name: 'nif', regex: String.raw`\b[0-9]?[0-9]{7}[-]?[A-Z]\b`, score: 0.5 },
  ],
  validation: { kind: 'checksum', run: nifValid },
  context: ['dni', 'nif', 'documento nacional de identidad', 'identificación'],
};

/**
 * The prefix is mandatory here, and that is a deliberate divergence from
 * docs/deteccion-regex.md:489, where it is optional (`[X-Z]?`).
 *
 * Upstream can afford an optional prefix because a failing checksum removes the
 * detection, so a plain NIF matching this pattern disappears on validation. We
 * keep failing checksums on purpose (`onChecksumFail: 'keep'`), so that safety
 * net is gone: with `[X-Z]?` a mistyped NIF surfaces as an ES_NIE. Requiring
 * the prefix removes the collision at the source instead of leaving an
 * arbitrary tie-break to decide the label.
 */
export const ES_NIE: EntityDefinition = {
  name: 'ES_NIE',
  description: 'Spanish foreigner identification number',
  patterns: [
    {
      name: 'nie',
      regex: String.raw`\b[X-Z][0-9]?[0-9]{7}[-]?[A-Z]\b`,
      score: 0.5,
    },
  ],
  validation: { kind: 'checksum', run: nieValid },
  context: ['nie', 'número de identidad de extranjero', 'identificación'],
};

/**
 * Three letters and six digits, no validation. With the `i` flag this also
 * matches `abc123456`: any order reference or product code. Score 0.05 says it
 * is noise unless context words raise it — consider leaving it disabled.
 */
export const ES_PASSPORT: EntityDefinition = {
  name: 'ES_PASSPORT',
  description: 'Spanish passport number',
  patterns: [
    { name: 'passport', regex: String.raw`\b[A-Z]{3}[0-9]{6}\b`, score: 0.05 },
  ],
  context: ['pasaporte', 'passport'],
};
