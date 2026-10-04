import { defineEntity } from '../../core/entity';
import { DASH } from '../../core/separators';

const L = '[A-Z]';
const D = '[0-9]';
const S = DASH;

/**
 * The four series still on the road, newest first. They all fit `XX-99-XX`
 * and its siblings, which is why `NL_VEHICLE_PLATE` drops the Dutch sidecodes
 * 1 to 6: they are the same shapes.
 */
const SERIES = [
  `${L}{2}${S}${D}{2}${S}${L}{2}`, // since 2020: AA-00-AA
  `${D}{2}${S}${L}{2}${S}${D}{2}`, // 2005-2020:  00-AA-00
  `${D}{2}${S}${D}{2}${S}${L}{2}`, // 1992-2005:  00-00-AA
  `${L}{2}${S}${D}{2}${S}${D}{2}`, // until 1992: AA-00-00
].join('|');

/** No check digit, so like the other plates it needs a context word. */
export const PT_VEHICLE_PLATE = defineEntity({
  // ── Classification ──────────────────────────
  name: 'PT_VEHICLE_PLATE',
  country: 'PT',
  kind: 'VEHICLE_PLATE',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Portuguese vehicle registration plate',
  patterns: [
    {
      name: 'matricula',
      regex: String.raw`\b(?:${SERIES})\b`,
      score: 0.3,
      caseSensitive: true,
    },
  ],
  context: ['matrícula', 'matricula', 'viatura', 'veículo', 'veiculo'],
});
