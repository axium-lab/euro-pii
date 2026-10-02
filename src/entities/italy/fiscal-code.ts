import type { EntityDefinition } from '../../core/types';
import { fiscalCodeValid } from './checksums';

/**
 * The most elaborate pattern of the reference. It encodes the consonant and
 * vowel charsets of surname and given name, plus the month-day with the digit
 * for letter substitution the Italian system uses (L=0, M=1, N=2, P=3…).
 */
const FISCAL_CODE_PATTERN = String.raw`((?:[A-Z][AEIOU][AEIOUX]|[AEIOU]X{2}|[B-DF-HJ-NP-TV-Z]{2}[A-Z]){2}(?:[\dLMNP-V]{2}(?:[A-EHLMPR-T](?:[04LQ][1-9MNP-V]|[15MR][\dLMNP-V]|[26NS][0-8LMNP-U])|[DHPS][37PT][0L]|[ACELMRT][37PT][01LM]|[AC-EHLMPR-T][26NS][9V])|(?:[02468LNQSU][048LQU]|[13579MPRTV][26NS])B[26NS][9V])(?:[A-MZ][1-9MNP-V][\dLMNP-V]{2}|[A-M][0L](?:[1-9MNP-V][\dLMNP-V]|[0L][1-9MNP-V]))[A-Z])`;

export const IT_FISCAL_CODE: EntityDefinition = {
  name: 'IT_FISCAL_CODE',
  description: 'Italian fiscal code',
  patterns: [
    { name: 'codice-fiscale', regex: FISCAL_CODE_PATTERN, score: 0.3 },
  ],
  validation: { kind: 'checksum', run: (value) => fiscalCodeValid(value) },
  context: ['codice fiscale', 'fiscal code', 'cf'],
};
