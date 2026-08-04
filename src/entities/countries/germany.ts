import {
  deTaxIdValid,
  icao731Valid,
  iso7064Mod1110,
  weightedMod10,
} from '../../core/checksums';
import type { EntityDefinition, Validation } from '../../core/types';

/**
 * `[\w-]` cannot be used in the KFZ lookarounds: `\w` is ASCII, so `Ä` is not a
 * word character and the lookbehind fails to block. Writing the class out with
 * the umlauts fixes it — see docs/deteccion-regex.md:167.
 */
const KFZ_BOUNDARY_BEFORE = String.raw`(?<![A-Za-z0-9_ÄÖÜäöü-])`;
const KFZ_BOUNDARY_AFTER = String.raw`(?![A-Za-z0-9_ÄÖÜäöü])`;
const KFZ_TAIL = String.raw`[0-9]{1,4}[EH]?`;

// ── nine digits, twice ──────────────────────────────────────────────────────

/** Identifies a medical practice. Its algorithm is not public: never confirms. */
const bsnrCheck = (value: string): Validation => {
  if (value.length !== 9 || !/^[0-9]+$/.test(value)) return false;
  if (value === '000000000') return false;
  return null;
};

export const DE_BSNR: EntityDefinition = {
  name: 'DE_BSNR',
  description: 'German medical practice number',
  patterns: [{ name: 'bsnr', regex: String.raw`\b[0-9]{9}\b`, score: 0.2 }],
  validation: { kind: 'filter', run: bsnrCheck },
  context: ['bsnr', 'betriebsstättennummer', 'praxis'],
};

export const DE_LANR: EntityDefinition = {
  name: 'DE_LANR',
  description: 'German physician number',
  patterns: [{ name: 'lanr', regex: String.raw`\b[0-9]{9}\b`, score: 0.3 }],
  validation: {
    kind: 'checksum',
    run: (value) => weightedMod10(value, [4, 9, 4, 9, 4, 9], 6),
  },
  context: ['lanr', 'lebenslange arztnummer', 'arzt'],
};

// ── health insurance ────────────────────────────────────────────────────────

export const DE_HEALTH_INSURANCE: EntityDefinition = {
  name: 'DE_HEALTH_INSURANCE',
  description: 'German health insurance number',
  patterns: [
    { name: 'kvnr', regex: String.raw`\b[A-Z][0-9]{9}\b`, score: 0.3 },
  ],
  // The reference names a GKV checksum but does not spell out the algorithm.
  // Rather than guess at one, this only rejects shapes no KVNR has.
  validation: {
    kind: 'filter',
    run: (value) =>
      /^[A-Z][0-9]{9}$/i.test(value) && !/^[A-Z]0{9}$/i.test(value)
        ? null
        : false,
  },
  context: ['krankenversicherung', 'versichertennummer', 'kvnr'],
};

// ── ICAO documents: identical pattern, identical checksum ───────────────────

const ICAO_PATTERN = String.raw`\b[CFGHJKLMNPRTVWXYZ][CFGHJKLMNPRTVWXYZ0-9]{7}[0-9]\b`;

const icaoValidation: EntityDefinition['validation'] = {
  kind: 'checksum',
  run: (value) => (value.length === 9 ? icao731Valid(value) : false),
};

export const DE_ID_CARD: EntityDefinition = {
  name: 'DE_ID_CARD',
  description: 'German identity card number',
  patterns: [
    { name: 'icao', regex: ICAO_PATTERN, score: 0.4 },
    // The only shape that is exclusively an ID card and not a passport.
    { name: 'legacy-t', regex: String.raw`\bT[0-9]{8}\b`, score: 0.5 },
  ],
  validation: icaoValidation,
  context: ['personalausweis', 'ausweisnummer', 'identity card'],
};

export const DE_PASSPORT: EntityDefinition = {
  name: 'DE_PASSPORT',
  description: 'German passport number',
  patterns: [{ name: 'icao', regex: ICAO_PATTERN, score: 0.4 }],
  validation: icaoValidation,
  context: ['pass', 'passnummer', 'reisepass', 'passport'],
};

// ── social security ─────────────────────────────────────────────────────────

/**
 * Weights [2,1,2,5,7,1,2,1,2,1,2,1] over 12 digits: the letter expands to its
 * two-digit alphabet position, and the products are added digit by digit.
 */
export function deSocialSecurityValid(value: string): boolean {
  if (!/^[0-9]{8}[A-Z][0-9]{3}$/i.test(value)) return false;

  const letter = value[8]?.toUpperCase() ?? '';
  const position = letter.charCodeAt(0) - 64; // A -> 1 … Z -> 26
  const digits =
    value.slice(0, 8) + String(position).padStart(2, '0') + value.slice(9, 11);

  const WEIGHTS = [2, 1, 2, 5, 7, 1, 2, 1, 2, 1, 2, 1];
  let total = 0;

  for (let i = 0; i < WEIGHTS.length; i++) {
    const product = Number(digits[i] ?? 0) * (WEIGHTS[i] ?? 0);
    total += Math.floor(product / 10) + (product % 10);
  }

  return total % 10 === Number(value.at(-1));
}

export const DE_SOCIAL_SECURITY: EntityDefinition = {
  name: 'DE_SOCIAL_SECURITY',
  description: 'German social security number',
  patterns: [
    {
      name: 'strict',
      regex: String.raw`\b[0-9]{2}(0[1-9]|[12][0-9]|3[01]|5[1-9]|[67][0-9]|8[01])(0[1-9]|1[0-2])[0-9]{2}[A-Z][0-9]{2}[0-9]\b`,
      score: 0.5,
    },
    {
      name: 'relaxed',
      regex: String.raw`\b[0-9]{8}[A-Z][0-9]{3}\b`,
      score: 0.3,
    },
  ],
  validation: {
    kind: 'checksum',
    run: (value) => deSocialSecurityValid(value),
  },
  context: ['sozialversicherung', 'rentenversicherung', 'versicherungsnummer'],
};

