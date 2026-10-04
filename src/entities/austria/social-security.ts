import { defineEntity } from '../../core/entity';
import { SPACE } from '../../core/separators';
import { svnrValid } from './checksums';

/**
 * Only the grouped form, `1234 010180`: serial and check digit, then the birth
 * date. The compact ten digits collide with `GB_NHS`. The date is not checked
 * as a calendar date: when it is unknown, the insurer issues months above 12.
 */
export const AT_SOCIAL_SECURITY = defineEntity({
  // ── Classification ──────────────────────────
  name: 'AT_SOCIAL_SECURITY',
  country: 'AT',
  kind: 'SOCIAL_SECURITY',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Austrian social security number',
  patterns: [
    {
      name: 'grouped',
      regex: String.raw`\b[1-9][0-9]{3}${SPACE}[0-9]{6}\b`,
      score: 0.3,
    },
  ],
  validation: { kind: 'checksum', run: (_value, raw) => svnrValid(raw) },
  context: [
    'sozialversicherungsnummer',
    'versicherungsnummer',
    'svnr',
    'sv-nr',
    'e-card',
  ],
});
