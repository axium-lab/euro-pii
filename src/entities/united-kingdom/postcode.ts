import { defineEntity } from '../../core/entity';

/**
 * The restricted character classes drop the letters Royal Mail never uses in
 * each position — same technique as UK_NINO. The score is still 0.1 because a
 * postcode looks a lot like any alphanumeric reference.
 */
export const UK_POSTCODE = defineEntity({
  // ── Classification ──────────────────────────
  name: 'UK_POSTCODE',
  country: 'GB',
  category: 'POSTAL_CODE',

  // ── Detection ───────────────────────────────
  description: 'UK postal code',
  patterns: [
    {
      name: 'postcode',
      regex: String.raw`\b(GIR\s?0AA|[A-PR-UWYZ][0-9][ABCDEFGHJKPSTUW]?\s?[0-9][ABD-HJLNP-UW-Z]{2}|[A-PR-UWYZ][0-9]{2}\s?[0-9][ABD-HJLNP-UW-Z]{2}|[A-PR-UWYZ][A-HK-Y][0-9][ABEHMNPRVWXY]?\s?[0-9][ABD-HJLNP-UW-Z]{2}|[A-PR-UWYZ][A-HK-Y][0-9]{2}\s?[0-9][ABD-HJLNP-UW-Z]{2})\b`,
      score: 0.1,
    },
  ],
  context: ['postcode', 'post code', 'postal code'],
});
