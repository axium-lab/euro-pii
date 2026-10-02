import type { EntityDefinition } from '../../core/types';
import { itVatValid } from './checksums';

export const IT_VAT_CODE: EntityDefinition = {
  name: 'IT_VAT_CODE',
  description: 'Italian VAT code',
  patterns: [
    {
      // Eleven digits with optional spaces or underscores BETWEEN each one.
      // Extremely loose, hence the 0.1: only the checksum makes it usable.
      name: 'partita-iva',
      regex: String.raw`\b([0-9][ _]?){11}\b`,
      score: 0.1,
    },
  ],
  validation: { kind: 'checksum', run: (value) => itVatValid(value) },
  context: ['partita iva', 'vat', 'iva'],
};
