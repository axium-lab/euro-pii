/**
 * El catalogo: que entidades existen, de que pais son y de que tipo.
 *
 * Es la fuente unica de verdad, y esta pensado para que anadir un pais o una
 * entidad ROMPA LA COMPILACION hasta que este todo puesto:
 *
 * 1. Anades el pais o la entidad a `CATALOG`.
 * 2. `Country` y `EntityName` se derivan de ahi, no se escriben aparte.
 * 3. `CATEGORY_OF` es un `Record<EntityName, Category>`, asi que TypeScript
 *    exige la categoria de la entidad nueva.
 * 4. El registry es un `Record<EntityName, EntityDefinition>`, asi que exige
 *    tambien su definicion con sus patrones.
 *
 * Ninguno de esos cuatro pasos se puede olvidar en silencio.
 */

/** Que ES una entidad, independientemente del pais que la emita. */
export type Category =
  | 'BANK_ACCOUNT'
  | 'COMPANY_ID'
  | 'CRYPTO'
  | 'DATE'
  | 'DRIVER_LICENCE'
  | 'EMAIL'
  | 'HEALTH_ID'
  | 'IP_ADDRESS'
  | 'MAC_ADDRESS'
  | 'NATIONAL_ID'
  | 'PASSPORT'
  | 'PAYMENT_CARD'
  | 'PHONE'
  | 'POSTAL_CODE'
  | 'SOCIAL_SECURITY'
  | 'TAX_ID'
  | 'UUID'
  | 'VAT_ID'
  | 'VEHICLE_PLATE';

/** Las entidades de cada pais. `EU` son las que no son de ningun estado. */
export const CATALOG = {
  EU: [
    'CREDIT_CARD',
    'CRYPTO',
    'DATE_TIME',
    'EMAIL_ADDRESS',
    'IBAN_CODE',
    'IP_ADDRESS',
    'MAC_ADDRESS',
    'UUID',
  ],
  ES: ['ES_NIF', 'ES_NIE', 'ES_PASSPORT'],
  DE: [
    'DE_BSNR',
    'DE_LANR',
    'DE_HEALTH_INSURANCE',
    'DE_ID_CARD',
    'DE_PASSPORT',
    'DE_SOCIAL_SECURITY',
    'DE_TAX_ID',
    'DE_VAT_ID',
    'DE_TAX_NUMBER',
    'DE_FUEHRERSCHEIN',
    'DE_HANDELSREGISTER',
    'DE_PLZ',
    'DE_KFZ',
  ],
  GB: [
    'UK_NHS',
    'UK_NINO',
    'UK_DRIVING_LICENCE',
    'UK_VEHICLE_REGISTRATION',
    'UK_PASSPORT',
    'UK_POSTCODE',
  ],
  IT: [
    'IT_FISCAL_CODE',
    'IT_VAT_CODE',
    'IT_DRIVER_LICENSE',
    'IT_IDENTITY_CARD',
    'IT_PASSPORT',
  ],
  SE: ['SE_PERSONNUMMER', 'SE_ORGANISATIONSNUMMER'],
  FI: ['FI_PERSONAL_IDENTITY_CODE'],
  PL: ['PL_PESEL'],
} as const;

/** Derivado del catalogo: anadir una clave a `CATALOG` amplia este tipo. */
export type Country = keyof typeof CATALOG;

/** Derivado del catalogo: la union de los 39 nombres, no `string`. */
export type EntityName = (typeof CATALOG)[Country][number];

/**
 * La categoria de cada entidad.
 *
 * Al ser un `Record<EntityName, Category>`, anadir una entidad a `CATALOG` sin
 * clasificarla aqui es un error de compilacion, no un descubrimiento en
 * produccion.
 */
export const CATEGORY_OF: Record<EntityName, Category> = {
  // multipais
  CREDIT_CARD: 'PAYMENT_CARD',
  CRYPTO: 'CRYPTO',
  DATE_TIME: 'DATE',
  EMAIL_ADDRESS: 'EMAIL',
  IBAN_CODE: 'BANK_ACCOUNT',
  IP_ADDRESS: 'IP_ADDRESS',
  MAC_ADDRESS: 'MAC_ADDRESS',
  UUID: 'UUID',

  // Espana
  ES_NIF: 'TAX_ID',
  ES_NIE: 'NATIONAL_ID',
  ES_PASSPORT: 'PASSPORT',

  // Alemania
  DE_BSNR: 'HEALTH_ID',
  DE_LANR: 'HEALTH_ID',
  DE_HEALTH_INSURANCE: 'HEALTH_ID',
  DE_ID_CARD: 'NATIONAL_ID',
  DE_PASSPORT: 'PASSPORT',
  DE_SOCIAL_SECURITY: 'SOCIAL_SECURITY',
  DE_TAX_ID: 'TAX_ID',
  DE_VAT_ID: 'VAT_ID',
  DE_TAX_NUMBER: 'TAX_ID',
  DE_FUEHRERSCHEIN: 'DRIVER_LICENCE',
  DE_HANDELSREGISTER: 'COMPANY_ID',
  DE_PLZ: 'POSTAL_CODE',
  DE_KFZ: 'VEHICLE_PLATE',

  // Reino Unido
  UK_NHS: 'HEALTH_ID',
  UK_NINO: 'SOCIAL_SECURITY',
  UK_DRIVING_LICENCE: 'DRIVER_LICENCE',
  UK_VEHICLE_REGISTRATION: 'VEHICLE_PLATE',
  UK_PASSPORT: 'PASSPORT',
  UK_POSTCODE: 'POSTAL_CODE',

  // Italia
  IT_FISCAL_CODE: 'TAX_ID',
  IT_VAT_CODE: 'VAT_ID',
  IT_DRIVER_LICENSE: 'DRIVER_LICENCE',
  IT_IDENTITY_CARD: 'NATIONAL_ID',
  IT_PASSPORT: 'PASSPORT',

  // Suecia, Finlandia, Polonia
  SE_PERSONNUMMER: 'NATIONAL_ID',
  SE_ORGANISATIONSNUMMER: 'COMPANY_ID',
  FI_PERSONAL_IDENTITY_CODE: 'NATIONAL_ID',
  PL_PESEL: 'NATIONAL_ID',
};

/** El pais sale del catalogo, no se repite en ninguna otra tabla. */
export const COUNTRY_OF = Object.fromEntries(
  Object.entries(CATALOG).flatMap(([country, names]) =>
    names.map((name) => [name, country as Country]),
  ),
) as Record<EntityName, Country>;

/** Los 39 nombres en orden de catalogo. */
export const ENTITY_NAMES = Object.values(CATALOG).flat() as readonly EntityName[];
