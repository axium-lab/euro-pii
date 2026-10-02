import { defineEntity } from '../../core/entity';

const MONTHS = 'JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC';
const DAY = String.raw`([1-9]|0[1-9]|[1-2][0-9]|3[0-1])`;
const MONTH = String.raw`([1-9]|0[1-9]|1[0-2])`;
const YEAR = String.raw`(\d{4}|\d{2})`;

export const DATE_TIME = defineEntity({
  // ── Classification ──────────────────────────
  name: 'DATE_TIME',
  country: 'GLOBAL',
  kind: 'DATE',
  dataClass: 'PERSONAL',

  // ── Detection ───────────────────────────────
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
});