// ── tax ─────────────────────────────────────────────────────────────────────

export const DE_TAX_ID: EntityDefinition = {
  name: 'DE_TAX_ID',
  description: 'German tax identification number',
  patterns: [
    { name: 'tax-id', regex: String.raw`\b[1-9][0-9]{10}\b`, score: 0.5 },
  ],
  validation: { kind: 'checksum', run: (value) => deTaxIdValid(value) },
  context: ['steuerliche identifikationsnummer', 'steuer-id', 'idnr'],
};

export const DE_VAT_ID: EntityDefinition = {
  name: 'DE_VAT_ID',
  description: 'German VAT identification number',
  patterns: [
    { name: 'compact', regex: String.raw`\bDE[0-9]{9}\b`, score: 0.5 },
    {
      name: 'spaced',
      regex: String.raw`\bDE[\s.\-]?[0-9]{3}[\s.\-]?[0-9]{3}[\s.\-]?[0-9]{3}\b`,
      score: 0.4,
    },
  ],
  // Upstream defaults to non-strict, where a bad check digit returns null and
  // the detection survives on its base score. `onChecksumFail: 'keep'` already
  // gives us that behaviour, so this stays a real checksum.
  validation: {
    kind: 'checksum',
    run: (value) =>
      iso7064Mod1110(value.replace(/^DE/i, '').replace(/\./g, '')),
  },
  context: ['umsatzsteuer', 'ust-idnr', 'vat'],
};

export const DE_TAX_NUMBER: EntityDefinition = {
  name: 'DE_TAX_NUMBER',
  description: 'German tax number',
  patterns: [
    {
      name: 'thirteen-digit',
      regex: String.raw`\b(0[1-9]|1[0-6])[0-9]{11}\b`,
      score: 0.5,
    },
    {
      name: 'slashed',
      regex: String.raw`(?<!\w)[0-9]{3}/[0-9]{3}/[0-9]{5}(?!\w)`,
      score: 0.4,
    },
    {
      name: 'slashed-loose',
      regex: String.raw`(?<!\w)[0-9]{2,3}/[0-9]{3,4}/[0-9]{4,5}(?!\w)`,
      score: 0.2,
    },
  ],
  context: ['steuernummer', 'finanzamt'],
};

// ── the rest ────────────────────────────────────────────────────────────────

export const DE_FUEHRERSCHEIN: EntityDefinition = {
  name: 'DE_FUEHRERSCHEIN',
  description: 'German driving licence number',
  patterns: [
    {
      name: 'licence',
      regex: String.raw`\b[A-Z]{2}[0-9]{8}[A-Z0-9]\b`,
      score: 0.35,
    },
  ],
  context: ['führerschein', 'fuehrerschein', 'driving licence'],
};

export const DE_HANDELSREGISTER: EntityDefinition = {
  name: 'DE_HANDELSREGISTER',
  description: 'German commercial register number',
  patterns: [
    {
      name: 'hr',
      regex: String.raw`\bHR[AB]\s*[0-9]{1,6}\b`,
      score: 0.5,
    },
  ],
  context: ['handelsregister', 'amtsgericht', 'hrb', 'hra'],
};

export const DE_PLZ: EntityDefinition = {
  name: 'DE_PLZ',
  description: 'German postal code',
  patterns: [
    {
      name: 'plz',
      regex: String.raw`\b(?!01000\b|99999\b)(0[1-9][0-9]{3}|[1-9][0-9]{4})\b`,
      score: 0.05,
    },
  ],
  context: ['plz', 'postleitzahl', 'postal code'],
};

export const DE_KFZ: EntityDefinition = {
  name: 'DE_KFZ',
  description: 'German vehicle registration plate',
  patterns: [
    {
      name: 'spaces',
      regex: `${KFZ_BOUNDARY_BEFORE}[A-ZÄÖÜ]{1,3}\\s[A-Z]{1,2}\\s${KFZ_TAIL}${KFZ_BOUNDARY_AFTER}`,
      score: 0.3,
      caseSensitive: true,
    },
    {
      name: 'dashes',
      regex: `${KFZ_BOUNDARY_BEFORE}[A-ZÄÖÜ]{1,3}-[A-Z]{1,2}-${KFZ_TAIL}${KFZ_BOUNDARY_AFTER}`,
      score: 0.3,
      caseSensitive: true,
    },
    {
      name: 'mixed',
      regex: `${KFZ_BOUNDARY_BEFORE}[A-ZÄÖÜ]{1,3}-[A-Z]{1,2}\\s${KFZ_TAIL}${KFZ_BOUNDARY_AFTER}`,
      score: 0.3,
      caseSensitive: true,
    },
    {
      name: 'no-umlaut-spaces',
      regex: `${KFZ_BOUNDARY_BEFORE}[A-Z]{1,3}\\s[A-Z]{1,2}\\s${KFZ_TAIL}${KFZ_BOUNDARY_AFTER}`,
      score: 0.2,
      caseSensitive: true,
    },
    {
      name: 'no-umlaut-dash',
      regex: `${KFZ_BOUNDARY_BEFORE}[A-Z]{1,3}-[A-Z]{1,2}\\s${KFZ_TAIL}${KFZ_BOUNDARY_AFTER}`,
      score: 0.2,
      caseSensitive: true,
    },
  ],
  context: ['kennzeichen', 'kfz', 'fahrzeug', 'matrícula'],
};
