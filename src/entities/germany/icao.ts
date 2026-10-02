import { icao731Valid } from '../../core/checksums';
import type { EntityDefinition } from '../../core/types';

/** DE_ID_CARD and DE_PASSPORT: identical pattern, identical checksum. */
export const ICAO_PATTERN = String.raw`\b[CFGHJKLMNPRTVWXYZ][CFGHJKLMNPRTVWXYZ0-9]{7}[0-9]\b`;

export const icaoValidation: EntityDefinition['validation'] = {
  kind: 'checksum',
  run: (value) => (value.length === 9 ? icao731Valid(value) : false),
};
