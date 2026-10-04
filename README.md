# @axium-lab/nerium

Detection and anonymization of personal data in text, **without machine learning**. Just regex, checksums and context words.

Scope: Europe. 44 entities across 7 countries plus the multi-country ones.

> **Provisional.** The package works and has been verified, but the API may still change.

## Usage

There is nothing to configure: `new Nerium()` takes no options.

```ts
import { Nerium } from '@axium-lab/nerium';

const { anonymized_text, entities } = new Nerium().text(document, true);
```

| Method                  | Returns                                                  |
| ----------------------- | -------------------------------------------------------- |
| `text(text, anonymizes)` | `ScanResult`: the masked text plus what was found       |
| `supported_entities()`  | `Entity[]`: every entity with its patterns and validation |
| `supported_countries()` | `Record<Country, EntityName[]>`: each country and its entities |
| `supported_kinds()`     | `Partial<Record<Kind, EntityName[]>>`: each kind in use and its entities |

### `text()`

Text goes in; out comes the text with the identifiers masked, plus the detail of what was found:

```ts
new Nerium().text('El titular con DNI 12345678-Z firma el contrato.', true);
```

```json
{
  "blocked": false,
  "anonymized_text": "El titular con DNI <ES_NIF> firma el contrato.",
  "entities": [
    {
      "entity": "ES_NIF",
      "kind": "TAX_ID",
      "dataClass": "PERSONAL",
      "identifiability": "DIRECT",
      "country": "ES",
      "start": 19,
      "end": 29,
      "score": 1,
      "value": "12345678-Z",
      "pattern": "nif",
      "confirmedBy": "checksum"
    }
  ]
}
```

**Offsets refer to the original text**, never to the anonymized one. `<ES_NIF>` is 8 characters long and `12345678-Z` is 10, so those positions are no longer valid in the masked text.

#### The second argument: mask or block

```ts
ner.text(document, true); // returns the anonymized text
ner.text(document, false); // if it finds anything, blocks and does NOT return the text
```

The blocked result **has no text field**, so TypeScript stops you from reading it by mistake:

```ts
type ScanResult =
  | { blocked: false; anonymized_text: string; entities: Detection[] }
  | { blocked: true; entities: Detection[] };
```

#### Filtering the result

Nothing is configured on the way in: everything is always detected and the output is filtered. That way you never leave an ID number in plain text because you filtered too much.

```ts
const { entities } = new Nerium().text(document, true);

entities.filter((d) => d.kind === 'BANK_ACCOUNT');
entities.filter((d) => d.dataClass === 'HEALTH');
entities.filter((d) => d.identifiability === 'DIRECT');
entities.filter((d) => d.country === 'ES');
entities.filter((d) => d.score === 1);
```

### What it supports

`supported_entities()` returns the full registry: every entity with its classification, patterns, validation and context words. `validation.run` is a function, so `JSON.stringify` drops it and only `validation.kind` survives.

`supported_countries()` and `supported_kinds()` return entity **names**, grouped:

```ts
const ner = new Nerium();

ner.supported_countries();
// {
//   GLOBAL: ['CREDIT_CARD', 'CRYPTO', 'DATE_TIME', ...],
//   ES: ['ES_NIF', 'ES_NIE', 'ES_PASSPORT', ...],
//   ...
//   PL: ['PL_PESEL'],
// }

ner.supported_kinds();
// {
//   BANK_ACCOUNT: ['IBAN_CODE', 'ES_CCC'],
//   DRIVER_LICENCE: ['DE_FUEHRERSCHEIN', 'GB_DRIVING_LICENCE', 'IT_DRIVER_LICENSE'],
//   ...
// }
```

- Countries come in registry order, and so do the entities inside each group.
- Kinds come in alphabetical order, and **only the ones some entity uses** are listed: `PHONE` is declared in `Kind` but nothing detects it. That is why the return type is `Partial`.
- Every call returns fresh arrays, so changing the result does not touch the registry.

To get the full entity from a name, use `BY_NAME`:

```ts
import { BY_NAME } from '@axium-lab/nerium';

BY_NAME.ES_NIF.patterns;
```

