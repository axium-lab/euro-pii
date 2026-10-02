import { defineEntity } from '../../core/entity';
import { hetuValid } from './checksums';

/** Delimited and free patterns, same technique as SE_PERSONNUMMER. */
const FI_PATTERN = String.raw`([0-9]{6})([-+ABCDEFYXWVU])([0-9]{3})([0123456789ABCDEFHJKLMNPRSTUVWXY])`;

export const FI_PERSONAL_IDENTITY_CODE = defineEntity({
  // ── Classification ──────────────────────────
  name: 'FI_PERSONAL_IDENTITY_CODE',
  country: 'FI',
  category: 'NATIONAL_ID',

  // ── Detection ───────────────────────────────
  description: 'Finnish personal identity code',
  patterns: [
    { name: 'delimited', regex: String.raw`\b${FI_PATTERN}\b`, score: 0.5 },
    { name: 'free', regex: FI_PATTERN, score: 0.1 },
  ],
  validation: { kind: 'checksum', run: (_value, raw) => hetuValid(raw) },
  context: ['henkilötunnus', 'hetu', 'personal identity code'],
});
