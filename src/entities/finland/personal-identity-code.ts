import type { EntityDefinition } from '../../core/types';
import { hetuValid } from './checksums';

/** Delimited and free patterns, same technique as SE_PERSONNUMMER. */
const FI_PATTERN = String.raw`([0-9]{6})([-+ABCDEFYXWVU])([0-9]{3})([0123456789ABCDEFHJKLMNPRSTUVWXY])`;

export const FI_PERSONAL_IDENTITY_CODE: EntityDefinition = {
  name: 'FI_PERSONAL_IDENTITY_CODE',
  description: 'Finnish personal identity code',
  patterns: [
    { name: 'delimited', regex: String.raw`\b${FI_PATTERN}\b`, score: 0.5 },
    { name: 'free', regex: FI_PATTERN, score: 0.1 },
  ],
  validation: { kind: 'checksum', run: (_value, raw) => hetuValid(raw) },
  context: ['henkilötunnus', 'hetu', 'personal identity code'],
};
