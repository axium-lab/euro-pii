import { defineEntity } from '../../core/entity';
import { DASH } from '../../core/separators';

/** Consonants only since 1973, and never C, Q or W. */
const L = '[BDFGHJKLMNPRSTVXZ]';
const D = '[0-9]';
const S = DASH;

/**
 * Sidecodes 7 to 14, the ones issued since 1999. Sidecodes 1 to 6 are left out
 * on purpose: `XX-99-XX` and its siblings are exactly the Portuguese plates,
 * and neither has a check digit to settle which one it is.
 */
const SIDECODES = [
  `${D}{2}${S}${L}{3}${S}${D}`, // 7:  99-XXX-9
  `${D}${S}${L}{3}${S}${D}{2}`, // 8:  9-XXX-99
  `${L}{2}${S}${D}{3}${S}${L}`, // 9:  XX-999-X
  `${L}${S}${D}{3}${S}${L}{2}`, // 10: X-999-XX
  `${L}{3}${S}${D}{2}${S}${L}`, // 11: XXX-99-X
  `${L}${S}${D}{2}${S}${L}{3}`, // 12: X-99-XXX
  `${D}${S}${L}{2}${S}${D}{3}`, // 13: 9-XX-999
  `${D}{3}${S}${L}{2}${S}${D}`, // 14: 999-XX-9
].join('|');

/** No check digit, so like the other plates it needs a context word. */
export const NL_VEHICLE_PLATE = defineEntity({
  // ── Classification ──────────────────────────
  name: 'NL_VEHICLE_PLATE',
  country: 'NL',
  kind: 'VEHICLE_PLATE',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Dutch vehicle registration plate (kenteken)',
  patterns: [
    {
      name: 'sidecode',
      regex: String.raw`\b(?:${SIDECODES})\b`,
      score: 0.3,
      caseSensitive: true,
    },
  ],
  context: ['kenteken', 'voertuig', 'auto', 'rdw'],
});
