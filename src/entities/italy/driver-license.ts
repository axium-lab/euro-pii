import type { EntityDefinition } from '../../core/types';

export const IT_DRIVER_LICENSE: EntityDefinition = {
  name: 'IT_DRIVER_LICENSE',
  description: 'Italian driving licence number',
  patterns: [
    {
      name: 'licence',
      regex: String.raw`\b(([A-Z]{2}[0-9]{7}[A-Z])|(U1[BCDEFGHLJKMNPRSTUWYXZ0-9]{7}[A-Z]))\b`,
      score: 0.2,
    },
  ],
  context: ['patente', 'driving licence'],
};
