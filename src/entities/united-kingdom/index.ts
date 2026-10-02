import type { EntityDefinition } from '../../core/types';
import { GB_DRIVING_LICENCE } from './driving-licence';
import { GB_NHS } from './nhs';
import { GB_NINO } from './nino';
import { GB_PASSPORT } from './passport';
import { GB_POSTCODE } from './postcode';
import { GB_VEHICLE_REGISTRATION } from './vehicle-registration';

/**
 * United Kingdom, in registry order.
 *
 * The `satisfies` rejects an entity that declares a country other than `GB`.
 */
export const UNITED_KINGDOM = [
  GB_NHS,
  GB_NINO,
  GB_DRIVING_LICENCE,
  GB_VEHICLE_REGISTRATION,
  GB_PASSPORT,
  GB_POSTCODE,
] as const satisfies readonly (EntityDefinition & { country: 'GB' })[];
