/**
 * Las 3 entidades austriacas.
 *
 * Valores verificados: Sozialversicherungsnummer 1237 010180 (pesos
 * 3 7 9 5 8 4 2 1 6, mod 11), UID ATU13585627 (Luhn sobre siete digitos) y
 * Firmenbuchnummer FN 33209m (pesos 6 4 14 15 10 1, mod 17).
 *
 * La SV-Nr solo se busca agrupada: compacta, sus diez digitos chocan con
 * `GB_NHS`.
 */
export const EXAMPLE_TEXT_ALL_AT_ENTITIES = `Kundenakte

Der Kunde nennt seine Sozialversicherungsnummer 1237 010180.

Die Gesellschaft ist im Firmenbuch unter FN 33209m eingetragen und hat die
UID-Nummer ATU13585627.`;

export const AT_EXPECTED = [
  'AT_FIRMENBUCH',
  'AT_SOCIAL_SECURITY',
  'AT_VAT_ID',
] as const;
