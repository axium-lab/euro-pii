import { defineEntity } from '../../core/entity';
import { peselValid } from './checksums';

export const PL_PESEL = defineEntity({
  // ── Classification ──────────────────────────
  name: 'PL_PESEL',
  country: 'PL',
  category: 'NATIONAL_ID',

  // ── Detection ───────────────────────────────
  description: 'Polish national identification number',
  patterns: [
    {
      // The century lives inside the month group: 01-12 (1900), 21-32 (2000),
      // 41-52 (2100)…
      name: 'pesel',
      regex: String.raw`[0-9]{2}([02468][1-9]|[13579][012])(0[1-9]|1[0-9]|2[0-9]|3[01])[0-9]{5}`,
      score: 0.4,
    },
  ],
  validation: { kind: 'checksum', run: (value) => peselValid(value) },
  context: ['pesel', 'numer pesel'],
});
