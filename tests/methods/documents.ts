import { CATALOG, Nerium } from '../../src/index';
import { DOCUMENTS } from '../fixtures/documents';

const ner = new Nerium();

/**
 * Expected entities that did not show up.
 *
 * This is why the scenario exists: it is the only one that checks COVERAGE. It
 * exits non-zero when something is missing and the runner propagates that, so
 * you find out. Printing "MISSING" and exiting 0 would be the same as checking
 * nothing at all.
 */
const missing: string[] = [];

for (const [country, { text, expected }] of Object.entries(DOCUMENTS)) {
  const result = ner.anonymize(text);
  if (result.blocked) throw new Error(`Unexpected block for ${country}.`);

  const detected = new Set(result.entities.map((d) => d.entity));
  const ofCountry = new Set<string>(CATALOG[country as keyof typeof CATALOG]);

  console.log(`\n════ ${country} ═══════════════════════════════════════`);
  console.log(JSON.stringify(result, null, 2));

  console.log(`\n   expected and detected:`);
  for (const name of expected) {
    const found = detected.has(name);
    if (!found) missing.push(`${country}/${name}`);
    console.log(`     ${found ? 'ok     ' : 'MISSING'} ${name}`);
  }

  // Entities of this country that are not in `expected` lost to a collision.
  const shadowed = [...ofCountry].filter(
    (name) => !detected.has(name as never) && !expected.includes(name as never),
  );
  if (shadowed.length > 0) {
    console.log(`   shadowed by a collision: ${shadowed.join(', ')}`);
  }

  // Anything detected that is not from this country is multi-country, and it is
  // almost always DATE_TIME.
  const fromElsewhere = [...detected].filter((name) => !ofCountry.has(name));
  if (fromElsewhere.length > 0) {
    console.log(`   also multi-country or foreign: ${fromElsewhere.join(', ')}`);
  }
}

if (missing.length > 0) {
  console.log(`\nMISSING ${missing.length}: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('\nevery expected entity shows up in its own document');
