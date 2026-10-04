/**
 * Las 3 entidades neerlandesas.
 *
 * El btw-id NL004495445B01 pasa la 11-proef sobre sus nueve digitos. Los de
 * autonomos emitidos desde 2020 (NL002455799B11) pasan en cambio el mod 97
 * sobre la cadena entera; los dos caminos estan cubiertos.
 *
 * `NL_POSTCODE` y `NL_VEHICLE_PLATE` no tienen checksum y dependen de
 * `postcode` y `kenteken`. Las matriculas solo cubren los sidecodes 7 a 14:
 * los antiguos (`XX-99-XX`) son identicos a las portuguesas.
 */
export const EXAMPLE_TEXT_ALL_NL_ENTITIES = `Klantgegevens

De onderneming factureert met btw-id NL004495445B01 en de eenmanszaak met
NL002455799B11.

Woonadres met postcode 1012 AB in Amsterdam.

Het voertuig staat geregistreerd onder kenteken 12-ZTL-3.`;

export const NL_EXPECTED = [
  'NL_POSTCODE',
  'NL_VAT_ID',
  'NL_VEHICLE_PLATE',
] as const;
