import { isNeriumError, Nerium } from '../../src/index';
import type { ScanResult, TextOptions } from '../../src/index';

const ner = new Nerium();

/**
 * Checks the selection and the policy rules. Like `documents.ts`, it exits
 * non-zero when a rule breaks.
 */
const failed: string[] = [];

const check = (name: string, ok: boolean) => {
  console.log(`  ${ok ? 'ok    ' : 'FAILED'} ${name}`);
  if (!ok) failed.push(name);
};

const throws = (options: TextOptions) => {
  try {
    ner.text(SAMPLE, options);
    return false;
  } catch (error) {
    return isNeriumError(error);
  }
};

const found = (result: ScanResult | ScanResult['entities']) =>
  (Array.isArray(result) ? result : result.entities).map((d) => d.entity);

const SAMPLE =
  'DNI 12345678Z, IBAN ES9121000418450200051332, correo luis@example.com';

console.log('\n── selection');
check('no options → everything', found(ner.scan(SAMPLE)).length === 3);
check(
  "countries: ['ES'] leaves GLOBAL out",
  found(ner.scan(SAMPLE, { countries: ['ES'] })).join() === 'ES_NIF',
);
check(
  'fields intersect',
  found(ner.scan(SAMPLE, { countries: ['GLOBAL'], kinds: ['EMAIL'] })).join() ===
    'EMAIL_ADDRESS',
);
check(
  'entities picks by name',
  found(ner.scan(SAMPLE, { entities: ['IBAN_CODE'] })).join() === 'IBAN_CODE',
);
check(
  'except removes',
  !found(ner.scan(SAMPLE, { except: ['EMAIL_ADDRESS'] })).includes(
    'EMAIL_ADDRESS',
  ),
);

console.log('\n── policy');
const masked = ner.text(SAMPLE, { policy: { entities: { EMAIL_ADDRESS: 'keep' } } });
check(
  'keep leaves the value but still reports it',
  !masked.blocked &&
    masked.anonymized_text.includes('luis@example.com') &&
    found(masked).includes('EMAIL_ADDRESS'),
);

const blocked = ner.text(SAMPLE, { policy: { kinds: { BANK_ACCOUNT: 'block' } } });
check(
  'block by kind, blocked_by names the culprit',
  blocked.blocked && found(blocked.blocked_by).join() === 'IBAN_CODE',
);

check(
  'entities beats kinds',
  !ner.text(SAMPLE, {
    policy: { kinds: { BANK_ACCOUNT: 'block' }, entities: { IBAN_CODE: 'mask' } },
  }).blocked,
);

check(
  'an explicit block is looked for outside the selection',
  ner.text(SAMPLE, {
    countries: ['ES'],
    policy: { kinds: { BANK_ACCOUNT: 'block' } },
  }).blocked,
);

check(
  "default: 'block' stays within the selection",
  !ner.text('IBAN ES9121000418450200051332', {
    countries: ['ES'],
    policy: { default: 'block' },
  }).blocked,
);

console.log('\n── errors');
check('empty selection throws', throws({ countries: ['ES'], entities: ['DE_TAX_ID'] }));
check('unknown entity throws', throws({ entities: ['ES_DNI' as never] }));
check('unused kind throws', throws({ kinds: ['PHONE'] }));
check('unknown action throws', throws({ policy: { default: 'hash' as never } }));
check(
  'blocking something in except throws',
  throws({ except: ['IBAN_CODE'], policy: { entities: { IBAN_CODE: 'block' } } }),
);

if (failed.length > 0) {
  console.log(`\nFAILED ${failed.length}: ${failed.join(', ')}`);
  process.exit(1);
}

console.log('\nevery option rule holds');
