import { defineEntity } from '../../core/entity';
import { DASH, SPACE } from '../../core/separators';
import { citizenCardValid } from './checksums';

const SEP = String.raw`(?:${SPACE}|${DASH})?`;

/**
 * `12345678 9 ZZ4`: the civil id, its check digit, two version letters and a
 * final check digit. Nine digits followed by letters fits no other entity, and
 * `\b` keeps the bare civil id out of the nine-digit ones.
 */
export const PT_CITIZEN_CARD = defineEntity({
  // ── Classification ──────────────────────────
  name: 'PT_CITIZEN_CARD',
  country: 'PT',
  kind: 'NATIONAL_ID',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Portuguese citizen card number',
  patterns: [
    {
      name: 'cc',
      regex: String.raw`\b[0-9]{8}${SEP}[0-9]${SEP}[A-Z]{2}[0-9]\b`,
      score: 0.5,
    },
  ],
  validation: {
    kind: 'checksum',
    run: (_value, raw) => citizenCardValid(raw),
  },
  context: [
    'cartão de cidadão',
    'cartao de cidadao',
    'cidadão',
    'documento de identificação',
    'n.º do documento',
  ],
});
