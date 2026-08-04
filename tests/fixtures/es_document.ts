/**
 * Las 3 entidades espanolas.
 *
 * El NIF y el NIE llevan letra de control CALCULADA, no inventada:
 *   12345678 % 23 = 14 -> Z
 *   X1234567: la X vale 0, luego 1234567 % 23 = 19 -> L
 *
 * `ES_PASSPORT` no tiene checksum y su score base es 0.05, asi que solo se
 * detecta si la palabra "pasaporte" aparece cerca.
 */
export const EXAMPLE_TEXT_ALL_ES_ENTITIES = `Expediente de alta de cliente

El titular, con documento nacional de identidad 12345678Z, firma el contrato en
Madrid. Su conyuge aporta el NIE X1234567L por ser residente extranjero.

Como documento de viaje se adjunta copia del pasaporte ABC123456.`;

export const ES_EXPECTED = ['ES_NIF', 'ES_NIE', 'ES_PASSPORT'] as const;