The package also exports `REGISTRY`, `ENTITY_NAMES` and `CATALOG`, the same data without instantiating `Nerium`.

## What it detects

| Country             | Entities                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Global (8)          | `CREDIT_CARD` `CRYPTO` `DATE_TIME` `EMAIL_ADDRESS` `IBAN_CODE` `IP_ADDRESS` `MAC_ADDRESS` `UUID`                                                                                            |
| Germany (13)        | `DE_BSNR` `DE_LANR` `DE_HEALTH_INSURANCE` `DE_ID_CARD` `DE_PASSPORT` `DE_SOCIAL_SECURITY` `DE_TAX_ID` `DE_VAT_ID` `DE_TAX_NUMBER` `DE_FUEHRERSCHEIN` `DE_HANDELSREGISTER` `DE_PLZ` `DE_KFZ` |
| United Kingdom (6)  | `GB_NHS` `GB_NINO` `GB_DRIVING_LICENCE` `GB_VEHICLE_REGISTRATION` `GB_PASSPORT` `GB_POSTCODE`                                                                                               |
| Italy (5)           | `IT_FISCAL_CODE` `IT_VAT_CODE` `IT_DRIVER_LICENSE` `IT_IDENTITY_CARD` `IT_PASSPORT`                                                                                                         |
| Spain (8)           | `ES_NIF` `ES_NIE` `ES_PASSPORT` `ES_CIF` `ES_VAT_ID` `ES_NUSS` `ES_CCC` `ES_VEHICLE_PLATE`                                                                                                  |
| Sweden (2)          | `SE_PERSONNUMMER` `SE_ORGANISATIONSNUMMER`                                                                                                                                                  |
| Finland (1)         | `FI_PERSONAL_IDENTITY_CODE`                                                                                                                                                                 |
| Poland (1)          | `PL_PESEL`                                                                                                                                                                                  |

44 entities, 75 patterns, 18 distinct `kind`s. Of the 44: **23 with a checksum**, 6 with a filter and 15 without validation.

Each entity's prefix is its country's ISO code, so the British ones are `GB_*`. In Presidio they are called `UK_*`.

## How each entity is classified

Every entity carries four classifications, each with a single value, and all of them also travel in every detection:

| Field             | Answers                                    | Values                                                           |
| ----------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| `country`         | Who issues it?                             | `GLOBAL` `ES` `DE` `GB` `IT` `SE` `FI` `PL`                      |
| `kind`            | What is it, whatever the country?          | `TAX_ID` `PASSPORT` `DRIVER_LICENCE` `BANK_ACCOUNT`… (18 in use) |
| `dataClass`       | What sort of sensitive data is it?         | `PERSONAL` `FINANCIAL` `HEALTH` `TECHNICAL` `CORPORATE`          |
| `identifiability` | Does it identify someone on its own?       | `DIRECT` `QUASI`                                                 |

`kind` is what lets you treat alike documents that each country names differently: `DE_FUEHRERSCHEIN`, `GB_DRIVING_LICENCE` and `IT_DRIVER_LICENSE` are all `DRIVER_LICENCE`.

`dataClass`:

- **`PERSONAL` (28):** identifies or describes a natural person. The GDPR default.
- **`FINANCIAL` (4):** `CREDIT_CARD`, `CRYPTO`, `IBAN_CODE`, `ES_CCC`.
- **`HEALTH` (4):** `DE_BSNR`, `DE_LANR`, `DE_HEALTH_INSURANCE`, `GB_NHS`. A special category under GDPR art. 9.
- **`TECHNICAL` (3):** `IP_ADDRESS`, `MAC_ADDRESS`, `UUID`.
- **`CORPORATE` (5):** `ES_CIF`, `DE_VAT_ID`, `DE_HANDELSREGISTER`, `IT_VAT_CODE`, `SE_ORGANISATIONSNUMMER`. They identify companies and are usually not personal data.

`identifiability`: only **3 are `QUASI`** (`DATE_TIME`, `DE_PLZ`, `GB_POSTCODE`). None identifies anyone on its own, but postcode plus birth date does.

When in doubt, each entity takes the more protective classification: an email can be `info@company.com`, but the regex cannot tell it from a person's, so it is `PERSONAL`.

