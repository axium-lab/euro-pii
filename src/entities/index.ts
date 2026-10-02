import {
  CATEGORY_OF,
  COUNTRY_OF,
  ENTITY_NAMES,
  type EntityName,
} from '../core/catalog';
import type { Entity, EntityDefinition } from '../core/types';
import { FI_PERSONAL_IDENTITY_CODE } from './finland';
import {
  DE_BSNR,
  DE_FUEHRERSCHEIN,
  DE_HANDELSREGISTER,
  DE_HEALTH_INSURANCE,
  DE_ID_CARD,
  DE_KFZ,
  DE_LANR,
  DE_PASSPORT,
  DE_PLZ,
  DE_SOCIAL_SECURITY,
  DE_TAX_ID,
  DE_TAX_NUMBER,
  DE_VAT_ID,
} from './germany';
import {
  CREDIT_CARD,
  CRYPTO,
  DATE_TIME,
  EMAIL_ADDRESS,
  IBAN_CODE,
  IP_ADDRESS,
  MAC_ADDRESS,
  UUID,
} from './global';
import {
  IT_DRIVER_LICENSE,
  IT_FISCAL_CODE,
  IT_IDENTITY_CARD,
  IT_PASSPORT,
  IT_VAT_CODE,
} from './italy';
import { PL_PESEL } from './poland';
import { ES_NIE, ES_NIF, ES_PASSPORT } from './spain';
import { SE_ORGANISATIONSNUMMER, SE_PERSONNUMMER } from './sweden';
import {
  UK_DRIVING_LICENCE,
  UK_NHS,
  UK_NINO,
  UK_PASSPORT,
  UK_POSTCODE,
  UK_VEHICLE_REGISTRATION,
} from './united-kingdom';

/**
 * La definicion de cada entidad del catalogo.
 *
 * Es un `Record<EntityName, EntityDefinition>` a proposito: si anades una
 * entidad a `CATALOG` y no la defines aqui, TypeScript no compila. Y si defines
 * una que no esta en el catalogo, tampoco.
 */
const DEFINITIONS: Record<EntityName, EntityDefinition> = {
  // multipais
  CREDIT_CARD,
  CRYPTO,
  DATE_TIME,
  EMAIL_ADDRESS,
  IBAN_CODE,
  IP_ADDRESS,
  MAC_ADDRESS,
  UUID,

  // Espana
  ES_NIF,
  ES_NIE,
  ES_PASSPORT,

  // Alemania
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

  // Reino Unido
  UK_NHS,
  UK_NINO,
  UK_DRIVING_LICENCE,
  UK_VEHICLE_REGISTRATION,
  UK_PASSPORT,
  UK_POSTCODE,

  // Italia
  IT_FISCAL_CODE,
  IT_VAT_CODE,
  IT_DRIVER_LICENSE,
  IT_IDENTITY_CARD,
  IT_PASSPORT,

  // Suecia, Finlandia, Polonia
  SE_PERSONNUMMER,
  SE_ORGANISATIONSNUMMER,
  FI_PERSONAL_IDENTITY_CODE,
  PL_PESEL,
};

/**
 * Alcance europeo: las multipais mas Espana, Alemania, Reino Unido, Italia,
 * Suecia, Finlandia y Polonia — los siete paises que cubre el documento fuente.
 *
 * Dos entidades de ese alcance quedan fuera a proposito:
 * - `URL`, cuyo patron real es una alternancia de mas de 600 TLD escritos a
 *   mano, ~8 KB en una linea, incompleta por construccion y con duplicados.
 * - `PHONE_NUMBER`, que upstream no detecta con regex: delega en una libreria.
 */
export const REGISTRY: readonly Entity[] = ENTITY_NAMES.map((name) => ({
  ...DEFINITIONS[name],
  category: CATEGORY_OF[name],
  country: COUNTRY_OF[name],
}));

/** Busqueda por nombre, sin recorrer el array. */
export const BY_NAME: Record<EntityName, Entity> = Object.fromEntries(
  REGISTRY.map((entity) => [entity.name, entity]),
) as Record<EntityName, Entity>;
