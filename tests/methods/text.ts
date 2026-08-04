import { Nerium } from '../../src/index';
import {
  CON_CONTEXTO,
  CON_GUION,
  DOS_DISTINTOS,
  EXAMPLE_TEXT_ALL_ES_ENTITIES,
  LIMPIO,
  MINUSCULAS,
  REPETIDO,
} from '../fixtures/documents';

const ner = new Nerium();

const escenarios = {
  documento_es: EXAMPLE_TEXT_ALL_ES_ENTITIES,
  // mismo_nif_dos_veces: REPETIDO,
  // dos_nif_distintos: DOS_DISTINTOS,
  // con_guion: CON_GUION,
  // en_minusculas: MINUSCULAS,
  // checksum_malo_con_contexto: CON_CONTEXTO,
  // texto_limpio: LIMPIO,
};

for (const [nombre, texto] of Object.entries(escenarios)) {
  console.log(`\n── ${nombre}`);
  console.log(JSON.stringify(ner.text(texto, true), null, 2));
}

// `anonymizes = false` bloquea cuando hay DETECCIONES, y el resultado bloqueado
// no lleva texto. Ojo con leer "sin detecciones" como "sin datos personales":
// LIMPIO contiene "Pedro Losas", que es PII de manual, pero PERSON necesita un
// modelo y esta libreria no lo tiene. `blocked: false` significa "no he
// encontrado nada de lo que se buscar", no "este texto es seguro".
console.log('\n── con detecciones, anonymizes = false -> bloquea');
console.log(
  JSON.stringify(ner.text(EXAMPLE_TEXT_ALL_ES_ENTITIES, false), null, 2),
);

console.log('\n── sin detecciones, anonymizes = false -> NO bloquea');
console.log(JSON.stringify(ner.text(LIMPIO, false), null, 2));
