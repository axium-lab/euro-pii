import type { EntityDefinition } from '../../core/types';
import { ICAO_PATTERN, icaoValidation } from './icao';

export const DE_PASSPORT: EntityDefinition = {
  name: 'DE_PASSPORT',
  description: 'German passport number',
  patterns: [{ name: 'icao', regex: ICAO_PATTERN, score: 0.4 }],
  validation: icaoValidation,
  context: ['pass', 'passnummer', 'reisepass', 'passport'],
};
