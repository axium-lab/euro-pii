export const EXAMPLE_TEXT_ALL_ES_ENTITIES = `
Expediente de alta y documentación del cliente

IDENTIFICACIÓN ESPAÑOLA

El titular presenta su NIF 12345678Z para formalizar el contrato.
Como identificación de extranjero se registra el NIE X1234567L.
También se adjunta el pasaporte ABC123456.

DOCUMENTACIÓN EXTRANJERA

El cliente aporta además su Personalausweis alemán C10000007.

DATOS DE CONTACTO

El correo electrónico del titular es pedro.garcia@example.com.
El correo alternativo es usuario.prueba@empresa.es.

DATOS BANCARIOS Y DE PAGO

La cuenta bancaria principal es el IBAN ES9121000418450200051332.
La tarjeta de crédito registrada es 4111111111111111.
También consta una tarjeta Mastercard 5555555555554444.

CRIPTOGRAFÍA

La cartera Bitcoin utilizada es 1BoatSLRHtKNngkdXEeobR76b53LETtpyT.

RED

La dirección IP del cliente es 192.168.1.100.
El servidor utiliza la dirección IPv6 2001:0db8:85a3:0000:0000:8a2e:0370:7334.

La dirección MAC del equipo es AA:BB:CC:DD:EE:FF.
Otra interfaz utiliza 0011.2233.4455.

IDENTIFICADORES

El identificador de sesión es 550e8400-e29b-41d4-a716-446655440000.
El identificador de operación es 6ba7b810-9dad-41d1-80b4-00c04fd430c8.

FECHAS

La fecha de alta es 25/12/2025.
La fecha alternativa es 12/25/2025.
También consta la fecha 2025/12/25.

La documentación fue firmada el 25-12-2025.
Otro registro utiliza 12-25-2025.
El sistema registra también 2025-12-25.

La fecha de nacimiento indicada es 25.12.1980.
La fecha del documento es 25-DEC-2025.
La renovación está prevista para DEC-2027.
El registro corresponde al día 25-DEC.

La fecha de vencimiento es 12/2027.
La fecha corta de vencimiento es 12/27.

La marca temporal de creación es 2025-12-25T14:30:45Z.
Otra operación se registró en 2025-12-25T14:30:45.123+01:00.
y DNI aleman L01X00T47
`;

export const ES_EXPECTED = [
  // Global
  'CREDIT_CARD',
  'CRYPTO',
  'DATE_TIME',
  'EMAIL_ADDRESS',
  'IBAN_CODE',
  'IP_ADDRESS',
  'MAC_ADDRESS',
  'UUID',

  // España
  'ES_NIF',
  'ES_NIE',
  'ES_PASSPORT',

  // Extranjeras: el registro corre entero, sin filtro por país
  'DE_ID_CARD',
] as const;
