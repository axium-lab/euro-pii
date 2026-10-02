import { realDate } from '../../core/checksums';

/** The separator encodes the century. Three groups, no table needed. */
const century = (separator: string): number | undefined =>
  separator === '+'
    ? 1800
    : '-YXWVU'.includes(separator)
      ? 1900
      : 'ABCDEF'.includes(separator)
        ? 2000
        : undefined;

const FI_CONTROL = '0123456789ABCDEFHJKLMNPRSTUVWXY';

export function hetuValid(raw: string): boolean {
  const text = raw.toUpperCase();
  if (text.length !== 11) return false;

  const base = century(text[6] ?? '');
  if (base === undefined) return false;

  const day = Number(text.slice(0, 2));
  const month = Number(text.slice(2, 4));
  const year = base + Number(text.slice(4, 6));

  // Two traps at once: without resolving the century a two-digit year reads as
  // the 2000s and 290200+ (29 Feb 1800) would pass, and `new Date` normalizes
  // impossible dates instead of failing. `realDate` compares the parts back.
  if (!realDate(year, month, day)) return false;

  const number = Number(text.slice(0, 6) + text.slice(7, 10));

  return FI_CONTROL[number % 31] === text.at(-1);
}
