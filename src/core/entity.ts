import type { Country, EntityDefinition } from './types';

/**
 * Declares an entity, keeping only `name` and `country` as literal types.
 *
 * `name` has to stay a literal because `EntityName` is derived from it, and
 * `country` so each country's `index.ts` can reject an entity of another one.
 * Everything else is typed as plain `EntityDefinition`: `as const` would leak
 * every regex into the published types, and tweaking a pattern would change
 * the type declarations.
 */
export function defineEntity<const N extends string, const C extends Country>(
  definition: EntityDefinition & { name: N; country: C },
): EntityDefinition & { name: N; country: C } {
  return definition;
}
