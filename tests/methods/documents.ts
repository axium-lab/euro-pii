import { CATALOG } from '../../src/core/catalog';
import { Nerium } from '../../src/index';
import { DOCUMENTS } from '../fixtures/documents';

const ner = new Nerium();

/**
 * Las entidades esperadas que no han aparecido.
 *
 * Este escenario existe para esto: es lo unico que comprueba COBERTURA. Si sale
 * con codigo distinto de 0, el lanzador lo propaga y te enteras. Sin esto
 * imprimiria "FALTA" y saldria con 0, que es lo mismo que no comprobar nada.
 */
const ausentes: string[] = [];

for (const [country, { text, expected }] of Object.entries(DOCUMENTS)) {
  const result = ner.text(text, true);
  if (result.blocked) throw new Error('inesperado');

  const detectadas = new Set(result.entities.map((d) => d.entity));
  const delPais = new Set<string>(CATALOG[country as keyof typeof CATALOG]);

  console.log(`\n════ ${country} ═══════════════════════════════════════`);
  console.log(JSON.stringify(result, null, 2));

  console.log(`\n   esperadas y detectadas:`);
  for (const name of expected) {
    const detectada = detectadas.has(name);
    if (!detectada) ausentes.push(`${country}/${name}`);
    console.log(`     ${detectada ? 'ok  ' : 'FALTA'} ${name}`);
  }

  // Las del pais que no estan en `expected` estan tapadas por una colision.
  const tapadas = [...delPais].filter(
    (name) => !detectadas.has(name as never) && !expected.includes(name as never),
  );
  if (tapadas.length > 0) {
    console.log(`   tapadas por colision: ${tapadas.join(', ')}`);
  }

  // Lo que sale y no es de este pais son las multipais, sobre todo DATE_TIME.
  const deOtros = [...detectadas].filter((name) => !delPais.has(name));
  if (deOtros.length > 0) {
    console.log(`   ademas, multipais o de otro pais: ${deOtros.join(', ')}`);
  }
}

if (ausentes.length > 0) {
  console.log(`\nFALTAN ${ausentes.length}: ${ausentes.join(', ')}`);
  process.exit(1);
}

console.log('\ntodas las entidades esperadas aparecen en su documento');
