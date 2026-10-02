import type { EntityDefinition } from '../../core/types';
import { SE_ORGANISATIONSNUMMER } from './organisationsnummer';
import { SE_PERSONNUMMER } from './personnummer';

/**
 * Sweden, in registry order.
 *
 * The `satisfies` rejects an entity that declares a country other than `SE`.
 */
export const SWEDEN = [
  SE_PERSONNUMMER,
  SE_ORGANISATIONSNUMMER,
] as const satisfies readonly (EntityDefinition & { country: 'SE' })[];
