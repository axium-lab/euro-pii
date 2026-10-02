import { defineEntity } from '../../core/entity';

export const DE_HANDELSREGISTER = defineEntity({
  // ── Classification ──────────────────────────
  name: 'DE_HANDELSREGISTER',
  country: 'DE',
  category: 'COMPANY_ID',

  // ── Detection ───────────────────────────────
  description: 'German commercial register number',
  patterns: [
    {
      name: 'hr',
      regex: String.raw`\bHR[AB]\s*[0-9]{1,6}\b`,
      score: 0.5,
    },
  ],
  context: ['handelsregister', 'amtsgericht', 'hrb', 'hra'],
});
