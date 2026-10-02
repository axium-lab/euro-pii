import { luhnValid } from '../../core/checksums';
import type { EntityDefinition } from '../../core/types';

export const CREDIT_CARD: EntityDefinition = {
  name: 'CREDIT_CARD',
  description: 'Payment card number',
  patterns: [
    {
      name: 'card',
      regex: String.raw`\b(?!1\d{12}(?!\d))((4\d{3})|(5[0-5]\d{2})|(6\d{3})|(1\d{3})|(3\d{3}))[- ]?(\d{3,4})[- ]?(\d{3,4})[- ]?(\d{3,5})\b`,
      score: 0.3,
    },
  ],
  validation: { kind: 'checksum', run: (value) => luhnValid(value) },
  context: ['credit card', 'visa', 'mastercard', 'amex', 'tarjeta', 'cvv'],
};
