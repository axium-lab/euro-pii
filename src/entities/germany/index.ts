import type { EntityDefinition } from '../../core/types';
import { DE_BSNR } from './bsnr';
import { DE_FUEHRERSCHEIN } from './fuehrerschein';
import { DE_HANDELSREGISTER } from './handelsregister';
import { DE_HEALTH_INSURANCE } from './health-insurance';
import { DE_ID_CARD } from './id-card';
import { DE_KFZ } from './kfz';
import { DE_LANR } from './lanr';
import { DE_PASSPORT } from './passport';
import { DE_PLZ } from './plz';
import { DE_SOCIAL_SECURITY } from './social-security';
import { DE_TAX_ID } from './tax-id';
import { DE_TAX_NUMBER } from './tax-number';
import { DE_VAT_ID } from './vat-id';

/**
 * Germany, in registry order.
 *
 * The `satisfies` rejects an entity that declares a country other than `DE`.
 */
export const GERMANY = [
  DE_BSNR,
  DE_LANR,
  DE_HEALTH_INSURANCE,
  DE_ID_CARD,
  DE_PASSPORT,
  DE_SOCIAL_SECURITY,
  DE_TAX_ID,
  DE_VAT_ID,
  DE_TAX_NUMBER,
  DE_FUEHRERSCHEIN,
  DE_HANDELSREGISTER,
  DE_PLZ,
  DE_KFZ,
] as const satisfies readonly (EntityDefinition & { country: 'DE' })[];
