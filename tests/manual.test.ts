import { inspect } from 'node:util';
import { Nerium } from '../src/index';

const ner = new Nerium();

// `inspect` without a depth limit: a plain console.log cuts nested objects short.
const show = (value: unknown) =>
  console.log(inspect(value, { depth: null, maxArrayLength: null }));



console.log('\n── supported_entities');
//show(ner.supported_entities());

console.log('\n── supported_countries');
show(ner.supported_countries());

console.log('\n── supported_kinds');
show(ner.supported_kinds());

// ── Encontrar entidades
const sample =
  'Hola, mi DNI es 12345678Z, mi IBAN ES9121000418450200051332 y mi correo luis@example.com';

// `scan` solo detecta: qué es, dónde está (offsets sobre el texto ORIGINAL),
// el valor y la confianza. Qué hacer con ello lo decides tú.
console.log('\n── scan, solo ES (GLOBAL hay que pedirlo aparte)');
show(ner.scan(sample, { countries: ['ES'] }));

// `text` detecta y aplica la política. Sin opciones busca todo y enmascara todo.
console.log('\n── text, enmascarando todo menos el correo');
show(ner.text(sample, { policy: { entities: { EMAIL_ADDRESS: 'keep' } } }));

// Una cuenta bancaria bloquea el texto entero: no vuelve `anonymized_text`,
// y `blocked_by` dice qué lo ha bloqueado.
console.log('\n── text, bloqueando si aparece una cuenta bancaria');
show(ner.text(sample, { policy: { kinds: { BANK_ACCOUNT: 'block' } } }));
