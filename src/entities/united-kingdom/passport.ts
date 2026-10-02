import type { EntityDefinition } from '../../core/types';

export const UK_PASSPORT: EntityDefinition = {
  name: 'UK_PASSPORT',
  description: 'UK passport number',
  patterns: [
    { name: 'passport', regex: String.raw`\b[A-Z]{2}[0-9]{7}\b`, score: 0.1 },
  ],
  context: ['passport', 'pasaporte'],
};
