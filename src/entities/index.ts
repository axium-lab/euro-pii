import type { Category, Country, Entity } from '../core/types';
import { FINLAND } from './finland';
import { GERMANY } from './germany';
import { GLOBAL } from './global';
import { ITALY } from './italy';
import { POLAND } from './poland';
import { SPAIN } from './spain';
import { SWEDEN } from './sweden';
import { UNITED_KINGDOM } from './united-kingdom';

/**
 * Every entity, in registry order: the countries in this order, and each one
 * in the order of its own `index.ts`.
 *
 * This list IS the catalog. Each entity file declares its name, country and
 * category, and everything else is derived from here, so adding an entity is
 * two steps: create its file and list it in the `index.ts` of its country.
 *
 * European scope: the multi-country entities plus Spain, Germany, the United
 * Kingdom, Italy, Sweden, Finland and Poland — the seven countries the source
 * document covers. Two entities of that scope are left out on purpose:
 * - `URL`, whose real pattern is an alternation of over 600 hand-written TLDs,
 *   ~8 KB on one line, incomplete by construction and with duplicates.
 * - `PHONE_NUMBER`, which upstream does not detect with a regex: it delegates
 *   to a library.
 */
const ENTITIES = [
  ...GLOBAL,
  ...SPAIN,
  ...GERMANY,
  ...UNITED_KINGDOM,
  ...ITALY,
  ...SWEDEN,
  ...FINLAND,
  ...POLAND,
] as const;

/** Derived from the definitions: the union of the 39 names, not `string`. */
export type EntityName = (typeof ENTITIES)[number]['name'];

export const REGISTRY: readonly Entity[] = ENTITIES;

/** Lookup by name, without walking the array. */
export const BY_NAME = Object.fromEntries(
  REGISTRY.map((entity) => [entity.name, entity]),
) as Record<EntityName, Entity>;

/** The 39 names in registry order. */
export const ENTITY_NAMES: readonly EntityName[] = REGISTRY.map(
  (entity) => entity.name,
);

const namesOf = (country: Country): readonly EntityName[] =>
  REGISTRY.filter((entity) => entity.country === country).map(
    (entity) => entity.name,
  );

/**
 * The names of each country, in registry order. Written out as a literal so a
 * country added to `Country` without listing it here does not compile.
 */
export const CATALOG: Record<Country, readonly EntityName[]> = {
  EU: namesOf('EU'),
  ES: namesOf('ES'),
  DE: namesOf('DE'),
  GB: namesOf('GB'),
  IT: namesOf('IT'),
  SE: namesOf('SE'),
  FI: namesOf('FI'),
  PL: namesOf('PL'),
};

export const CATEGORY_OF = Object.fromEntries(
  REGISTRY.map((entity) => [entity.name, entity.category]),
) as Record<EntityName, Category>;

export const COUNTRY_OF = Object.fromEntries(
  REGISTRY.map((entity) => [entity.name, entity.country]),
) as Record<EntityName, Country>;
