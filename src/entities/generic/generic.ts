import { createHash } from 'node:crypto';

import { luhnValid, mod97 } from '../../core/checksums';
import { sanitize } from '../../core/sanitize';
import type { EntityDefinition, Validation } from '../../core/types';

const MONTHS = 'JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC';

// ── CREDIT_CARD ─────────────────────────────────────────────────────────────

export const CREDIT_CARD: EntityDefinition = {
  name: 'CREDIT_CARD',
  description: 'Payment card number',
  patterns: [
    {
      name: 'card',
      regex: String.raw`\b(?!1\d{12}(?!\d))((4\d{3})|(5[0-5]\d{2})|(6\d{3})|(1\d{3})|(3\d{3}))[- ]?(\d{3,4})[- ]?(\d{3,4})[- ]?(\d{3,5})\b`,
      score: 0.3,
    },
  ],
  validation: { kind: 'checksum', run: (value) => luhnValid(value) },
  context: ['credit card', 'visa', 'mastercard', 'amex', 'tarjeta', 'cvv'],
};

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

export const CRYPTO: EntityDefinition = {
  name: 'CRYPTO',
  description: 'Bitcoin wallet address',
  patterns: [
    {
      name: 'address',
      regex: String.raw`(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}`,
      score: 0.5,
      // Base58 is case-sensitive: 'l' and 'I' are not in the alphabet.
      caseSensitive: true,
    },
  ],
  validation: {
    kind: 'checksum',
    // bech32 (bc1…) uses a different checksum, so it only gets to be plausible.
    run: (value) =>
      value.toLowerCase().startsWith('bc1') ? null : base58CheckValid(value),
  },
  context: ['bitcoin', 'wallet', 'btc', 'crypto', 'cartera'],
};

// ── EMAIL_ADDRESS ───────────────────────────────────────────────────────────

export const EMAIL_ADDRESS: EntityDefinition = {
  name: 'EMAIL_ADDRESS',
  description: 'Email address',
  patterns: [
    {
      name: 'email',
      regex: String.raw`\b((([!#$%&'*+\-/=?^_\`{|}~\w])|([!#$%&'*+\-/=?^_\`{|}~\w][!#$%&'*+\-/=?^_\`{|}~\.\w]{0,}[!#$%&'*+\-/=?^_\`{|}~\w]))[@]\w+(?:-+\w+)*(?:\.\w+(?:-+\w+)*)+)\b`,
      score: 0.5,
    },
  ],
  // Upstream resolves the domain against a real suffix list. Without that
  // list this can only reject a shape no domain has, so it is a filter.
  validation: {
    kind: 'filter',
    run: (value) => {
      const domain = value.split('@').at(-1) ?? '';
      return /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain)
        ? null
        : false;
    },
  },
  context: ['email', 'correo', 'e-mail', 'mail'],
};

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

export const IBAN_CODE: EntityDefinition = {
  name: 'IBAN_CODE',
  description: 'International bank account number',
  patterns: [
    {
      /**
       * The trailing groups only take DIGITS, and that is a fix over the source
       * pattern, which allows `[A-Z0-9]` there.
       *
       * With letters allowed, a space plus any short word gets absorbed:
       * `ES91 2100 0418 4502 0005 1332 y tarjeta` matched up to the `y`, which
       * both broke the checksum and swallowed the word out of the masked text.
       * Every European BBAN in the length table below carries its letters in the
       * leading groups, never in the final one to three characters.
       */
      name: 'iban',
      regex: String.raw`(?<![A-Z0-9])([A-Z]{2}[0-9]{2}(?:[ -]?[A-Z0-9]{4}){2,6})((?:[ -]?[0-9]{4})?)((?:[ -]?[0-9]{1,3})?)(?![A-Z0-9])`,
      score: 0.5,
    },
  ],
  validation: { kind: 'checksum', run: (value) => ibanValid(value) },
  context: ['iban', 'cuenta', 'account', 'bank', 'banco'],
};

// ── IP_ADDRESS ──────────────────────────────────────────────────────────────

const OCTET = String.raw`(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)`;

export const IP_ADDRESS: EntityDefinition = {
  name: 'IP_ADDRESS',
  description: 'IP address',
  patterns: [
    {
      name: 'ipv4',
      regex: String.raw`\b${OCTET}(?:\.${OCTET}){3}(?:/(?:[0-2]?[0-9]|3[0-2]))?\b`,
      score: 0.6,
    },
    {
      // Only the full eight-group form. The compressed forms (`::`) need a real
      // parser to tell them from a MAC address or a time range, and the source
      // document recommends delegating that rather than replicating 5 patterns.
      name: 'ipv6-full',
      regex: String.raw`(?<![0-9A-Fa-f:])(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}(?![0-9A-Fa-f:])`,
      score: 0.6,
    },
  ],
  context: ['ip', 'address', 'host', 'servidor', 'direccion'],
};

