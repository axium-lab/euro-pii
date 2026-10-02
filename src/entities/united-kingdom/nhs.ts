import { defineEntity } from '../../core/entity';
import { nhsValid } from './checksums';

export const UK_NHS = defineEntity({
  // ── Classification ──────────────────────────
  name: 'UK_NHS',
  country: 'GB',
  category: 'HEALTH_ID',

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
