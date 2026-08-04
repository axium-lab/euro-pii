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

// ── short texts, one concern each ───────────────────────────────────────────

/** The same NIF twice, with a failing checksum. Offsets 17-26 and 40-49. */
export const SAME_NIF_TWICE = ' PEdro losas con 56565656X y Lilian con 56565656X';

/** Two people, two different valid NIF. */
export const TWO_DIFFERENT_NIF = 'Pedro 12345678Z y Lilian 87654321X';

/** With a separator: the checksum only works on the sanitized string. */
export const NIF_WITH_DASH = 'DNI: 12345678-Z';

/** Lowercase: without the `i` flag this detection is lost. */
export const NIF_LOWERCASE = 'nif 12345678z';

/** A context word next to a failing checksum: raises the score. */
export const BAD_CHECKSUM_WITH_CONTEXT = 'el nif 56565656X del cliente';

/** Carries a person name, which this library cannot see. */
export const NO_IDENTIFIERS = 'Pedro Losas no aporta ningún identificador aquí.';
