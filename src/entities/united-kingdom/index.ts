import type { EntityDefinition } from '../../core/types';
import { UK_DRIVING_LICENCE } from './driving-licence';
import { UK_NHS } from './nhs';
import { UK_NINO } from './nino';
import { UK_PASSPORT } from './passport';
import { UK_POSTCODE } from './postcode';
import { UK_VEHICLE_REGISTRATION } from './vehicle-registration';

/**
 * United Kingdom, in registry order.
 *
 * The `satisfies` rejects an entity that declares a country other than `GB`.
 */
export const UNITED_KINGDOM = [
  UK_NHS,
  UK_NINO,
  UK_DRIVING_LICENCE,
  UK_VEHICLE_REGISTRATION,
  UK_PASSPORT,
  UK_POSTCODE,
] as const satisfies readonly (EntityDefinition & { country: 'GB' })[];
