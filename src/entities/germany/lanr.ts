import { weightedMod10 } from '../../core/checksums';
import { defineEntity } from '../../core/entity';

export const DE_LANR = defineEntity({
  // ── Classification ──────────────────────────
  name: 'DE_LANR',
  country: 'DE',
  kind: 'HEALTH_ID',

  // ── Detection ───────────────────────────────
  description: 'German physician number',
  patterns: [{ name: 'lanr', regex: String.raw`\b[0-9]{9}\b`, score: 0.3 }],
  validation: {
    kind: 'checksum',
    run: (value) => weightedMod10(value, [4, 9, 4, 9, 4, 9], 6),
  },
  context: ['lanr', 'lebenslange arztnummer', 'arzt'],
});
