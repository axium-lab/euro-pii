export { Nerium } from './nerium';
export { NeriumError, isNeriumError } from './core/errors';
export { BY_NAME, REGISTRY } from './entities/countries';
export { CATALOG, CATEGORY_OF, COUNTRY_OF, ENTITY_NAMES } from './core/catalog';

export type { NeriumErrorCategory, NeriumErrorParams } from './core/errors';
export type {
  Category,
  Country,
  Detection,
  Entity,
  EntityDefinition,
  EntityName,
  Methods,
  Pattern,
  ScanResult,
  Validation,
} from './core/types';
