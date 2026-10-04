/**
 * Separator classes for the pattern sources, so every entity accepts the same
 * spaces and dashes that PDFs and word processors put between groups.
 */

/**
 * Space, tab, NBSP (U+00A0) and narrow NBSP (U+202F). Not `\s`: it also takes a
 * line break, and with it a number ending one line glues to a letter starting
 * the next.
 */
export const SPACE = String.raw`[ \t  ]`;

/** ASCII hyphen plus the typographic ones: ‐ ‑ ‒ – — ― and the minus sign −. */
export const DASH = String.raw`[\-‐-―−]`;
