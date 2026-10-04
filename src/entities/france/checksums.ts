import { mod97 } from '../../core/checksums';
import type { Validation } from '../../core/types';

/**
 * Sex (1) + year (2) + month (2) + department (2) + commune (3) + order (3) +
 * key (2). The key is 97 - (the 13 characters mod 97), once Corsica is turned
 * back into digits: `2A` counts as 19 and `2B` as 18.
 *
 * Takes the raw match: the pattern only accepts the spaced form, and the
 * department may carry a letter, so only separators are stripped here.
 */
export function nirValid(raw: string): Validation {
  const text = raw.replace(/[^0-9AB]/gi, '').toUpperCase();

  if (!/^[0-9]{5}(?:[0-9]{2}|2A|2B)[0-9]{8}$/.test(text)) return false;

  const body = text
    .slice(0, 13)
    .replace(/^(.{5})2A/, '$119')
    .replace(/^(.{5})2B/, '$118');

  return 97 - mod97(body) === Number(text.slice(13));
}

/**
 * `FR` + key (2) + SIREN (9). A numeric key is (12 + 3 × (SIREN mod 97)) mod 97,
 * the same as (SIREN followed by `12`) mod 97.
 *
 * The newer alphanumeric keys are not checked here: `null`, and the match
 * keeps its base score.
 */
export function frVatValid(raw: string): Validation {
  const text = raw.replace(/[^0-9A-Z]/gi, '').toUpperCase().replace(/^FR/, '');

  if (!/^[0-9A-Z]{2}[0-9]{9}$/.test(text)) return false;

  const key = text.slice(0, 2);
  if (!/^[0-9]{2}$/.test(key)) return null;

  return mod97(`${text.slice(2)}12`) === Number(key);
}
