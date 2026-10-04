import type { EntityDefinition } from '../../core/types';
import { FR_NIR } from './nir';
import { FR_PASSPORT } from './passport';
import { FR_VAT_ID } from './vat-id';
import { FR_VEHICLE_PLATE } from './vehicle-plate';

/**
 * France, in registry order.
 *
 * The `satisfies` rejects an entity that declares a country other than `FR`.
 */
export const FRANCE = [
  FR_NIR,
  FR_VAT_ID,
  FR_PASSPORT,
  FR_VEHICLE_PLATE,
] as const satisfies readonly (EntityDefinition & { country: 'FR' })[];
