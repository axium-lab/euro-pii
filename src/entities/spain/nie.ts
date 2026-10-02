import { defineEntity } from '../../core/entity';
import { nieValid } from './checksums';

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
      regex: String.raw`\b[X-Z][0-9]?[0-9]{7}[-]?[A-Z]\b`,
      score: 0.5,
    },
  ],
  validation: { kind: 'checksum', run: nieValid },
  context: ['nie', 'número de identidad de extranjero', 'identificación'],
});
