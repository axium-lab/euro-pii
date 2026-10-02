import type { EntityDefinition } from '../../core/types';

/**
 * Collides with IT_PASSPORT and UK_PASSPORT: the paper card, the Italian
 * passport and the British one all match `[A-Z]{2}\d{7}`, and none of the three
 * has a validation to tell them apart. Enable all of them and `AB1234567`
 * yields three detections — the overlap layer picks one, arbitrarily.
 */
export const IT_IDENTITY_CARD: EntityDefinition = {
  name: 'IT_IDENTITY_CARD',
  description: 'Italian identity card number',
  patterns: [
    { name: 'paper', regex: String.raw`\b[A-Z]{2}\s?[0-9]{7}\b`, score: 0.01 },
    { name: 'cie-2', regex: String.raw`\b[0-9]{7}[A-Z]{2}\b`, score: 0.01 },
    {
      name: 'cie-3',
      regex: String.raw`\b[A-Z]{2}[0-9]{5}[A-Z]{2}\b`,
      score: 0.01,
    },
  ],
  context: ['carta di identità', 'identity card'],
};
