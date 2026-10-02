import { defineEntity } from '../../core/entity';
import type { Validation } from '../../core/types';

const macCheck = (value: string): Validation => {
  const hex = value.replace(/[:.-]/g, '');
  if (hex.length !== 12) return false;
  if (/^(?:00){6}$/i.test(hex) || /^(?:FF){6}$/i.test(hex)) return false;
  return null;
};

export const MAC_ADDRESS = defineEntity({
  // ── Classification ──────────────────────────
  name: 'MAC_ADDRESS',
  country: 'GLOBAL',
  kind: 'MAC_ADDRESS',
  dataClass: 'TECHNICAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Hardware MAC address',
  patterns: [
    {
      // `\1` is a backreference: the separator has to stay the same all along,
      // so AA:BB-CC:DD-EE:FF is rejected.
      name: 'colon-or-dash',
      regex: String.raw`\b[0-9A-Fa-f]{2}([:-])(?:[0-9A-Fa-f]{2}\1){4}[0-9A-Fa-f]{2}\b`,
      score: 0.6,
    },
    {
      name: 'cisco',
      regex: String.raw`\b[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\b`,
      score: 0.6,
    },
  ],
  validation: { kind: 'filter', run: macCheck },
  context: ['mac', 'hardware address', 'ethernet'],
});
