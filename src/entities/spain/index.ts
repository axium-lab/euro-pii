import type { EntityDefinition } from '../../core/types';
import { ES_NIE } from './nie';
import { ES_NIF } from './nif';
import { ES_PASSPORT } from './passport';

/**
 * Spain, in registry order.
 *
 * The `satisfies` rejects an entity that declares a country other than `ES`.
 */
export const SPAIN = [
  ES_NIF,
  ES_NIE,
  ES_PASSPORT,
] as const satisfies readonly (EntityDefinition & { country: 'ES' })[];
