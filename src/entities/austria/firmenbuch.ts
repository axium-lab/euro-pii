import { defineEntity } from '../../core/entity';
import { SPACE } from '../../core/separators';
import { firmenbuchValid } from './checksums';

/**
 * `FN 123456a`: up to six digits and a check letter. Only the 17 letters the
 * algorithm can produce are accepted by the pattern. Below the threshold
 * unless the letter checks out or a context word is near: `FN` is also short
 * for a footnote.
 */
export const AT_FIRMENBUCH = defineEntity({
  // ── Classification ──────────────────────────
  name: 'AT_FIRMENBUCH',
  country: 'AT',
  kind: 'COMPANY_ID',
  dataClass: 'CORPORATE',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Austrian company register number (Firmenbuchnummer)',
  patterns: [
    {
      name: 'fn',
      regex: String.raw`\bFN${SPACE}?[0-9]{1,6}${SPACE}?[abdfghikmpstvwxyz]\b`,
      score: 0.3,
    },
  ],
  validation: {
    kind: 'checksum',
    run: (_value, raw) => firmenbuchValid(raw),
  },
  context: ['firmenbuch', 'firmenbuchnummer', 'firmenbuchgericht'],
});
