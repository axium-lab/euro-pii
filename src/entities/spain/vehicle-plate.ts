import { defineEntity } from '../../core/entity';

/** Provincial codes of the plates issued until September 2000. */
const PROVINCES = [
  'A', 'AB', 'AL', 'AV', 'B', 'BA', 'BI', 'BU', 'C', 'CA', 'CC', 'CE', 'CO',
  'CR', 'CS', 'CU', 'GC', 'GE', 'GI', 'GR', 'GU', 'H', 'HU', 'IB', 'J', 'L',
  'LE', 'LO', 'LU', 'M', 'MA', 'ML', 'MU', 'NA', 'O', 'OR', 'OU', 'P', 'PM',
  'PO', 'S', 'SA', 'SE', 'SG', 'SO', 'SS', 'T', 'TE', 'TF', 'TO', 'V', 'VA',
  'VI', 'Z', 'ZA',
].join('|');

/**
 * No validation: a plate has no check digit. The current format only uses
 * consonants without Ñ or Q, which filters most words, and both patterns are
 * case-sensitive so `1234 bcd` in running prose is left alone. Below the
 * threshold on their own, like `DE_KFZ`: they need a context word.
 */
export const ES_VEHICLE_PLATE = defineEntity({
  // ── Classification ──────────────────────────
  name: 'ES_VEHICLE_PLATE',
  country: 'ES',
  kind: 'VEHICLE_PLATE',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Spanish vehicle registration plate',
  patterns: [
    {
      name: 'current',
      regex: String.raw`\b[0-9]{4}[\s-]?[BCDFGHJKLMNPRSTVWXYZ]{3}\b`,
      score: 0.3,
      caseSensitive: true,
    },
    {
      name: 'provincial',
      regex: String.raw`\b(?:${PROVINCES})[\s-]?[0-9]{4}[\s-]?[A-Z]{1,2}\b`,
      score: 0.2,
      caseSensitive: true,
    },
  ],
  context: ['matrícula', 'matricula', 'vehículo', 'coche', 'placa'],
});
