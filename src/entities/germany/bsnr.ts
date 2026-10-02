import { defineEntity } from '../../core/entity';
import type { Validation } from '../../core/types';

/** Identifies a medical practice. Its algorithm is not public: never confirms. */
const bsnrCheck = (value: string): Validation => {
  if (value.length !== 9 || !/^[0-9]+$/.test(value)) return false;
  if (value === '000000000') return false;
  return null;
};

export const DE_BSNR = defineEntity({
  // ── Classification ──────────────────────────
  name: 'DE_BSNR',
  country: 'DE',
  category: 'HEALTH_ID',

  // ── Detection ───────────────────────────────
  description: 'German medical practice number',
  patterns: [{ name: 'bsnr', regex: String.raw`\b[0-9]{9}\b`, score: 0.2 }],
  validation: { kind: 'filter', run: bsnrCheck },
  context: ['bsnr', 'betriebsstättennummer', 'praxis'],
});
