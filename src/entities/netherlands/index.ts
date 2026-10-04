import type { EntityDefinition } from '../../core/types';
import { NL_POSTCODE } from './postcode';
import { NL_VAT_ID } from './vat-id';
import { NL_VEHICLE_PLATE } from './vehicle-plate';

/**
 * The Netherlands, in registry order.
 *
 * The `satisfies` rejects an entity that declares a country other than `NL`.
 */
export const NETHERLANDS = [
  NL_VAT_ID,
  NL_POSTCODE,
  NL_VEHICLE_PLATE,
] as const satisfies readonly (EntityDefinition & { country: 'NL' })[];
