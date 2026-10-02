import type { EntityDefinition } from '../../core/types';
import { PL_PESEL } from './pesel';

/**
 * Poland, in registry order.
 *
 * The `satisfies` rejects an entity that declares a country other than `PL`.
 */
export const POLAND = [
  PL_PESEL,
] as const satisfies readonly (EntityDefinition & { country: 'PL' })[];
