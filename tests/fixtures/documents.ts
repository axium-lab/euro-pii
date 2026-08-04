/**
 * Un documento por pais, cada uno en su fichero.
 *
 * La prosa va en castellano pero las ETIQUETAS van en el idioma local, y no es
 * un capricho: las palabras de contexto de cada entidad son locales
 * (`personalausweis`, `henkilötunnus`, `partita iva`). Sin ellas, las entidades
 * de score bajo no llegan al umbral de 0.4 y no se detectan.
 *
 * Todos los identificadores tienen su checksum VERIFICADO, ninguno es inventado.
 */
import { DE_EXPECTED, EXAMPLE_TEXT_ALL_DE_ENTITIES } from './de_document';
import { ES_EXPECTED, EXAMPLE_TEXT_ALL_ES_ENTITIES } from './es_document';
import { EU_EXPECTED, EXAMPLE_TEXT_ALL_EU_ENTITIES } from './eu_document';
import { FI_EXPECTED, EXAMPLE_TEXT_ALL_FI_ENTITIES } from './fi_document';
import { GB_EXPECTED, EXAMPLE_TEXT_ALL_GB_ENTITIES } from './gb_document';
import { IT_EXPECTED, EXAMPLE_TEXT_ALL_IT_ENTITIES } from './it_document';
import { PL_EXPECTED, EXAMPLE_TEXT_ALL_PL_ENTITIES } from './pl_document';
import { SE_EXPECTED, EXAMPLE_TEXT_ALL_SE_ENTITIES } from './se_document';

export * from './de_document';
export * from './es_document';
export * from './eu_document';
export * from './fi_document';
export * from './gb_document';
export * from './it_document';
export * from './pl_document';
export * from './se_document';

/** Los ocho documentos con lo que cada uno deberia sacar. */
export const DOCUMENTS = {
  EU: { text: EXAMPLE_TEXT_ALL_EU_ENTITIES, expected: EU_EXPECTED },
  ES: { text: EXAMPLE_TEXT_ALL_ES_ENTITIES, expected: ES_EXPECTED },
  DE: { text: EXAMPLE_TEXT_ALL_DE_ENTITIES, expected: DE_EXPECTED },
  GB: { text: EXAMPLE_TEXT_ALL_GB_ENTITIES, expected: GB_EXPECTED },
  IT: { text: EXAMPLE_TEXT_ALL_IT_ENTITIES, expected: IT_EXPECTED },
  SE: { text: EXAMPLE_TEXT_ALL_SE_ENTITIES, expected: SE_EXPECTED },
  FI: { text: EXAMPLE_TEXT_ALL_FI_ENTITIES, expected: FI_EXPECTED },
  PL: { text: EXAMPLE_TEXT_ALL_PL_ENTITIES, expected: PL_EXPECTED },
} as const;

/** Los ocho seguidos. Ojo: aqui las colisiones entre paises SI se pisan. */
export const EXAMPLE_TEXT_ALL_ENTITIES = Object.values(DOCUMENTS)
  .map((document) => document.text)
  .join('\n\n---\n\n');

// ── textos cortos para casos concretos ──────────────────────────────────────

/** El mismo NIF dos veces, con el checksum mal. Offsets 17-26 y 40-49. */
export const REPETIDO = ' PEdro losas con 56565656X y Lilian con 56565656X';

/** Dos personas, dos NIF distintos y validos. */
export const DOS_DISTINTOS = 'Pedro 12345678Z y Lilian 87654321X';

/** Con separador: el checksum solo funciona sobre la cadena normalizada. */
export const CON_GUION = 'DNI: 12345678-Z';

/** Minusculas: sin el flag `i` esta deteccion se pierde. */
export const MINUSCULAS = 'nif 12345678z';

/** Palabra de contexto junto a un checksum que falla: sube el score. */
export const CON_CONTEXTO = 'el nif 56565656X del cliente';

export const LIMPIO = 'Pedro Losas no aporta ningún identificador aquí.';
