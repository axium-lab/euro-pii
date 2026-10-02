import { defineEntity } from '../../core/entity';
import { deSocialSecurityValid } from './checksums';

export const DE_SOCIAL_SECURITY = defineEntity({
  // ── Classification ──────────────────────────
  name: 'DE_SOCIAL_SECURITY',
  country: 'DE',
  kind: 'SOCIAL_SECURITY',

  // ── Detection ───────────────────────────────
  description: 'German social security number',
  patterns: [
    {
      name: 'strict',
      regex: String.raw`\b[0-9]{2}(0[1-9]|[12][0-9]|3[01]|5[1-9]|[67][0-9]|8[01])(0[1-9]|1[0-2])[0-9]{2}[A-Z][0-9]{2}[0-9]\b`,
      score: 0.5,
    },
    {
      name: 'relaxed',
      regex: String.raw`\b[0-9]{8}[A-Z][0-9]{3}\b`,
      score: 0.3,
    },
  ],
  validation: {
    kind: 'checksum',
    run: (value) => deSocialSecurityValid(value),
  },
  context: ['sozialversicherung', 'rentenversicherung', 'versicherungsnummer'],
});
