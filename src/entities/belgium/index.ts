import type { EntityDefinition } from '../../core/types';
import { BE_COMPANY_ID } from './company-id';
import { BE_EID_CARD } from './eid-card';
import { BE_NATIONAL_NUMBER } from './national-number';
import { BE_VAT_ID } from './vat-id';

/**
 * Belgium, in registry order.
 *
 * The `satisfies` rejects an entity that declares a country other than `BE`.
 */
export const BELGIUM = [
  BE_NATIONAL_NUMBER,
  BE_EID_CARD,
  BE_COMPANY_ID,
  BE_VAT_ID,
] as const satisfies readonly (EntityDefinition & { country: 'BE' })[];
