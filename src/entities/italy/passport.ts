import type { EntityDefinition } from '../../core/types';

export const IT_PASSPORT: EntityDefinition = {
  name: 'IT_PASSPORT',
  description: 'Italian passport number',
  patterns: [
    { name: 'passport', regex: String.raw`\b[A-Z]{2}[0-9]{7}\b`, score: 0.01 },
  ],
  context: ['passaporto', 'passport'],
};
