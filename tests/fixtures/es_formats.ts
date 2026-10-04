/**
 * Formas reales de escribir cada identificador español, una por texto.
 *
 * Todos los valores tienen el checksum verificado: NIF 12345678Z, NIE X1234567L,
 * CIF B12345674, NIF-IVA ESA58818501, CCC 20 dígitos 21000418450200051332 y
 * NUSS 281234567840. Lo único que cambia entre casos es el separador.
 *
 * Los espacios duros y los guiones tipográficos van escapados (` `,
 * `–`) para que se vean al leer el fichero: a simple vista no se
 * distinguen de un espacio o un guion normal.
 */

export interface FormatCase {
  text: string;
  entity: string;
  /** El match tal y como aparece en el texto, separadores incluidos. */
  value: string;
}

export interface NegativeCase {
  text: string;
  /** Por qué este texto no debe producir ninguna entidad `ES_`. */
  why: string;
}

export const ES_FORMATS: readonly FormatCase[] = [
  // ── NIF ─────────────────────────────────────
  { text: 'NIF 12345678Z', entity: 'ES_NIF', value: '12345678Z' },
  { text: 'NIF 12345678-Z', entity: 'ES_NIF', value: '12345678-Z' },
  { text: 'NIF 12345678 Z', entity: 'ES_NIF', value: '12345678 Z' },
  { text: 'NIF 12.345.678-Z', entity: 'ES_NIF', value: '12.345.678-Z' },
  { text: 'NIF 12.345.678 Z', entity: 'ES_NIF', value: '12.345.678 Z' },
  { text: 'NIF 12.345.678Z', entity: 'ES_NIF', value: '12.345.678Z' },
  { text: 'NIF 12 345 678 Z', entity: 'ES_NIF', value: '12 345 678 Z' },
  { text: 'NIF 12345678–Z', entity: 'ES_NIF', value: '12345678–Z' },
  { text: 'NIF 12345678 Z', entity: 'ES_NIF', value: '12345678 Z' },
  { text: 'nif 12345678z', entity: 'ES_NIF', value: '12345678z' },
  // "es" no es el prefijo del NIF-IVA: antes salía como ES_VAT_ID.
  { text: 'El NIF es 12345678Z', entity: 'ES_NIF', value: '12345678Z' },

  // ── NIE ─────────────────────────────────────
  { text: 'NIE X1234567L', entity: 'ES_NIE', value: 'X1234567L' },
  // Antes salía como ES_NIF `1234567-L`.
  { text: 'NIE X-1234567-L', entity: 'ES_NIE', value: 'X-1234567-L' },
  { text: 'NIE X-1234567L', entity: 'ES_NIE', value: 'X-1234567L' },
  { text: 'NIE X1234567-L', entity: 'ES_NIE', value: 'X1234567-L' },
  { text: 'NIE X 1234567 L', entity: 'ES_NIE', value: 'X 1234567 L' },

  // ── CIF ─────────────────────────────────────
  { text: 'CIF B12345674', entity: 'ES_CIF', value: 'B12345674' },
  { text: 'CIF B-12345674', entity: 'ES_CIF', value: 'B-12345674' },
  { text: 'CIF B 12345674', entity: 'ES_CIF', value: 'B 12345674' },
  { text: 'CIF B-12.345.674', entity: 'ES_CIF', value: 'B-12.345.674' },
  { text: 'CIF B12.345.674', entity: 'ES_CIF', value: 'B12.345.674' },

  // ── NIF-IVA ─────────────────────────────────
  { text: 'IVA ESA58818501', entity: 'ES_VAT_ID', value: 'ESA58818501' },
  { text: 'IVA ES A58818501', entity: 'ES_VAT_ID', value: 'ES A58818501' },
  { text: 'IVA ES-A58818501', entity: 'ES_VAT_ID', value: 'ES-A58818501' },
  { text: 'IVA ES 12345678Z', entity: 'ES_VAT_ID', value: 'ES 12345678Z' },

  // ── CCC ─────────────────────────────────────
  {
    text: 'CCC 2100 0418 45 0200051332',
    entity: 'ES_CCC',
    value: '2100 0418 45 0200051332',
  },
  {
    text: 'CCC 2100-0418-45-0200051332',
    entity: 'ES_CCC',
    value: '2100-0418-45-0200051332',
  },
  {
    text: 'CCC 21000418450200051332',
    entity: 'ES_CCC',
    value: '21000418450200051332',
  },
  {
    text: 'CCC 2100 0418 45 0200051332',
    entity: 'ES_CCC',
    value: '2100 0418 45 0200051332',
  },

  // ── NUSS ────────────────────────────────────
  { text: 'NUSS 28/12345678/40', entity: 'ES_NUSS', value: '28/12345678/40' },
  { text: 'NUSS 28 12345678 40', entity: 'ES_NUSS', value: '28 12345678 40' },
  { text: 'NUSS 28-12345678-40', entity: 'ES_NUSS', value: '28-12345678-40' },
  { text: 'NUSS 281234567840', entity: 'ES_NUSS', value: '281234567840' },

  // ── Matrícula ───────────────────────────────
  { text: 'matrícula 1234 BCD', entity: 'ES_VEHICLE_PLATE', value: '1234 BCD' },
  { text: 'matrícula 1234-BCD', entity: 'ES_VEHICLE_PLATE', value: '1234-BCD' },
  {
    text: 'matrícula 1234–BCD',
    entity: 'ES_VEHICLE_PLATE',
    value: '1234–BCD',
  },
  {
    text: 'matrícula M-1234-AB',
    entity: 'ES_VEHICLE_PLATE',
    value: 'M-1234-AB',
  },

  // ── Varios en el mismo texto ────────────────
  { text: 'NIE X1234567-L y NIF 12345678Z', entity: 'ES_NIE', value: 'X1234567-L' },
  { text: 'NIE X1234567-L y NIF 12345678Z', entity: 'ES_NIF', value: '12345678Z' },

  // Checksum fallido: solo sale porque `DNI` está al lado (0.5 + 0.35).
  { text: 'DNI: 12.345.678-A', entity: 'ES_NIF', value: '12.345.678-A' },
];

export const ES_FORMATS_NEGATIVE: readonly NegativeCase[] = [
  { text: 'pagó 12345678 a Juan', why: '`a` es letra de control, pero en minúscula y tras un espacio' },
  { text: 'Tengo 12345678 y algo más', why: 'lo mismo con `y`' },
  { text: 'importe 12.345.678 euros', why: 'cifra agrupada sin letra' },
  { text: 'ref 1.12.345.678-Z', why: 'la cola de un número más largo' },
  { text: 'tel 600 123 456', why: 'teléfono agrupado por espacios' },
  { text: 'números 1234567\n8 Z', why: 'un salto de línea no es un separador' },
  { text: 'NIF 12345678\nZ', why: 'lo mismo entre los dígitos y la letra' },
  { text: 'NIF 12.345678-Z', why: 'agrupación incoherente' },
  { text: 'CCC 2100 0418-45 0200051332', why: 'separadores mezclados' },
  { text: 'NUSS 28/12345678-40', why: 'separadores mezclados' },
];
