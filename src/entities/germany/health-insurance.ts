import { defineEntity } from '../../core/entity';

export const DE_HEALTH_INSURANCE = defineEntity({
  // ── Classification ──────────────────────────
  name: 'DE_HEALTH_INSURANCE',
  country: 'DE',
  category: 'HEALTH_ID',

  // ── Detection ───────────────────────────────
  description: 'German health insurance number',
  patterns: [
    { name: 'kvnr', regex: String.raw`\b[A-Z][0-9]{9}\b`, score: 0.3 },
  ],
  // The reference names a GKV checksum but does not spell out the algorithm.
  // Rather than guess at one, this only rejects shapes no KVNR has.
  validation: {
    kind: 'filter',
    run: (value) =>
      /^[A-Z][0-9]{9}$/i.test(value) && !/^[A-Z]0{9}$/i.test(value)
        ? null
        : false,
  },
  context: ['krankenversicherung', 'versichertennummer', 'kvnr'],
});
