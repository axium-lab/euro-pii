import { luhnValid } from '../../core/checksums';
import { defineEntity } from '../../core/entity';

export const CREDIT_CARD = defineEntity({
  // ── Classification ──────────────────────────
  name: 'CREDIT_CARD',
  country: 'EU',
  category: 'PAYMENT_CARD',

  // ── Detection ───────────────────────────────
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
});
