import { defineEntity } from '../../core/entity';
import { DASH, SPACE } from '../../core/separators';
import { CONTROL, nieValid } from './checksums';

/** Seven digits (eight in the oldest ones), bare or grouped with dots. */
const DIGITS = String.raw`(?:[0-9]?[0-9]{7}|[0-9]{1,2}\.[0-9]{3}\.[0-9]{3})`;

const LETTER = `[${CONTROL}]`;

const GAP = `(?:${SPACE}|${DASH})?`;

/**
 * The prefix is mandatory here, and that is a deliberate divergence from
 * Presidio, where it is optional (`[X-Z]?`).
 *
 * Upstream can afford an optional prefix because a failing checksum removes the
 * detection, so a plain NIF matching this pattern disappears on validation. We
 * keep failing checksums on purpose (`onChecksumFail: 'keep'`), so that safety
 * net is gone: with `[X-Z]?` a mistyped NIF surfaces as an ES_NIE. Requiring
 * the prefix removes the collision at the source instead of leaving an
 * arbitrary tie-break to decide the label.
 *
 * Split in two like `ES_NIF`: spaces only in the case-sensitive pattern.
 */
export const ES_NIE = defineEntity({
  // ── Classification ──────────────────────────
  name: 'ES_NIE',
  country: 'ES',
  kind: 'NATIONAL_ID',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Spanish foreigner identification number',
  patterns: [
    {
      name: 'nie',
      regex: String.raw`\b[XYZ]${DASH}?${DIGITS}${DASH}?${LETTER}\b`,
      score: 0.5,
    },
    {
      name: 'nie-spaced',
      regex: String.raw`\b[XYZ]${GAP}(?:${DIGITS}|[0-9]{1,2}${SPACE}[0-9]{3}${SPACE}[0-9]{3})${GAP}${LETTER}\b`,
      score: 0.3,
      caseSensitive: true,
    },
  ],
  validation: { kind: 'checksum', run: nieValid },
  context: ['nie', 'número de identidad de extranjero', 'identificación'],
});
