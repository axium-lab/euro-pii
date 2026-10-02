import type { EntityDefinition } from '../../core/types';
import { CREDIT_CARD } from './credit-card';
import { CRYPTO } from './crypto';
import { DATE_TIME } from './date-time';
import { EMAIL_ADDRESS } from './email-address';
import { IBAN_CODE } from './iban-code';
import { IP_ADDRESS } from './ip-address';
import { MAC_ADDRESS } from './mac-address';
import { UUID } from './uuid';

/**
 * Entities no state issues, in registry order.
 *
 * The `satisfies` rejects an entity that declares a country other than `EU`.
 */
export const GLOBAL = [
  CREDIT_CARD,
  CRYPTO,
  DATE_TIME,
  EMAIL_ADDRESS,
  IBAN_CODE,
  IP_ADDRESS,
  MAC_ADDRESS,
  UUID,
] as const satisfies readonly (EntityDefinition & { country: 'EU' })[];
