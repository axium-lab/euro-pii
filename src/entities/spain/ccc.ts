import { defineEntity } from '../../core/entity';
import { DASH, SPACE } from '../../core/separators';
import { cccValid } from './checksums';

/**
 * The pre-IBAN account number, still printed bare in old contracts and direct
 * debits. Inside a compact IBAN there is no `\b` before it, and a spaced IBAN
 * groups by four, which breaks the 10-digit tail: the two never collide.
 *
 * The backreference makes every gap repeat the first one: `2100 0418 45 …` or
 * `2100-0418-45-…`, never a mix.
 */
export const ES_CCC = defineEntity({
  // ── Classification ──────────────────────────
  name: 'ES_CCC',
  country: 'ES',
  kind: 'BANK_ACCOUNT',
  dataClass: 'FINANCIAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Spanish bank account number (CCC)',
  patterns: [
    {
      name: 'ccc',
      regex: String.raw`\b[0-9]{4}(${SPACE}|${DASH})?[0-9]{4}\1[0-9]{2}\1[0-9]{10}\b`,
      score: 0.3,
    },
  ],
  validation: { kind: 'checksum', run: cccValid },
  context: ['ccc', 'cuenta', 'cuenta corriente', 'domiciliación', 'banco'],
});
