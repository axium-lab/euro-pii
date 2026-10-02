import type { EntityDefinition } from '../../core/types';

export const DE_TAX_NUMBER: EntityDefinition = {
  name: 'DE_TAX_NUMBER',
  description: 'German tax number',
  patterns: [
    {
      name: 'thirteen-digit',
      regex: String.raw`\b(0[1-9]|1[0-6])[0-9]{11}\b`,
      score: 0.5,
    },
    {
      name: 'slashed',
      regex: String.raw`(?<!\w)[0-9]{3}/[0-9]{3}/[0-9]{5}(?!\w)`,
      score: 0.4,
    },
    {
      name: 'slashed-loose',
      regex: String.raw`(?<!\w)[0-9]{2,3}/[0-9]{3,4}/[0-9]{4,5}(?!\w)`,
      score: 0.2,
    },
  ],
  context: ['steuernummer', 'finanzamt'],
};
