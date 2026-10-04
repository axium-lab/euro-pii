import type { EntityDefinition } from '../../core/types';
import { ES_CCC } from './ccc';
import { ES_CIF } from './cif';
import { ES_NIE } from './nie';
import { ES_NIF } from './nif';
import { ES_NUSS } from './nuss';
import { ES_PASSPORT } from './passport';
import { ES_VAT_ID } from './vat-id';
import { ES_VEHICLE_PLATE } from './vehicle-plate';

/**
 * Spain, in registry order.
 *
 * The `satisfies` rejects an entity that declares a country other than `ES`.
 */
export const SPAIN = [
  ES_NIF,
  ES_NIE,
  ES_PASSPORT,
  ES_CIF,
  ES_VAT_ID,
  ES_NUSS,
  ES_CCC,
  ES_VEHICLE_PLATE,
] as const satisfies readonly (EntityDefinition & { country: 'ES' })[];
