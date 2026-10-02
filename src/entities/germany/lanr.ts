import { weightedMod10 } from '../../core/checksums';
import type { EntityDefinition } from '../../core/types';

export const DE_LANR: EntityDefinition = {
  name: 'DE_LANR',
  description: 'German physician number',
  patterns: [{ name: 'lanr', regex: String.raw`\b[0-9]{9}\b`, score: 0.3 }],
  validation: {
    kind: 'checksum',
    run: (value) => weightedMod10(value, [4, 9, 4, 9, 4, 9], 6),
  },
  context: ['lanr', 'lebenslange arztnummer', 'arzt'],
};
