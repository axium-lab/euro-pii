/**
 * Las 13 entidades alemanas.
 *
 * Valores con checksum verificado: LANR 100000400 (pesos 4,9,4,9,4,9),
 * Steuer-ID 11234567890 (ISO 7064 Mod 11,10 mas la regla de no repetir un
 * digito mas de tres veces), USt-IdNr DE100000008, numero de la seguridad
 * social 12150149A002 y documento de identidad C10000007 (ICAO 7,3,1).
 *
 * Dos colisiones que este documento hace visibles:
 * - `DE_BSNR` y `DE_LANR` comparten el patron de nueve digitos. Lo unico que
 *   los separa es la palabra de contexto que tengan al lado.
 * - `DE_ID_CARD` y `DE_PASSPORT` comparten patron Y checksum, asi que los dos
 *   llegan a 1.0 y gana el primero por orden alfabetico. Por eso DE_PASSPORT
 *   no esta en la lista de esperadas: no hay texto que lo saque.
 */
export const EXAMPLE_TEXT_ALL_DE_ENTITIES = `Kundenakte

Der Kunde nennt seine steuerliche Identifikationsnummer 11234567890 und die
Umsatzsteuer-IdNr DE100000008. Beim Finanzamt lautet die Steuernummer
123/456/78901.

Als Ausweisnummer liegt der Personalausweis C10000007 vor. Die
Versicherungsnummer der Rentenversicherung ist 12150149A002 und die
Versichertennummer der Krankenversicherung A123456789.

Die behandelnde Praxis fuehrt die Betriebsstättennummer 123456789 im Register.

Getrennt davon, weil beide neun Ziffern haben: die lebenslange Arztnummer
lautet 100000400.

Der Führerschein tragt die Nummer AB12345678C. Das Fahrzeug hat das
Kennzeichen MÜ AB 1234.

Sitz der Gesellschaft: Handelsregister HRB 12345, Postleitzahl 80331 München.`;

export const DE_EXPECTED = [
  'DE_BSNR',
  'DE_FUEHRERSCHEIN',
  'DE_HANDELSREGISTER',
  'DE_HEALTH_INSURANCE',
  'DE_ID_CARD',
  'DE_KFZ',
  'DE_LANR',
  'DE_PLZ',
  'DE_SOCIAL_SECURITY',
  'DE_TAX_ID',
  'DE_TAX_NUMBER',
  'DE_VAT_ID',
] as const;
