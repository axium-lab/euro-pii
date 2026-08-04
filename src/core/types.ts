import type { Category, Country, EntityName } from './catalog';

export type { Category, Country, EntityName } from './catalog';

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

/** An entity as its own module declares it, before the catalog is attached. */
export interface EntityDefinition {
  /** From the catalog union, not `string`: a typo does not compile. */
  name: EntityName;
  description: string;
  patterns: Pattern[];
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
  context?: string[];
}

export interface Entity extends EntityDefinition {
  category: Category;
  country: Country;
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
