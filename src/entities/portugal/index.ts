import type { EntityDefinition } from '../../core/types';
import { PT_CITIZEN_CARD } from './citizen-card';
import { PT_POSTAL_CODE } from './postal-code';
import { PT_VEHICLE_PLATE } from './vehicle-plate';

/**
 * Portugal, in registry order.
 *
 * The `satisfies` rejects an entity that declares a country other than `PT`.
 */
export const PORTUGAL = [
  PT_CITIZEN_CARD,
  PT_POSTAL_CODE,
  PT_VEHICLE_PLATE,
] as const satisfies readonly (EntityDefinition & { country: 'PT' })[];
