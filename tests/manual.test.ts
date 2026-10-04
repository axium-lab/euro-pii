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
