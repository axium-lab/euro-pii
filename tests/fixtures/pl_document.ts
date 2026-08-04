/**
 * La unica entidad polaca.
 *
 * `44051401359` pasa el checksum de pesos 1,3,7,9 repetidos. Su patron ya
 * codifica el siglo dentro del mes: 01-12 son 1900, 21-32 son 2000, 41-52 son
 * 2100.
 */
export const EXAMPLE_TEXT_ALL_PL_ENTITIES = `Dane klienta

Klient podaje numer PESEL 44051401359 do umowy.`;

export const PL_EXPECTED = ['PL_PESEL'] as const;
