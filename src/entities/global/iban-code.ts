import { defineEntity } from '../../core/entity';
import { ibanValid } from './checksums';

export const IBAN_CODE = defineEntity({
  // ── Classification ──────────────────────────
  name: 'IBAN_CODE',
  country: 'GLOBAL',
  kind: 'BANK_ACCOUNT',
  dataClass: 'FINANCIAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'International bank account number',
  patterns: [
    {
      /**
       * The trailing groups only take DIGITS, and that is a fix over the source
       * pattern, which allows `[A-Z0-9]` there.
       *
       * With letters allowed, a space plus any short word gets absorbed:
       * `ES91 2100 0418 4502 0005 1332 y tarjeta` matched up to the `y`, which
       * both broke the checksum and swallowed the word out of the masked text.
       * Every European BBAN in the length table of checksums.ts carries its
       * letters in the leading groups, never in the final one to three
       * characters.
       */
      name: 'iban',
      regex: String.raw`(?<![A-Z0-9])([A-Z]{2}[0-9]{2}(?:[ -]?[A-Z0-9]{4}){2,6})((?:[ -]?[0-9]{4})?)((?:[ -]?[0-9]{1,3})?)(?![A-Z0-9])`,
      score: 0.5,
    },
  ],
  validation: { kind: 'checksum', run: (value) => ibanValid(value) },
  context: ['iban', 'cuenta', 'account', 'bank', 'banco'],
});
