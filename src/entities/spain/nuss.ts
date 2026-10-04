import { defineEntity } from '../../core/entity';
import { DASH, SPACE } from '../../core/separators';
import { nussValid } from './checksums';

/**
 * Twelve digits alone look like anything, so the regex pins the province to
 * 01-53 and the base score stays at 0.3: below the threshold until the
 * checksum or a context word backs it. Both gaps are the same separator, as
 * in `ES_CCC`.
 */
export const ES_NUSS = defineEntity({
  // ── Classification ──────────────────────────
  name: 'ES_NUSS',
  country: 'ES',
  kind: 'SOCIAL_SECURITY',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Spanish social security number',
  patterns: [
    {
      name: 'nuss',
      regex: String.raw`\b(?:0[1-9]|[1-4][0-9]|5[0-3])(${SPACE}|${DASH}|/)?[0-9]{8}\1[0-9]{2}\b`,
      score: 0.3,
    },
  ],
  validation: { kind: 'checksum', run: (_value, raw) => nussValid(raw) },
  context: [
    'seguridad social',
    'nuss',
    'naf',
    'número de afiliación',
    'afiliación',
  ],
});
