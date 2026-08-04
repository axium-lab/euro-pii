/**
 * Las 5 entidades italianas.
 *
 * `AAAAAA00B11C333Y` es el vector de prueba del codice fiscale, con su checksum
 * de tablas par/impar verificado. La partita IVA 01234567897 pasa su digito de
 * control.
 *
 * Tres de las cinco tienen score 0.01 y ninguna validacion, asi que dependen
 * enteramente de las palabras de contexto italianas: `carta di identità`,
 * `passaporto`, `patente`. Sin ellas no llegan al umbral de 0.4.
 *
 * `IT_IDENTITY_CARD` e `IT_PASSPORT` colisionan en el patron de dos letras y
 * siete digitos, asi que van a parrafos distintos para que cada una tenga su
 * palabra al lado.
 */
export const EXAMPLE_TEXT_ALL_IT_ENTITIES = `Pratica cliente

Il cliente dichiara il codice fiscale AAAAAA00B11C333Y e, per l'attivita, la
partita IVA 01234567897.

Come documento presenta la carta di identità CA12345BB.

Per i viaggi indica il passaporto YA1234567.

Alla guida usa la patente AB1234567C.`;

export const IT_EXPECTED = [
  'IT_DRIVER_LICENSE',
  'IT_FISCAL_CODE',
  'IT_IDENTITY_CARD',
  'IT_PASSPORT',
  'IT_VAT_CODE',
] as const;
