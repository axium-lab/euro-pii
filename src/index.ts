export { Nerium } from './nerium';
export { NeriumError, isNeriumError } from './core/errors';
export {
  BY_NAME,
  CATALOG,
  CATEGORY_OF,
  COUNTRY_OF,
  ENTITY_NAMES,
  REGISTRY,
} from './entities';

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
