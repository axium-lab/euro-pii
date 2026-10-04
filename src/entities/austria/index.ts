import type { EntityDefinition } from '../../core/types';
import { AT_FIRMENBUCH } from './firmenbuch';
import { AT_SOCIAL_SECURITY } from './social-security';
import { AT_VAT_ID } from './vat-id';

/**
 * Austria, in registry order.
 *
 * The `satisfies` rejects an entity that declares a country other than `AT`.
 */
export const AUSTRIA = [
  AT_SOCIAL_SECURITY,
  AT_VAT_ID,
  AT_FIRMENBUCH,
] as const satisfies readonly (EntityDefinition & { country: 'AT' })[];
