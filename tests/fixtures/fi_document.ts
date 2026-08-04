/**
 * La unica entidad finlandesa.
 *
 * `010190-100W` esta verificado: el separador codifica el siglo (`-` es 1900,
 * `+` es 1800, `A`-`F` es 2000), se comprueba que la fecha exista de verdad y
 * el caracter de control sale de un modulo 31.
 */
export const EXAMPLE_TEXT_ALL_FI_ENTITIES = `Asiakastiedot

Asiakas ilmoittaa henkilötunnus 010190-100W rekisteriin.`;

export const FI_EXPECTED = ['FI_PERSONAL_IDENTITY_CODE'] as const;
