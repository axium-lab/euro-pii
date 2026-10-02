import { defineEntity } from '../../core/entity';
import { personnummerValid } from './checksums';

/**
 * Two identical patterns except for the `\b`, a technique shared with
 * SE_ORGANISATIONSNUMMER and FI_PERSONAL_IDENTITY_CODE. The delimited one
 * scores high, the free one low, so an identifier embedded in a longer string
 * (`ref:8112189876`) is still caught without being trusted the same.
 */
const SE_PERSON_PATTERN = String.raw`([0-9]{6,8})([-+]?)[0-9]{4}`;

export const SE_PERSONNUMMER = defineEntity({
  // ── Classification ──────────────────────────
  name: 'SE_PERSONNUMMER',
  country: 'SE',
  kind: 'NATIONAL_ID',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Swedish personal identity number',
  patterns: [
    {
      name: 'delimited',
      regex: String.raw`\b${SE_PERSON_PATTERN}\b`,
      score: 0.5,
    },
    { name: 'free', regex: SE_PERSON_PATTERN, score: 0.1 },
  ],
  validation: {
    kind: 'checksum',
    run: (_value, raw) => personnummerValid(raw),
  },
  context: ['personnummer', 'personal identity number'],
});
