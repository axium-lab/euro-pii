import { Nerium } from '../../src/index';
import {
  BAD_CHECKSUM_WITH_CONTEXT,
  EXAMPLE_TEXT_ALL_ES_ENTITIES,
  NIF_LOWERCASE,
  NIF_WITH_DASH,
  NO_IDENTIFIERS,
  SAME_NIF_TWICE,
  TWO_DIFFERENT_NIF,
} from '../fixtures/documents';

const ner = new Nerium();

const scenarios = {
  spanish_document: EXAMPLE_TEXT_ALL_ES_ENTITIES,
  same_nif_twice: SAME_NIF_TWICE,
  two_different_nif: TWO_DIFFERENT_NIF,
  nif_with_dash: NIF_WITH_DASH,
  nif_lowercase: NIF_LOWERCASE,
  bad_checksum_with_context: BAD_CHECKSUM_WITH_CONTEXT,
  no_identifiers: NO_IDENTIFIERS,
};

for (const [name, text] of Object.entries(scenarios)) {
  console.log(`\n── ${name}`);
  console.log(JSON.stringify(ner.anonymize(text), null, 2));
}

// `default: 'block'` blocks when there are DETECTIONS, and the blocked result
// carries no text. Do not read "no detections" as "no personal data":
// NO_IDENTIFIERS contains "Pedro Losas", which is textbook PII, but PERSON needs
// a model and this library has none. `blocked: false` means "I found nothing I
// know how to look for", not "this text is safe".
// console.log('\n── with detections, block -> blocks');
// console.log(
//   JSON.stringify(ner.anonymize(EXAMPLE_TEXT_ALL_ES_ENTITIES, { policy: { default: 'block' } }), null, 2),
// );

// console.log('\n── without detections, block -> does NOT block');
// console.log(JSON.stringify(ner.anonymize(NO_IDENTIFIERS, { policy: { default: 'block' } }), null, 2));
