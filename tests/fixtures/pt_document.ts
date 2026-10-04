/**
 * Las 3 entidades portuguesas.
 *
 * El cartao de cidadao 00000000 0 ZZ4 es el vector de prueba del Luhn
 * alfanumerico (letras de 10 a 35).
 *
 * `PT_POSTAL_CODE` y `PT_VEHICLE_PLATE` no tienen checksum y dependen de
 * `código postal` y `matrícula`.
 */
export const EXAMPLE_TEXT_ALL_PT_ENTITIES = `Ficha de cliente

O cliente apresenta o cartão de cidadão 00000000 0 ZZ4.

Morada com código postal 1000-001 Lisboa.

A viatura tem a matrícula AB-12-CD.`;

export const PT_EXPECTED = [
  'PT_CITIZEN_CARD',
  'PT_POSTAL_CODE',
  'PT_VEHICLE_PLATE',
] as const;