// ── MAC_ADDRESS ─────────────────────────────────────────────────────────────

const macCheck = (value: string): Validation => {
  const hex = value.replace(/[:.-]/g, '');
  if (hex.length !== 12) return false;
  if (/^(?:00){6}$/i.test(hex) || /^(?:FF){6}$/i.test(hex)) return false;
  return null;
};

export const MAC_ADDRESS: EntityDefinition = {
  name: 'MAC_ADDRESS',
  description: 'Hardware MAC address',
  patterns: [
    {
      // `\1` is a backreference: the separator has to stay the same all along,
      // so AA:BB-CC:DD-EE:FF is rejected.
      name: 'colon-or-dash',
      regex: String.raw`\b[0-9A-Fa-f]{2}([:-])(?:[0-9A-Fa-f]{2}\1){4}[0-9A-Fa-f]{2}\b`,
      score: 0.6,
    },
    {
      name: 'cisco',
      regex: String.raw`\b[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\b`,
      score: 0.6,
    },
  ],
  validation: { kind: 'filter', run: macCheck },
  context: ['mac', 'hardware address', 'ethernet'],
};

// ── UUID ────────────────────────────────────────────────────────────────────

export const UUID: EntityDefinition = {
  name: 'UUID',
  description: 'RFC 4122 universally unique identifier',
  patterns: [
    {
      name: 'uuid',
      regex: String.raw`\b[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}\b`,
      score: 0.5,
    },
  ],
  validation: {
    kind: 'filter',
    run: (value) => {
      const hex = value.replace(/-/g, '');
      if (hex === '0'.repeat(32)) return false; // the nil UUID
      const version = Number.parseInt(hex[12] ?? '0', 16);
      const variant = Number.parseInt(hex[16] ?? '0', 16);
      if (version < 1 || version > 8) return false;
      if (variant < 8 || variant > 11) return false; // 10xx binary prefix
      return null;
    },
  },
  context: ['uuid', 'guid', 'identifier'],
};

// ── DATE_TIME ───────────────────────────────────────────────────────────────

const DAY = String.raw`([1-9]|0[1-9]|[1-2][0-9]|3[0-1])`;
const MONTH = String.raw`([1-9]|0[1-9]|1[0-2])`;
const YEAR = String.raw`(\d{4}|\d{2})`;

export const DATE_TIME: EntityDefinition = {
  name: 'DATE_TIME',
  description: 'Date or timestamp',
  patterns: [
    {
      // The source alternation was elided in the reference; this is the full
      // ISO 8601 form with optional fraction and optional zone.
      name: 'iso-8601',
      regex: String.raw`\b\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?(?:[+-][0-2]\d:[0-5]\d|Z)?\b`,
      score: 0.8,
    },
    // dd/mm goes first on purpose: an ambiguous 03/04/2026 covers the exact
    // same span with the same score, so whichever is listed first wins the
    // tie-break. European reading is the sensible default here.
    {
      name: 'dd/mm/yyyy',
      regex: String.raw`\b(${DAY}/${MONTH}/${YEAR})\b`,
      score: 0.6,
    },
    {
      name: 'mm/dd/yyyy',
      regex: String.raw`\b(${MONTH}/${DAY}/${YEAR})\b`,
      score: 0.6,
    },
    {
      name: 'yyyy/mm/dd',
      regex: String.raw`\b(\d{4}/${MONTH}/${DAY})\b`,
      score: 0.6,
    },
    {
      name: 'dd-mm-yyyy',
      regex: String.raw`\b(${DAY}-${MONTH}-\d{4})\b`,
      score: 0.6,
    },
    {
      name: 'mm-dd-yyyy',
      regex: String.raw`\b(${MONTH}-${DAY}-\d{4})\b`,
      score: 0.6,
    },
    {
      name: 'yyyy-mm-dd',
      regex: String.raw`\b(\d{4}-${MONTH}-${DAY})\b`,
      score: 0.6,
    },
    {
      name: 'dd.mm.yyyy',
      regex: String.raw`\b(${DAY}\.${MONTH}\.${YEAR})\b`,
      score: 0.6,
    },
    {
      name: 'dd-MMM-yyyy',
      regex: String.raw`\b(${DAY}-(${MONTHS})-${YEAR})\b`,
      score: 0.6,
    },
    {
      name: 'MMM-yyyy',
      regex: String.raw`\b((${MONTHS})-${YEAR})\b`,
      score: 0.6,
    },
    { name: 'dd-MMM', regex: String.raw`\b(${DAY}-(${MONTHS}))\b`, score: 0.6 },
    { name: 'mm/yyyy', regex: String.raw`\b(${MONTH}/\d{4})\b`, score: 0.2 },
    { name: 'mm/yy', regex: String.raw`\b(${MONTH}/\d{2})\b`, score: 0.1 },
  ],
  context: ['date', 'fecha', 'nacimiento', 'birth', 'expira', 'caducidad'],
};