## How the score is decided

The score does not say "this is valid", it says **how confident the detection is**. Three layers, in this order:

1. **The pattern** contributes a base score, from 0.01 to 0.8 depending on how specific its shape is.
2. **The checksum**, if there is one and it matches, raises it to **1.0** and sets `confirmedBy: 'checksum'`. It is arithmetic: the NIF letter, the IBAN's mod 97, Luhn on the card.
3. **Context words** within a 40-character window add 0.35 with a floor of 0.4, and set `confirmedBy: 'context'`. It is a literal term search, not semantic similarity.

Anything left below **0.4** is dropped.

Behaviours worth knowing:

- **A failing checksum does NOT drop the detection.** An ID number with a typo still identifies a person, so it is masked anyway, with its base score and `confirmedBy: null`. A false positive costs one word masked too many; a false negative costs a published ID number.
- **A `filter` does drop it.** It is the validation that can only reject impossible shapes and never confirm, such as the nil UUID or an all-zero MAC.
- **When two detections overlap, only one wins**: the one with the highest score, then the longest, then the one that starts first and, if they are still tied, **the first by alphabetical order of the name**. That last tie-break is arbitrary: `8112180008` passes both the Swedish Luhn and the NHS mod 11, and comes out as `GB_NHS` even if "personnummer" is right next to it.

## What it does NOT detect

This matters more than the list above:

- **Person names, addresses and companies.** `PERSON` needs a machine learning model; a name has no shape a regex can recognize. In `El titular Pedro Losas con DNI <ES_NIF>` the name **stays in plain text**.
- **`URL`**, whose real pattern is an alternation of over 600 hand-written TLDs, incomplete by construction.
- **`PHONE_NUMBER`**, which the source does not detect with a regex: it delegates to a phone number library.

So `blocked: false` means "I found nothing of what I know how to look for", **not** "this text is clean".

## Adding an entity or a country

Each country is a folder in `src/entities/`, with one file per entity. The ones belonging to no country live in `global/`.

```
src/entities/
  index.ts            ← joins every country: REGISTRY and EntityName come from here
  spain/
    nif.ts            ← one entity
    nie.ts
    passport.ts
    checksums.ts      ← its validation algorithms
    index.ts          ← the country's entities, in order
```

Each file starts with its classification, so it reads without scrolling down to the code:

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
  patterns: [{ name: 'nif', regex: String.raw`\b[0-9]?[0-9]{7}[-]?[A-Z]\b`, score: 0.5 }],
  validation: { kind: 'checksum', run: nifValid },
  context: ['dni', 'nif', 'documento nacional de identidad', 'identificación'],
});
```

**A new entity** takes two steps: create its file and add it to the list in its country's `index.ts`. `EntityName`, the catalog, `supported_countries()` and `supported_kinds()` are all derived from there.

**A new country** also needs:

1. its code added to `Country` in `src/core/types.ts`;
2. its list added to `ENTITIES` and its key to `CATALOG` in `src/entities/index.ts`.

What does not compile:

- a missing classification field, or a misspelled value (`'TAX_IDD'`);
- an entity that declares a country other than its folder's: the country's `index.ts` checks it with `satisfies`;
- a country in `Country` that is missing from `CATALOG`.

The only thing that does **not** warn you: an entity file that is never added to its country's `index.ts`. It simply goes unused.

## Development

```bash
bun install
bun run typecheck   # tsc --noEmit
bun run manual      # the scenarios in tests/
bun run build       # ESM + CJS dist + types
```

The tests are manual scripts that print JSON, in the style of `@axium-lab/docxium`. `tests/methods/documents.ts` is the only one that **checks** anything: it runs a sample document per country and fails if any expected entity is missing. `bun tests/manual.test.ts` prints what `supported_entities()`, `supported_countries()` and `supported_kinds()` return.

Each country has its document in `tests/fixtures/xx_document.ts` (the global ones in `global_document.ts`), with every identifier's checksum computed. The prose is in Spanish but the labels are in the local language, because context words are local and without them the low-score entities never reach the threshold.

## Where the patterns come from

Ported from [Presidio](https://github.com/microsoft/presidio) (commit `2bb88d2`) and verified against its source code.
