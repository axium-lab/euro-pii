import type { EntityDefinition } from '../../core/types';
import { IT_DRIVER_LICENSE } from './driver-license';
import { IT_FISCAL_CODE } from './fiscal-code';
import { IT_IDENTITY_CARD } from './identity-card';
import { IT_PASSPORT } from './passport';
import { IT_VAT_CODE } from './vat-code';

/**
 * Italy, in registry order.
 *
 * The `satisfies` rejects an entity that declares a country other than `IT`.
 */
export const ITALY = [
  IT_FISCAL_CODE,
  IT_VAT_CODE,
  IT_DRIVER_LICENSE,
  IT_IDENTITY_CARD,
  IT_PASSPORT,
] as const satisfies readonly (EntityDefinition & { country: 'IT' })[];
