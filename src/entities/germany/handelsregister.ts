import type { EntityDefinition } from '../../core/types';

export const DE_HANDELSREGISTER: EntityDefinition = {
  name: 'DE_HANDELSREGISTER',
  description: 'German commercial register number',
  patterns: [
    {
      name: 'hr',
      regex: String.raw`\bHR[AB]\s*[0-9]{1,6}\b`,
      score: 0.5,
    },
  ],
  context: ['handelsregister', 'amtsgericht', 'hrb', 'hra'],
};
