import type { EntityName } from '../entities';

export type { EntityName } from '../entities';

/** What an entity IS, whatever the country that issues it. */
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

/** Who issues the entity. `EU` holds the ones no state issues. */
export type Country = 'EU' | 'ES' | 'DE' | 'GB' | 'IT' | 'SE' | 'FI' | 'PL';

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
 * definitions: each file declares it `as const satisfies EntityDefinition`,
 * which keeps the literal and checks everything else.
 */
export interface EntityDefinition {
  name: string;
  country: Country;
  category: Category;
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
  category: Category;
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

export type ScanResult =
  | { blocked: false; anonymized_text: string; entities: Detection[] }
  | { blocked: true; entities: Detection[] };

export interface Methods {
  text: (text: string, anonymizes: boolean) => ScanResult;
  supported_entities: () => Entity[];
}
