import type { EntityDefinition } from '../../core/types';
import { FI_PERSONAL_IDENTITY_CODE } from './personal-identity-code';

/**
 * Finland, in registry order.
 *
 * The `satisfies` rejects an entity that declares a country other than `FI`.
 */
export const FINLAND = [
  FI_PERSONAL_IDENTITY_CODE,
] as const satisfies readonly (EntityDefinition & { country: 'FI' })[];
