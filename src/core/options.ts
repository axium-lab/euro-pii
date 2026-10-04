import { BY_NAME, CATALOG, REGISTRY } from '../entities';
import { NeriumError } from './errors';
import type {
  Action,
  Entity,
  EntityName,
  Kind,
  Policy,
  Selection,
  TextOptions,
} from './types';

const ACTIONS: ReadonlySet<string> = new Set<Action>(['mask', 'block', 'keep']);

const COUNTRIES: ReadonlySet<string> = new Set(Object.keys(CATALOG));

/**
 * Only the kinds some entity uses: `kinds: ['PHONE']` is a valid `Kind` but
 * could never select anything, so it throws like any other unknown value.
 */
const KINDS: ReadonlySet<string> = new Set(REGISTRY.map((entity) => entity.kind));

const NAMES: ReadonlySet<string> = new Set(Object.keys(BY_NAME));

/** The entities the selection asks for, in registry order. */
export function select(selection: Selection = {}): Entity[] {
  const { countries, kinds, entities, except } = selection;

  checkKnown(countries, COUNTRIES, 'country');
  checkKnown(kinds, KINDS, 'kind');
  checkKnown(entities, NAMES, 'entity');
  checkKnown(except, NAMES, 'entity');

  const chosen = REGISTRY.filter(
    (entity) =>
      (countries === undefined || countries.includes(entity.country)) &&
      (kinds === undefined || kinds.includes(entity.kind)) &&
      (entities === undefined || entities.includes(entity.name)) &&
      !except?.includes(entity.name),
  );

  if (chosen.length === 0) {
    throw new NeriumError({
      category: 'invalid_input',
      message: `No entity matches the selection ${JSON.stringify(selection)}.`,
    });
  }

  return chosen;
}

/**
 * The entities `text()` looks for: the selection plus every entity the policy
 * blocks explicitly, in registry order.
 */
export function plan(options: TextOptions = {}): Entity[] {
  const { policy = {}, ...selection } = options;

  checkPolicy(policy);

  const chosen = new Set(select(selection));
  const blocking = REGISTRY.filter(
    (entity) => explicitAction(policy, entity.name, entity.kind) === 'block',
  );

  const contradicted = blocking.filter((entity) =>
    selection.except?.includes(entity.name),
  );
  if (contradicted.length > 0) {
    throw new NeriumError({
      category: 'invalid_input',
      message: `Blocked by the policy and excluded by \`except\` at once: ${contradicted.map((entity) => entity.name).join(', ')}.`,
    });
  }

  for (const entity of blocking) chosen.add(entity);

  return REGISTRY.filter((entity) => chosen.has(entity));
}

export function actionOf(policy: Policy, name: EntityName, kind: Kind): Action {
  return explicitAction(policy, name, kind) ?? policy.default ?? 'mask';
}

/** The action written for this entity in the policy, ignoring `default`. */
function explicitAction(
  policy: Policy,
  name: EntityName,
  kind: Kind,
): Action | undefined {
  return policy.entities?.[name] ?? policy.kinds?.[kind];
}

/** Types do not reach plain JS callers or values read from config. */
function checkPolicy(policy: Policy): void {
  checkKnown(Object.keys(policy.kinds ?? {}), KINDS, 'kind');
  checkKnown(Object.keys(policy.entities ?? {}), NAMES, 'entity');

  const actions = [
    policy.default,
    ...Object.values(policy.kinds ?? {}),
    ...Object.values(policy.entities ?? {}),
  ].filter((action) => action !== undefined);

  checkKnown(actions, ACTIONS, 'action');
}

function checkKnown(
  values: readonly string[] | undefined,
  known: ReadonlySet<string>,
  what: 'country' | 'kind' | 'entity' | 'action',
): void {
  const unknown = (values ?? []).filter((value) => !known.has(value));
  if (unknown.length === 0) return;

  throw new NeriumError({
    category: what === 'entity' ? 'unknown_entity' : 'invalid_input',
    message: `Unknown ${what}: ${unknown.join(', ')}.`,
  });
}
