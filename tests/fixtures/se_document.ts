/**
 * Las 2 entidades suecas.
 *
 * Valores verificados: personnummer 8112180008 (fecha mas Luhn) y
 * organisationsnummer 5561230003 (tercer digito >= 2 mas Luhn).
 *
 * Las dos definen DOS patrones identicos salvo por los `\b`: el delimitado con
 * score alto y el libre con score bajo. Asi capturan el identificador
 * incrustado en una cadena mas larga sin darle la misma confianza.
 *
 * `SE_PERSONNUMMER` no se espera: 8112180008 tambien pasa el modulo 11 de
 * `GB_NHS`, las dos empatan con score 1 en el mismo tramo y el desempate final
 * es alfabetico, asi que gana `GB_NHS`. Sale como "shadowed by a collision".
 */
export const EXAMPLE_TEXT_ALL_SE_ENTITIES = `Kunduppgifter

Kunden anger sitt personnummer 8112180008 vid registreringen.

Företaget har organisationsnummer 5561230003.`;

export const SE_EXPECTED = ['SE_ORGANISATIONSNUMMER'] as const;
