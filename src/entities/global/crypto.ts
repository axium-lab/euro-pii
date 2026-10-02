import { defineEntity } from '../../core/entity';
import { base58CheckValid } from './checksums';

export const CRYPTO = defineEntity({
  // ── Classification ──────────────────────────
  name: 'CRYPTO',
  country: 'GLOBAL',
  kind: 'CRYPTO',
  dataClass: 'FINANCIAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Bitcoin wallet address',
  patterns: [
    {
      name: 'address',
      regex: String.raw`(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}`,
      score: 0.5,
      // Base58 is case-sensitive: 'l' and 'I' are not in the alphabet.
      caseSensitive: true,
    },
  ],
  validation: {
    kind: 'checksum',
    // bech32 (bc1…) uses a different checksum, so it only gets to be plausible.
    run: (value) =>
      value.toLowerCase().startsWith('bc1') ? null : base58CheckValid(value),
  },
  context: ['bitcoin', 'wallet', 'btc', 'crypto', 'cartera'],
});
