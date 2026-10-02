import type { EntityDefinition } from '../../core/types';

export const DE_FUEHRERSCHEIN: EntityDefinition = {
  name: 'DE_FUEHRERSCHEIN',
  description: 'German driving licence number',
  patterns: [
    {
      name: 'licence',
      regex: String.raw`\b[A-Z]{2}[0-9]{8}[A-Z0-9]\b`,
      score: 0.35,
    },
  ],
  context: ['führerschein', 'fuehrerschein', 'driving licence'],
};
