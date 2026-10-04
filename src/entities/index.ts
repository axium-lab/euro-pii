import type { Country, Entity } from '../core/types';
import { AUSTRIA } from './austria';
import { BELGIUM } from './belgium';
import { FINLAND } from './finland';
import { FRANCE } from './france';
import { GERMANY } from './germany';
import { GLOBAL } from './global';
import { ITALY } from './italy';
import { NETHERLANDS } from './netherlands';
import { POLAND } from './poland';
import { PORTUGAL } from './portugal';
import { SPAIN } from './spain';
import { SWEDEN } from './sweden';
import { UNITED_KINGDOM } from './united-kingdom';

/**
 * Every entity, in registry order: the countries in this order, and each one
 * in the order of its own `index.ts`.
 *
 * This list IS the catalog. Each entity file declares its name, country and
 * kind, and everything else is derived from here, so adding an entity is
 * two steps: create its file and list it in the `index.ts` of its country.
 *
 * European scope: the multi-country entities plus Spain, Germany, the United
 * Kingdom, Italy, Sweden, Finland and Poland — the seven countries the source
 * document covers — and France, the Netherlands, Portugal, Belgium and
 * Austria, limited to the identifiers that cannot be confused with another
 * entity. Two entities of the original scope are left out on purpose:
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
  ...FRANCE,
  ...NETHERLANDS,
  ...PORTUGAL,
  ...BELGIUM,
  ...AUSTRIA,
] as const;

/** Derived from the definitions: the union of every name, not `string`. */
export type EntityName = (typeof ENTITIES)[number]['name'];

export const REGISTRY: readonly Entity[] = ENTITIES;

/** Lookup by name, without walking the array. */
export const BY_NAME = Object.fromEntries(
  REGISTRY.map((entity) => [entity.name, entity]),
) as Record<EntityName, Entity>;

/** Every name, in registry order. */
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
  GLOBAL: namesOf('GLOBAL'),
  ES: namesOf('ES'),
  DE: namesOf('DE'),
  GB: namesOf('GB'),
  IT: namesOf('IT'),
  SE: namesOf('SE'),
  FI: namesOf('FI'),
  PL: namesOf('PL'),
  FR: namesOf('FR'),
  NL: namesOf('NL'),
  PT: namesOf('PT'),
  BE: namesOf('BE'),
  AT: namesOf('AT'),
};
