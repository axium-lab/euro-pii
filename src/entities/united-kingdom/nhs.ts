import { defineEntity } from '../../core/entity';
import { nhsValid } from './checksums';

export const GB_NHS = defineEntity({
  // ── Classification ──────────────────────────
  name: 'GB_NHS',
  country: 'GB',
  kind: 'HEALTH_ID',
  dataClass: 'HEALTH',

  // ── Detection ───────────────────────────────
  description: 'UK National Health Service number',
  patterns: [
    {
      name: 'nhs',
      regex: String.raw`\b([0-9]{3})[- ]?([0-9]{3})[- ]?([0-9]{4})\b`,
      score: 0.5,
    },
  ],
  validation: { kind: 'checksum', run: (value) => nhsValid(value) },
  context: ['nhs', 'national health service', 'health service number'],
});
