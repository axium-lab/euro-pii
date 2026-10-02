import { defineEntity } from '../../core/entity';
import { organisationsnummerValid } from './checksums';

/** Delimited and free patterns, same technique as SE_PERSONNUMMER. */
const SE_ORG_PATTERN = String.raw`[0-9]{6}[-]?[0-9]{4}`;

export const SE_ORGANISATIONSNUMMER = defineEntity({
  // ── Classification ──────────────────────────
  name: 'SE_ORGANISATIONSNUMMER',
  country: 'SE',
  kind: 'COMPANY_ID',
  dataClass: 'CORPORATE',

  // ── Detection ───────────────────────────────
  description: 'Swedish organisation number',
  patterns: [
    { name: 'delimited', regex: String.raw`\b${SE_ORG_PATTERN}\b`, score: 0.6 },
    { name: 'free', regex: SE_ORG_PATTERN, score: 0.2 },
  ],
  validation: {
    kind: 'checksum',
    run: (_value, raw) => organisationsnummerValid(raw),
  },
  context: ['organisationsnummer', 'organisation number', 'företag'],
});
