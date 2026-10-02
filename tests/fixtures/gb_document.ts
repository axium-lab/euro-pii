/**
 * Las 6 entidades britanicas.
 *
 * `GB_NHS` 9434761573 pasa el modulo 11. La matricula AB12 CDE pasa el rango
 * del identificador de edad (02-29 o 51-79). El carne de conducir no valida
 * digito de control porque el algoritmo del DVLA no es publico: solo comprueba
 * que los cinco primeros caracteres sean un apellido plausible.
 *
 * `GB_NINO` no necesita validacion: toda la especificacion esta dentro del
 * patron (prefijos prohibidos, letras excluidas por posicion, sufijo A-D).
 *
 * `GB_PASSPORT` y `GB_POSTCODE` tienen score 0.1, asi que sin las palabras
 * "passport" y "postcode" al lado no llegan al umbral.
 */
export const EXAMPLE_TEXT_ALL_GB_ENTITIES = `Patient registration

The patient gives the NHS number 9434761573 and the national insurance number
AB123456C.

Identity documents on file: passport AB1234567 and driving licence
SMITH906151AB9CD.

Registered address postcode SW1A 1AA. The vehicle on record has the
registration AB12 CDE.`;

export const GB_EXPECTED = [
  'GB_DRIVING_LICENCE',
  'GB_NHS',
  'GB_NINO',
  'GB_PASSPORT',
  'GB_POSTCODE',
  'GB_VEHICLE_REGISTRATION',
] as const;
