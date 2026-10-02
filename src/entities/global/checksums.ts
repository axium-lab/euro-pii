import { createHash } from 'node:crypto';

import { mod97 } from '../../core/checksums';

// ── CRYPTO ──────────────────────────────────────────────────────────────────

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** Base58 decode. Returns null when a character is outside the alphabet. */
function base58Decode(value: string): Uint8Array | null {
  let big = 0n;

  for (const char of value) {
    const index = BASE58.indexOf(char);
    if (index < 0) return null;
    big = big * 58n + BigInt(index);
  }

  const bytes: number[] = [];
  while (big > 0n) {
    bytes.unshift(Number(big % 256n));
    big /= 256n;
  }

  // Every leading '1' encodes a leading zero byte.
  for (const char of value) {
    if (char !== '1') break;
    bytes.unshift(0);
  }

  return new Uint8Array(bytes);
}

const sha256 = (data: Uint8Array): Uint8Array =>
  new Uint8Array(createHash('sha256').update(data).digest());

/** base58check: the last 4 bytes are the first 4 of sha256(sha256(payload)). */
export function base58CheckValid(value: string): boolean {
  const decoded = base58Decode(value);
  if (decoded === null || decoded.length < 5) return false;

  const payload = decoded.subarray(0, decoded.length - 4);
  const checksum = decoded.subarray(decoded.length - 4);
  const expected = sha256(sha256(payload));

  return checksum.every((byte, i) => byte === expected[i]);
}

// ── IBAN_CODE ───────────────────────────────────────────────────────────────

/**
 * Fixed length per country. Only the ones we are sure about: an unknown prefix
 * falls through to the mod 97 check, which is the real test anyway. A wrong
 * length here would reject valid IBANs, so leaving a country out is safer than
 * guessing it.
 */
const IBAN_LENGTHS: Record<string, number> = {
  AT: 20,
  BE: 16,
  CH: 21,
  DE: 22,
  DK: 18,
  ES: 24,
  FI: 18,
  FR: 27,
  GB: 22,
  GR: 27,
  IE: 22,
  IT: 27,
  LU: 20,
  NL: 18,
  NO: 15,
  PL: 28,
  PT: 25,
  SE: 24,
};

export function ibanValid(raw: string): boolean {
  const iban = raw.replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) return false;

  const expected = IBAN_LENGTHS[iban.slice(0, 2)];
  if (expected !== undefined && iban.length !== expected) return false;

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = [...rearranged]
    .map((char) =>
      char >= 'A' && char <= 'Z' ? String(char.charCodeAt(0) - 55) : char,
    )
    .join('');

  return mod97(numeric) === 1;
}
