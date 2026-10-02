import { defineEntity } from '../../core/entity';

/**
 * `[\w-]` cannot be used in the KFZ lookarounds: `\w` is ASCII, so `Ä` is not a
 * word character and the lookbehind fails to block. Writing the class out with
 * the umlauts fixes it — see docs/deteccion-regex.md:167.
 */
const KFZ_BOUNDARY_BEFORE = String.raw`(?<![A-Za-z0-9_ÄÖÜäöü-])`;
const KFZ_BOUNDARY_AFTER = String.raw`(?![A-Za-z0-9_ÄÖÜäöü])`;
const KFZ_TAIL = String.raw`[0-9]{1,4}[EH]?`;

export const DE_KFZ = defineEntity({
  // ── Classification ──────────────────────────
  name: 'DE_KFZ',
  country: 'DE',
  kind: 'VEHICLE_PLATE',

  // ── Detection ───────────────────────────────
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
});
