/**
 * Las 2 entidades suecas.
 *
 * Valores verificados: personnummer 8112180008 (fecha mas Luhn) y
 * organisationsnummer 5561230003 (tercer digito >= 2 mas Luhn).
 *
 * Las dos definen DOS patrones identicos salvo por los `\b`: el delimitado con
 * score alto y el libre con score bajo. Asi capturan el identificador
 * incrustado en una cadena mas larga sin darle la misma confianza.
 */
export const EXAMPLE_TEXT_ALL_SE_ENTITIES = `Kunduppgifter

Kunden anger sitt personnummer 8112180008 vid registreringen.

Företaget har organisationsnummer 5561230003.`;

export const SE_EXPECTED = [
  'SE_ORGANISATIONSNUMMER',
  'SE_PERSONNUMMER',
] as const;
