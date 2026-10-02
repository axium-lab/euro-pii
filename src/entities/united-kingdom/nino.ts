import type { EntityDefinition } from '../../core/types';

/**
 * The best built pattern of the whole reference: the entire specification lives
 * inside the regex, so there is nothing left to validate afterwards. The
 * negative lookahead drops the forbidden prefixes, each letter class excludes
 * the letters that position never takes, and the suffix can only be A-D.
 */
export const UK_NINO: EntityDefinition = {
  name: 'UK_NINO',
  description: 'UK National Insurance number',
  patterns: [
    {
      name: 'nino',
      // The source pattern opens with an optional space after the `\b`, which
      // pulls the preceding space INTO the match: masking `NINO AB123456C` then
      // produces `NINO<UK_NINO_1>`. Dropped here, the internal ones stay so
      // `AB 12 34 56 C` still matches.
      regex: String.raw`\b(?!bg|gb|nk|kn|nt|tn|zz|BG|GB|NK|KN|NT|TN|ZZ)([a-ceghj-pr-tw-zA-CEGHJ-PR-TW-Z]{1}[a-ceghj-npr-tw-zA-CEGHJ-NPR-TW-Z]{1}) ?([0-9]{2}) ?([0-9]{2}) ?([0-9]{2}) ?([a-dA-D]{1})\b`,
      score: 0.5,
    },
  ],
  context: ['national insurance', 'nino', 'ni number'],
};
