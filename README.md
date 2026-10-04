# @axium-lab/euro-pii

[![npm version](https://img.shields.io/npm/v/@axium-lab/euro-pii)](https://www.npmjs.com/package/@axium-lab/euro-pii)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Detect and anonymize personal data in European text, **without machine learning**: regular expressions, checksums and context words. It is deterministic, has zero runtime dependencies and runs anywhere JavaScript does.

```bash
npm install @axium-lab/euro-pii
```

```ts
import { EuroPii } from '@axium-lab/euro-pii';

const result = new EuroPii().anonymize(
  'The holder, with DNI 12345678-Z and email ana@example.com, pays by direct debit to ES91 2100 0418 4502 0005 1332.',
  {
    countries: ['ES', 'GLOBAL'], // Spanish identifiers plus IBAN, cards, email…
    except: ['DATE_TIME'],       // but not dates
    policy: {
      default: 'mask', // 'mask' | 'keep' | 'block'
      kinds: { PAYMENT_CARD: 'block' },
    },
  },
);

if (!result.blocked) {
  result.anonymized_text;
  // 'The holder, with DNI <ES_NIF> and email <EMAIL_ADDRESS>, pays by direct debit to <IBAN_CODE>.'
}
```

- **61 entities**: 8 multi-country ones (IBAN, cards, email, IP…) and 53 national identifiers from Spain, Germany, the United Kingdom, Italy, Sweden, Finland, Poland, France, the Netherlands, Portugal, Belgium and Austria.
- **Checksums, not just shapes.** 34 entities are confirmed arithmetically (NIF letter, IBAN mod 97, Luhn…), so a match that passes is almost certainly real.
- **You choose what to look for and what to do with it**: filter by country, kind or name, then mask, keep or block per entity.
- **Typed end to end.** Entity names, countries and kinds are literal unions, so a typo fails at compile time.
- ESM and CommonJS, with TypeScript declarations included.

## Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Detecting](#detecting-scan)
  - [Anonymizing](#anonymizing-anonymize)
  - [Choosing what to look for](#choosing-what-to-look-for)
  - [Deciding what to do: the policy](#deciding-what-to-do-the-policy)
  - [Recipes](#recipes)
  - [Errors](#errors)
- [API reference](#api-reference)
- [Supported entities](#supported-entities)
- [How detection works](#how-detection-works)
- [Limitations](#limitations)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)

## Installation

```bash
npm install @axium-lab/euro-pii
# or
pnpm add @axium-lab/euro-pii
# or
bun add @axium-lab/euro-pii
```

Requires Node.js 22 or later. There is nothing to configure: `new EuroPii()` takes no options.

## Usage

`EuroPii` has two ways in:

| Method                    | Does                                                           |
| ------------------------- | -------------------------------------------------------------- |
| `scan(text, selection?)`  | Detects, and returns what it found. The decision is yours.      |
| `anonymize(text, options?)` | Detects **and** applies a policy: masks, keeps or blocks.       |

### Detecting: `scan()`

```ts
import { EuroPii } from '@axium-lab/euro-pii';

const ner = new EuroPii();

ner.scan('My DNI is 12345678Z and my email is luis@example.com');
```

```json
[
  {
    "entity": "ES_NIF",
    "kind": "TAX_ID",
    "dataClass": "PERSONAL",
    "identifiability": "DIRECT",
    "country": "ES",
    "start": 10,
    "end": 19,
    "score": 1,
    "value": "12345678Z",
    "pattern": "nif",
    "confirmedBy": "checksum"
  },
  {
    "entity": "EMAIL_ADDRESS",
    "kind": "EMAIL",
    "dataClass": "PERSONAL",
    "identifiability": "DIRECT",
    "country": "GLOBAL",
    "start": 36,
    "end": 52,
    "score": 0.85,
    "value": "luis@example.com",
    "pattern": "email",
    "confirmedBy": "context"
  }
]
```

Each `Detection` says:

| Field             | Meaning                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `entity`          | The entity name, e.g. `ES_NIF`.                                                                |
| `kind`            | What it is regardless of country, e.g. `TAX_ID`. See [Classification](#classification).        |
| `dataClass`       | `PERSONAL`, `FINANCIAL`, `HEALTH`, `TECHNICAL` or `CORPORATE`.                                  |
| `identifiability` | `DIRECT` if it singles someone out on its own, `QUASI` if only in combination.                  |
| `country`         | Who issues it: an ISO code, or `GLOBAL`.                                                       |
| `start`, `end`    | Offsets into the **original** text, `end` exclusive.                                           |
| `value`           | The match as written, separators included (`12345678-Z`).                                      |
| `score`           | Confidence from 0.4 to 1. See [How detection works](#how-detection-works).                      |
| `pattern`         | Which pattern of the entity matched.                                                          |
| `confirmedBy`     | `'checksum'`, `'context'` or `null`: what raised the score, if anything.                        |

Detections never overlap, and come sorted by position.

### Anonymizing: `anonymize()`

```ts
ner.anonymize('My DNI is 12345678Z and my email is luis@example.com');
```

```json
{
  "blocked": false,
  "anonymized_text": "My DNI is <ES_NIF> and my email is <EMAIL_ADDRESS>",
  "entities": [ ... ]
}
```

Every detection is replaced by `<ENTITY_NAME>`. The `entities` are the same as `scan()` returns, and **their offsets refer to the original text**, not to `anonymized_text`: `<ES_NIF>` and `12345678Z` have different lengths.

When the policy blocks (see below), the result has **no text at all**, and TypeScript will not let you read it by mistake:

```ts
type AnonymizeResult =
  | { blocked: false; anonymized_text: string; entities: Detection[] }
  | { blocked: true; blocked_by: Detection[]; entities: Detection[] };

const result = ner.anonymize(document, options);

if (result.blocked) {
  console.log('Refused because of', result.blocked_by.map((d) => d.entity));
} else {
  send(result.anonymized_text);
}
```

### Choosing what to look for

By default every entity is looked for. Four optional fields narrow it down, and both `scan()` and `anonymize()` accept them:

```ts
ner.anonymize(document, {
  countries: ['ES', 'GLOBAL'],      // by issuer
  kinds: ['TAX_ID', 'BANK_ACCOUNT'], // by kind
  entities: ['ES_NIF', 'IBAN_CODE'], // by name
  except: ['ES_VEHICLE_PLATE'],      // remove these names
});
```

- **The fields intersect.** An entity is looked for only if it matches every field present. `except` then removes names from whatever is left.
- **`GLOBAL` is a country like any other.** `countries: ['ES']` leaves out IBAN, cards and email; write `['ES', 'GLOBAL']` to keep them.
- **Mistakes throw.** A selection that matches nothing, or an unknown country, kind or name, throws a [`EuroPiiError`](#errors). A filter that silently detects nothing would look exactly like a clean text.

> [!WARNING]
> Whatever you leave out **stays in plain text**. With `countries: ['ES']`, a German tax ID in the same document is not touched.

The selection is applied **before** detecting, not to the output. This matters because overlapping detections compete and only one survives: filtering afterwards could drop the winner and lose the entity you wanted along with it.

### Deciding what to do: the policy

`anonymize()` gives each detection one of three actions:

| Action    | Effect                                                         |
| --------- | -------------------------------------------------------------- |
| `'mask'`  | Replaced by `<ENTITY_NAME>`. The default.                      |
| `'keep'`  | Left as it is in the text, but still reported in `entities`.   |
| `'block'` | The whole text is refused: no `anonymized_text` is returned.   |

```ts
ner.anonymize(document, {
  policy: {
    default: 'mask',
    kinds: { BANK_ACCOUNT: 'block' },
    entities: { EMAIL_ADDRESS: 'keep' },
  },
});
```

- **The most specific key wins**: `entities`, then `kinds`, then `default` (which is `'mask'` if omitted).
- **An explicit `'block'` is always looked for.** A block written in `entities` or `kinds` is detected even when the selection leaves that entity out, so narrowing the selection can never switch a block off by accident. Blocking an entity that is also in `except` is contradictory and throws.
- **A block that only comes from `default` stays within the selection.** `{ countries: ['ES'], policy: { default: 'block' } }` blocks on Spanish identifiers only.

### Recipes

**Spanish documents only**

```ts
ner.anonymize(document, { countries: ['ES', 'GLOBAL'] });
```

**Refuse any text containing financial data, mask the rest**

```ts
ner.anonymize(document, {
  policy: { kinds: { BANK_ACCOUNT: 'block', PAYMENT_CARD: 'block', CRYPTO: 'block' } },
});
```

**Refuse any text with personal data at all (a gate)**

```ts
const { blocked } = ner.anonymize(document, { policy: { default: 'block' } });
```

**Everything except dates**, which are rarely worth masking and the most common false positive:

```ts
ner.anonymize(document, { except: ['DATE_TIME'] });
```

**Only checksum-confirmed detections**, using `scan()` for anything the options do not cover:

```ts
const certain = ner.scan(document).filter((d) => d.confirmedBy === 'checksum');
```

**Block on health data**, by data class:

```ts
const health = ner.scan(document).filter((d) => d.dataClass === 'HEALTH');
if (health.length > 0) throw new Error('Health data is not allowed here');
```

**Your own replacement**, with the offsets from `scan()`. Go right to left so earlier offsets stay valid:

```ts
const redacted = ner
  .scan(document)
  .sort((a, b) => b.start - a.start)
  .reduce((text, d) => text.slice(0, d.start) + '█'.repeat(d.value.length) + text.slice(d.end), document);
```

### Errors

Invalid options throw a `EuroPiiError` with a `category`:

| Category         | Thrown when                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `unknown_entity` | A name in `entities`, `except` or `policy.entities` does not exist.                                           |
| `invalid_input`  | An unknown country, kind or action; a selection that matches no entity; or an entity both blocked and excepted. |

A kind that exists in the `Kind` type but no entity uses (`PHONE`) counts as unknown.

```ts
import { isEuroPiiError } from '@axium-lab/euro-pii';

try {
  ner.anonymize(document, { countries: ['ES'], entities: ['DE_TAX_ID'] });
} catch (error) {
  if (isEuroPiiError(error)) console.error(error.category, error.message);
  // invalid_input  No entity matches the selection {"countries":["ES"],"entities":["DE_TAX_ID"]}.
}
```

With TypeScript most of these never get past the compiler. The runtime checks are there for plain JavaScript and for options read from configuration.

## API reference

### `class EuroPii`

| Method                                     | Returns                                                                           |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| `scan(text, selection?: Selection)`        | `Detection[]`                                                                     |
| `anonymize(text, options?: AnonymizeOptions)` | `AnonymizeResult`                                                                      |
| `supported_entities()`                     | `Entity[]`: every entity with its classification, patterns and validation         |
| `supported_countries()`                    | `Record<Country, EntityName[]>`: each country and its entities                     |
| `supported_kinds()`                        | `Partial<Record<Kind, EntityName[]>>`: each kind in use and its entities           |

```ts
ner.supported_countries();
// { GLOBAL: ['CREDIT_CARD', 'CRYPTO', ...], ES: ['ES_NIF', 'ES_NIE', ...], ..., AT: ['AT_SOCIAL_SECURITY', 'AT_VAT_ID', 'AT_FIRMENBUCH'] }

ner.supported_kinds();
// { BANK_ACCOUNT: ['IBAN_CODE', 'ES_CCC'], COMPANY_ID: [...], ... }
```

Countries come in registry order, kinds alphabetically, and only kinds some entity uses are listed. Every call returns fresh arrays: changing them does not affect the library.

`Entity.validation.run` is a function, so `JSON.stringify(ner.supported_entities())` drops it and only `validation.kind` survives.

### Options

```ts
interface Selection {
  countries?: readonly Country[];
  kinds?: readonly Kind[];
  entities?: readonly EntityName[];
  except?: readonly EntityName[];
}

interface AnonymizeOptions extends Selection {
  policy?: {
    default?: Action;
    kinds?: Partial<Record<Kind, Action>>;
    entities?: Partial<Record<EntityName, Action>>;
  };
}

type Action = 'mask' | 'keep' | 'block';
```

### Other exports

| Export                       | What it is                                                         |
| ---------------------------- | ------------------------------------------------------------------ |
| `REGISTRY`                   | `readonly Entity[]`: every entity, in registry order               |
| `BY_NAME`                    | `Record<EntityName, Entity>`: lookup by name, e.g. `BY_NAME.ES_NIF` |
| `ENTITY_NAMES`               | `readonly EntityName[]`                                            |
| `CATALOG`                    | `Record<Country, readonly EntityName[]>`                           |
| `EuroPiiError`, `isEuroPiiError` | The error class and its type guard                                |

Types: `Action`, `AnonymizeOptions`, `AnonymizeResult`, `Country`, `DataClass`, `Detection`, `Entity`, `EntityDefinition`, `EntityName`, `Identifiability`, `Kind`, `Pattern`, `Policy`, `Selection`, `Validation`, `EuroPiiErrorCategory`, `EuroPiiErrorParams`.

## Supported entities

61 entities, 96 patterns, 18 kinds. **Validation** is what confirms a match beyond its shape: a `checksum` raises it to certainty, a `filter` can only reject impossible values (an all-zero MAC, the nil UUID).

### European Union coverage

11 of the 27 member states are supported. The multi-country entities (IBAN, cards, email…) apply to all of them. The United Kingdom (`GB`, 6 entities) is supported too, but it is not an EU member.

| Country     | Code | Status       | Entities |
| ----------- | ---- | ------------ | -------- |
| Austria     | `AT` | ✅ Supported | 3        |
| Belgium     | `BE` | ✅ Supported | 4        |
| Finland     | `FI` | ✅ Supported | 1        |
| France      | `FR` | ✅ Supported | 4        |
| Germany     | `DE` | ✅ Supported | 13       |
| Italy       | `IT` | ✅ Supported | 5        |
| Netherlands | `NL` | ✅ Supported | 3        |
| Poland      | `PL` | ✅ Supported | 1        |
| Portugal    | `PT` | ✅ Supported | 3        |
| Spain       | `ES` | ✅ Supported | 8        |
| Sweden      | `SE` | ✅ Supported | 2        |
| Bulgaria    | `BG` | 🔜 Soon      | –        |
| Croatia     | `HR` | 🔜 Soon      | –        |
| Cyprus      | `CY` | 🔜 Soon      | –        |
| Czechia     | `CZ` | 🔜 Soon      | –        |
| Denmark     | `DK` | 🔜 Soon      | –        |
| Estonia     | `EE` | 🔜 Soon      | –        |
| Greece      | `GR` | 🔜 Soon      | –        |
| Hungary     | `HU` | 🔜 Soon      | –        |
| Ireland     | `IE` | 🔜 Soon      | –        |
| Latvia      | `LV` | 🔜 Soon      | –        |
| Lithuania   | `LT` | 🔜 Soon      | –        |
| Luxembourg  | `LU` | 🔜 Soon      | –        |
| Malta       | `MT` | 🔜 Soon      | –        |
| Romania     | `RO` | 🔜 Soon      | –        |
| Slovakia    | `SK` | 🔜 Soon      | –        |
| Slovenia    | `SI` | 🔜 Soon      | –        |

### Multi-country (`GLOBAL`)

| Entity          | Kind           | Validation | Description                            |
| --------------- | -------------- | ---------- | -------------------------------------- |
| `CREDIT_CARD`   | `PAYMENT_CARD` | checksum   | Payment card number                    |
| `CRYPTO`        | `CRYPTO`       | checksum   | Bitcoin wallet address                 |
| `DATE_TIME`     | `DATE`         | –          | Date or timestamp                      |
| `EMAIL_ADDRESS` | `EMAIL`        | filter     | Email address                          |
| `IBAN_CODE`     | `BANK_ACCOUNT` | checksum   | International bank account number      |
| `IP_ADDRESS`    | `IP_ADDRESS`   | –          | IP address                             |
| `MAC_ADDRESS`   | `MAC_ADDRESS`  | filter     | Hardware MAC address                   |
| `UUID`          | `UUID`         | filter     | RFC 4122 universally unique identifier |

### Spain (`ES`)

| Entity             | Kind              | Validation | Description                                |
| ------------------ | ----------------- | ---------- | ------------------------------------------ |
| `ES_NIF`           | `TAX_ID`          | checksum   | Tax identification number (DNI)            |
| `ES_NIE`           | `NATIONAL_ID`     | checksum   | Foreigner identification number            |
| `ES_PASSPORT`      | `PASSPORT`        | –          | Passport number                            |
| `ES_CIF`           | `COMPANY_ID`      | checksum   | Tax identification number of a legal entity |
| `ES_VAT_ID`        | `VAT_ID`          | checksum   | VAT identification number                  |
| `ES_NUSS`          | `SOCIAL_SECURITY` | checksum   | Social security number                     |
| `ES_CCC`           | `BANK_ACCOUNT`    | checksum   | Bank account number (CCC)                  |
| `ES_VEHICLE_PLATE` | `VEHICLE_PLATE`   | –          | Vehicle registration plate                 |

### Germany (`DE`)

| Entity                | Kind              | Validation | Description                    |
| --------------------- | ----------------- | ---------- | ------------------------------ |
| `DE_BSNR`             | `HEALTH_ID`       | filter     | Medical practice number        |
| `DE_LANR`             | `HEALTH_ID`       | checksum   | Physician number               |
| `DE_HEALTH_INSURANCE` | `HEALTH_ID`       | filter     | Health insurance number        |
| `DE_ID_CARD`          | `NATIONAL_ID`     | checksum   | Identity card number           |
| `DE_PASSPORT`         | `PASSPORT`        | checksum   | Passport number                |
| `DE_SOCIAL_SECURITY`  | `SOCIAL_SECURITY` | checksum   | Social security number         |
| `DE_TAX_ID`           | `TAX_ID`          | checksum   | Tax identification number      |
| `DE_VAT_ID`           | `VAT_ID`          | checksum   | VAT identification number      |
| `DE_TAX_NUMBER`       | `TAX_ID`          | –          | Tax number (Steuernummer)      |
| `DE_FUEHRERSCHEIN`    | `DRIVER_LICENCE`  | –          | Driving licence number         |
| `DE_HANDELSREGISTER`  | `COMPANY_ID`      | –          | Commercial register number     |
| `DE_PLZ`              | `POSTAL_CODE`     | –          | Postal code                    |
| `DE_KFZ`              | `VEHICLE_PLATE`   | –          | Vehicle registration plate     |

### United Kingdom (`GB`)

| Entity                    | Kind              | Validation | Description                      |
| ------------------------- | ----------------- | ---------- | -------------------------------- |
| `GB_NHS`                  | `HEALTH_ID`       | checksum   | National Health Service number   |
| `GB_NINO`                 | `SOCIAL_SECURITY` | –          | National Insurance number        |
| `GB_DRIVING_LICENCE`      | `DRIVER_LICENCE`  | filter     | Driving licence number           |
| `GB_VEHICLE_REGISTRATION` | `VEHICLE_PLATE`   | checksum   | Vehicle registration plate       |
| `GB_PASSPORT`             | `PASSPORT`        | –          | Passport number                  |
| `GB_POSTCODE`             | `POSTAL_CODE`     | –          | Postcode                         |

Entity prefixes are ISO country codes, so British entities are `GB_*`. Presidio calls them `UK_*`.

### Italy (`IT`)

| Entity              | Kind             | Validation | Description            |
| ------------------- | ---------------- | ---------- | ---------------------- |
| `IT_FISCAL_CODE`    | `TAX_ID`         | checksum   | Fiscal code            |
| `IT_VAT_CODE`       | `VAT_ID`         | checksum   | VAT code               |
| `IT_DRIVER_LICENSE` | `DRIVER_LICENCE` | –          | Driving licence number |
| `IT_IDENTITY_CARD`  | `NATIONAL_ID`    | –          | Identity card number   |
| `IT_PASSPORT`       | `PASSPORT`       | –          | Passport number        |

### Sweden (`SE`), Finland (`FI`), Poland (`PL`)

| Entity                      | Kind          | Validation | Description                    |
| --------------------------- | ------------- | ---------- | ------------------------------ |
| `SE_PERSONNUMMER`           | `NATIONAL_ID` | checksum   | Personal identity number       |
| `SE_ORGANISATIONSNUMMER`    | `COMPANY_ID`  | checksum   | Organisation number            |
| `FI_PERSONAL_IDENTITY_CODE` | `NATIONAL_ID` | checksum   | Personal identity code         |
| `PL_PESEL`                  | `NATIONAL_ID` | checksum   | National identification number |

### France (`FR`)

| Entity             | Kind              | Validation | Description                       |
| ------------------ | ----------------- | ---------- | --------------------------------- |
| `FR_NIR`           | `SOCIAL_SECURITY` | checksum   | Social security number (NIR)      |
| `FR_VAT_ID`        | `VAT_ID`          | checksum   | VAT identification number         |
| `FR_PASSPORT`      | `PASSPORT`        | –          | Passport number                   |
| `FR_VEHICLE_PLATE` | `VEHICLE_PLATE`   | –          | Vehicle registration plate (SIV)  |

### Netherlands (`NL`), Portugal (`PT`)

| Entity             | Kind            | Validation | Description                         |
| ------------------ | --------------- | ---------- | ----------------------------------- |
| `NL_VAT_ID`        | `VAT_ID`        | checksum   | VAT identification number (btw-id)  |
| `NL_POSTCODE`      | `POSTAL_CODE`   | –          | Postcode                            |
| `NL_VEHICLE_PLATE` | `VEHICLE_PLATE` | –          | Vehicle registration plate          |
| `PT_CITIZEN_CARD`  | `NATIONAL_ID`   | checksum   | Citizen card number                 |
| `PT_POSTAL_CODE`   | `POSTAL_CODE`   | –          | Postal code                         |
| `PT_VEHICLE_PLATE` | `VEHICLE_PLATE` | –          | Vehicle registration plate          |

### Belgium (`BE`), Austria (`AT`)

| Entity               | Kind              | Validation | Description                         |
| -------------------- | ----------------- | ---------- | ----------------------------------- |
| `BE_NATIONAL_NUMBER` | `NATIONAL_ID`     | checksum   | National register number            |
| `BE_EID_CARD`        | `NATIONAL_ID`     | checksum   | Identity card number                |
| `BE_COMPANY_ID`      | `COMPANY_ID`      | checksum   | Enterprise number (KBO/BCE)         |
| `BE_VAT_ID`          | `VAT_ID`          | checksum   | VAT identification number           |
| `AT_SOCIAL_SECURITY` | `SOCIAL_SECURITY` | checksum   | Social security number              |
| `AT_VAT_ID`          | `VAT_ID`          | checksum   | VAT identification number (UID)     |
| `AT_FIRMENBUCH`      | `COMPANY_ID`      | checksum   | Company register number             |

### Classification

Every entity, and every detection, carries four classifications:

| Field             | Answers                                | Values                                                           |
| ----------------- | -------------------------------------- | ---------------------------------------------------------------- |
| `country`         | Who issues it?                         | `GLOBAL` `ES` `DE` `GB` `IT` `SE` `FI` `PL` `FR` `NL` `PT` `BE` `AT` |
| `kind`            | What is it, whatever the country?      | `TAX_ID` `PASSPORT` `DRIVER_LICENCE` `BANK_ACCOUNT`… (18 in use) |
| `dataClass`       | What sort of sensitive data is it?     | `PERSONAL` `FINANCIAL` `HEALTH` `TECHNICAL` `CORPORATE`          |
| `identifiability` | Does it identify someone on its own?   | `DIRECT` `QUASI`                                                 |

`kind` lets you treat alike what each country names differently: `DE_FUEHRERSCHEIN`, `GB_DRIVING_LICENCE` and `IT_DRIVER_LICENSE` are all `DRIVER_LICENCE`.

`dataClass`:

- **`PERSONAL` (40)**: identifies or describes a natural person. The GDPR default.
- **`FINANCIAL` (4)**: `CREDIT_CARD`, `CRYPTO`, `IBAN_CODE`, `ES_CCC`.
- **`HEALTH` (4)**: `DE_BSNR`, `DE_LANR`, `DE_HEALTH_INSURANCE`, `GB_NHS`. A special category under GDPR art. 9.
- **`TECHNICAL` (3)**: `IP_ADDRESS`, `MAC_ADDRESS`, `UUID`.
- **`CORPORATE` (10)**: `ES_CIF`, `DE_VAT_ID`, `DE_HANDELSREGISTER`, `IT_VAT_CODE`, `SE_ORGANISATIONSNUMMER`, `FR_VAT_ID`, `BE_COMPANY_ID`, `BE_VAT_ID`, `AT_VAT_ID`, `AT_FIRMENBUCH`. They identify companies and are usually not personal data.

`identifiability`: only `DATE_TIME`, `DE_PLZ`, `GB_POSTCODE`, `NL_POSTCODE` and `PT_POSTAL_CODE` are `QUASI`. None identifies anyone alone, but a postcode plus a birth date often does.

When an entity could fall either way, it takes the more protective classification: `info@company.com` is not personal, but a regex cannot tell it from a person's address, so `EMAIL_ADDRESS` is `PERSONAL`.

## How detection works

The score is not "this is valid", it is **how confident the detection is**. It is built in three steps:

1. **The pattern** gives a base score, from 0.01 to 0.8 depending on how specific its shape is.
2. **The checksum**, if the entity has one and it passes, raises it to **1** and sets `confirmedBy: 'checksum'`.
3. **Context words** near the match (within 40 characters on either side) add 0.35, with a floor of 0.4, and set `confirmedBy: 'context'`. Context words are local: `dni`, `personalausweis`, `henkilötunnus`. It is a literal search, not semantic.

Anything still below **0.4** is dropped.

Worth knowing:

- **A failed checksum does not drop the detection.** An ID number with a typo still identifies a person, so it is kept with its base score and `confirmedBy: null`. Masking one word too many is cheaper than publishing an ID number.
- **A failed filter does drop it.** Filters only reject shapes that cannot be real.
- **Low-score entities need context.** A bare 5-digit number is not reported as a German postcode unless `PLZ` or similar is nearby.
- **Overlapping detections compete, and one wins**: highest score, then longest, then earliest, then alphabetical by name. That last tie-break is arbitrary: `8112180008` passes both the Swedish and the NHS checksums, and comes out as `GB_NHS` even next to the word "personnummer".

## Limitations

What euro-pii does **not** detect matters as much as what it does:

- **Names, addresses and company names.** A name has no shape a regex can recognise; detecting it needs a language model. In `The holder Pedro Losas, with DNI <ES_NIF>`, the name stays in plain text.
- **Phone numbers.** Reliable detection needs a numbering-plan library, not a regex.
- **URLs.** A correct pattern needs the full list of top-level domains.
- **Countries outside the list above.** A Danish or Greek national ID is only caught if it happens to match a multi-country entity.
- **Bare numbers from France, the Netherlands, Portugal, Belgium and Austria.** Their identifiers are only covered where they cannot be confused with another entity. Plain digit runs (the SIREN, the BSN, the Portuguese NIF) are left out, and the Belgian national number, Belgian enterprise number, Austrian social security number and French NIR are only found in their grouped form (`85.07.30-033.28`, not `85073003328`).

So `blocked: false`, or an empty `scan()`, means "nothing I know how to look for", **not** "this text contains no personal data". Use euro-pii as one layer of a pipeline, not as the guarantee.

## Contributing

```bash
bun install
bun run typecheck   # tsc --noEmit
bun run manual      # the scenarios in tests/
bun run build       # ESM + CJS into dist/, with types
```

The tests are scripts that print their results. Two of them **check** behaviour and exit non-zero on failure:

- `bun tests/methods/documents.ts` runs one sample document per country and fails if an expected entity is missing.
- `bun tests/methods/options.ts` checks the selection and policy rules.

Each country has a sample document in `tests/fixtures/xx_document.ts`, with every identifier's checksum valid. The labels are in the local language, because without local context words the low-score entities never reach the threshold.

### Adding an entity or a country

Each country is a folder in `src/entities/`, with one file per entity. Multi-country entities live in `global/`.

```
src/entities/
  index.ts            ← joins every country: REGISTRY and EntityName come from here
  spain/
    nif.ts            ← one entity
    nie.ts
    checksums.ts      ← its validation algorithms
    index.ts          ← the country's entities, in order
```

An entity file starts with its classification:

```ts
export const ES_NIF = defineEntity({
  // ── Classification ──────────────────────────
  name: 'ES_NIF',
  country: 'ES',
  kind: 'TAX_ID',
  dataClass: 'PERSONAL',
  identifiability: 'DIRECT',

  // ── Detection ───────────────────────────────
  description: 'Spanish tax identification number',
  patterns: [{ name: 'nif', regex: String.raw`...`, score: 0.5 }],
  validation: { kind: 'checksum', run: nifValid },
  context: ['dni', 'nif', 'documento nacional de identidad', 'identificación'],
});
```

**A new entity**: create its file and add it to its country's `index.ts`. `EntityName`, the catalog and the `supported_*()` methods all derive from there.

**A new country** also needs its code added to `Country` in `src/core/types.ts`, and its list added to `ENTITIES` and `CATALOG` in `src/entities/index.ts`.

The compiler catches a missing or misspelled classification, an entity whose country does not match its folder, and a country missing from `CATALOG`. The one thing it does not catch is an entity file never added to its country's `index.ts`: it simply goes unused.

Please add the new identifiers to the country's sample document, with valid checksums, so `documents.ts` covers them.

## Acknowledgements

Most patterns, checksums and context words are ported from [Microsoft Presidio](https://github.com/microsoft/presidio) (commit `2bb88d2`, MIT licence) and verified against its source.

## License

[MIT](LICENSE) © 2026 Axium Lab. The [LICENSE](LICENSE) file also carries Microsoft Presidio's MIT notice, which covers the ported patterns.
