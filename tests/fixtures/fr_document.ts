/**
 * Las 4 entidades francesas.
 *
 * Valores verificados: NIR 2 95 10 99 126 111 93 (clave 97 - n mod 97) y TVA
 * FR40303265045 (clave (12 + 3 x (SIREN mod 97)) mod 97).
 *
 * El NIR solo se busca agrupado: los 15 digitos seguidos encajan en
 * `CREDIT_CARD` cuando empiezan por 1 y pasan Luhn una vez de cada diez.
 *
 * `FR_PASSPORT` y `FR_VEHICLE_PLATE` no tienen checksum y puntuan por debajo
 * del umbral, asi que dependen de `passeport` e `immatriculation`.
 */
export const EXAMPLE_TEXT_ALL_FR_ENTITIES = `Dossier client

La cliente indique son numéro de sécurité sociale 2 95 10 99 126 111 93.
La société facture avec le numéro de TVA intracommunautaire FR40303265045.

Pièce d'identité : passeport 12AB34567.

Le véhicule déclaré porte l'immatriculation AB-123-CD.`;

export const FR_EXPECTED = [
  'FR_NIR',
  'FR_PASSPORT',
  'FR_VAT_ID',
  'FR_VEHICLE_PLATE',
] as const;
