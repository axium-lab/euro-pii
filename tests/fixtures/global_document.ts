/**
 * Entidades multipais (country: 'GLOBAL'): las 8 que no son de ningun estado.
 *
 * Todos los valores estan VERIFICADOS contra su checksum, no inventados:
 * la tarjeta pasa Luhn, el IBAN pasa el modulo 97 y la direccion de bitcoin es
 * la del bloque genesis.
 */
export const EXAMPLE_TEXT_ALL_GLOBAL_ENTITIES = `Justificante de operacion

Emitido el 2026-04-03T10:15:00Z desde el servidor de facturacion.

El pago se cargo en la cuenta con IBAN ES91 2100 0418 4502 0005 1332 usando la
tarjeta de credito 4539148803436467. El reembolso en cripto se envio a la
cartera bitcoin 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa.

Notificacion enviada al correo pedro.losas@fluxaria.com.

Traza tecnica: la peticion entro desde la ip 192.168.1.10, equipo con mac
00:1B:44:11:3A:B7, y quedo registrada con el uuid
123e4567-e89b-12d3-a456-426614174000.`;

export const GLOBAL_EXPECTED = [
  'CREDIT_CARD',
  'CRYPTO',
  'DATE_TIME',
  'EMAIL_ADDRESS',
  'IBAN_CODE',
  'IP_ADDRESS',
  'MAC_ADDRESS',
  'UUID',
] as const;
