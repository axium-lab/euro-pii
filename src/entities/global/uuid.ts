import { defineEntity } from '../../core/entity';

export const UUID = defineEntity({
  // ── Classification ──────────────────────────
  name: 'UUID',
  country: 'GLOBAL',
  kind: 'UUID',
  dataClass: 'TECHNICAL',

  // ── Detection ───────────────────────────────
  description: 'RFC 4122 universally unique identifier',
  patterns: [
    {
      name: 'uuid',
      regex: String.raw`\b[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}\b`,
      score: 0.5,
    },
  ],
  validation: {
    kind: 'filter',
    run: (value) => {
      const hex = value.replace(/-/g, '');
      if (hex === '0'.repeat(32)) return false; // the nil UUID
      const version = Number.parseInt(hex[12] ?? '0', 16);
      const variant = Number.parseInt(hex[16] ?? '0', 16);
      if (version < 1 || version > 8) return false;
      if (variant < 8 || variant > 11) return false; // 10xx binary prefix
      return null;
    },
  },
  context: ['uuid', 'guid', 'identifier'],
});
