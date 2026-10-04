/**
 * Las 4 entidades belgas.
 *
 * Valores verificados: rijksregisternummer 85.07.30-033.28 (97 - n mod 97),
 * tarjeta eID 591-1917064-58 (diez digitos mod 97) y ondernemingsnummer
 * 0403.019.261, que tambien es el nucleo del BTW BE0403019261.
 *
 * Las tres primeras solo se buscan con su formato oficial: compactos chocan
 * con `DE_TAX_ID`, `IT_VAT_CODE` y `GB_NHS`.
 */
export const EXAMPLE_TEXT_ALL_BE_ENTITIES = `Klantendossier

De klant vermeldt het rijksregisternummer 85.07.30-033.28 en de
identiteitskaart 591-1917064-58.

De vennootschap staat in de KBO onder ondernemingsnummer 0403.019.261.

Facturen vermelden het btw-nummer BE0403019261.`;

export const BE_EXPECTED = [
  'BE_COMPANY_ID',
  'BE_EID_CARD',
  'BE_NATIONAL_NUMBER',
  'BE_VAT_ID',
] as const;
