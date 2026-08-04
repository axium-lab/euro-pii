/**
 * Strips the separators a checksum must not see: `12345678-Z` and `12345678Z`
 * are the same NIF, but only the second one runs through the algorithm.
 */
export function sanitize(value: string): string {
  return value.replace(/[\s-]/g, '');
}

/** Escapes a literal so it can be embedded in a regex source. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
