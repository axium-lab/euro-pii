import type { EntityName } from '../entities';

export type { EntityName } from '../entities';

/** What an entity IS, whatever the country that issues it. */
export type Kind =
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

/**
 * What sort of sensitive data an entity is, which is what most handling rules
 * hinge on.
 *
 * - `PERSONAL`: identifies or describes a natural person. The GDPR default.
 * - `FINANCIAL`: payment means and accounts (PCI DSS, fraud).
 * - `HEALTH`: health-related data, a GDPR art. 9 special category.
 * - `TECHNICAL`: identifies a machine or a system rather than a person.
 * - `CORPORATE`: identifies a company. Usually not personal data at all.
 *
 * When an entity could be either, it takes the more protective class: an
 * email address can be `info@company.com`, but the regex cannot tell it from a
 * person's, so it is `PERSONAL`.
 */
export type DataClass =
  | 'PERSONAL'
  | 'FINANCIAL'
  | 'HEALTH'
  | 'TECHNICAL'
  | 'CORPORATE';

/**
 * Whether the value singles out its subject on its own.
 *
 * - `DIRECT`: unique, it points at one person, company, account or device.
 * - `QUASI`: shared by many subjects, it only identifies combined with other
 *   data. Postcode, birth date and sex say little apart and single out most of
 *   a population together.
 *
 * When in doubt, `DIRECT`: `HRB 12345` repeats across courts, but the court
 * almost always sits next to it.
 */
export type Identifiability = 'DIRECT' | 'QUASI';

/** Who issues the entity. `GLOBAL` holds the ones no state issues. */
export type Country =
  | 'GLOBAL'
  | 'ES'
  | 'DE'
  | 'GB'
  | 'IT'
  | 'SE'
  | 'FI'
  | 'PL';

/** `true` = confirmed · `false` = rejected · `null` = cannot be decided. */
export type Validation = true | false | null;

export interface Pattern {
  /** Readable id. This is what ends up in `Detection.pattern`. */
  name: string;
  /** Regex source, without flags. The engine owns the flags. */
  regex: string;
  /** Base confidence of this pattern on its own, from 0 to 1. */
  score: number;
  /** Opts out of the `i` flag. Only `DE_KFZ` needs it. */
  caseSensitive?: boolean;
}

/**
 * An entity as its own file declares it.
 *
 * `name` is a plain `string` here because `EntityName` is derived FROM these
 * definitions: each file declares its entity through `defineEntity`, which
 * keeps that literal and checks everything else.
 */
export interface EntityDefinition {
  name: string;
  country: Country;
  kind: Kind;
  dataClass: DataClass;
  identifiability: Identifiability;
  description: string;
  patterns: readonly Pattern[];
  /**
   * `run` receives the match with separators already stripped, plus the raw
   * match for the few validations that need them: the Finnish code carries its
   * century in the separator (`+` means 1800), which sanitizing throws away.
   *
   * `kind: 'filter'` can only reject: the engine ignores a `true` from it.
   */
  validation?: {
    kind: 'checksum' | 'filter';
    run: (value: string, raw: string) => Validation;
  };
  /** Terms that raise the score when they show up near the match. */
  context?: readonly string[];
}

/** An entity of the registry: its name narrowed to the derived union. */
export interface Entity extends EntityDefinition {
  name: EntityName;
}

export interface Detection {
  entity: EntityName;
  kind: Kind;
  dataClass: DataClass;
  identifiability: Identifiability;
  country: Country;
  /** Offset into the ORIGINAL text, never into the anonymized one. */
  start: number;
  end: number;
  score: number;
  /** The match as it appears in the text, separators included. */
  value: string;
  /** `Pattern.name` of the pattern that matched. */
  pattern: string;
  confirmedBy: 'checksum' | 'context' | null;
}

/** What `anonymize()` does with a detection. */
export type Action = 'mask' | 'block' | 'keep';

/**
 * Which entities to look for. Leaving a field out does not restrict by it.
 *
 * The fields intersect: an entity is looked for only if it matches every field
 * present. `except` then removes names from whatever is left. A selection that
 * ends up empty throws, so a typo cannot quietly turn detection off.
 *
 * `GLOBAL` is a country like any other: `countries: ['ES']` leaves out IBAN,
 * email and cards, which are `GLOBAL`.
 */
export interface Selection {
  countries?: readonly Country[];
  kinds?: readonly Kind[];
  entities?: readonly EntityName[];
  except?: readonly EntityName[];
}

/**
 * What to do with each detection. The most specific key wins: `entities`, then
 * `kinds`, then `default`, which is `'mask'` when left out.
 *
 * A `'block'` written in `entities` or `kinds` is looked for even when the
 * selection leaves it out, so narrowing the selection can never switch a block
 * off. Putting that same entity in `except` throws. A `'block'` that only comes
 * from `default` stays within the selection.
 */
export interface Policy {
  default?: Action;
  kinds?: Partial<Record<Kind, Action>>;
  entities?: Partial<Record<EntityName, Action>>;
}

export interface AnonymizeOptions extends Selection {
  policy?: Policy;
}

export type AnonymizeResult =
  | { blocked: false; anonymized_text: string; entities: Detection[] }
  | { blocked: true; blocked_by: Detection[]; entities: Detection[] };

export interface Methods {
  scan: (text: string, selection?: Selection) => Detection[];
  anonymize: (text: string, options?: AnonymizeOptions) => AnonymizeResult;
  supported_entities: () => Entity[];
  supported_countries: () => Record<Country, EntityName[]>;
  supported_kinds: () => Partial<Record<Kind, EntityName[]>>;
}
