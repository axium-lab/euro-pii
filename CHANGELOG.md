# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2026-10-05

### Changed

- The package is now published under the `@axium-lab` scope: install it as `@axium-lab/euro-pii`.

## [1.0.0] - 2026-10-04

First public release.

### Added

- `EuroPii` class with two entry points:
  - `scan(text, selection?)` detects personal data and returns each match with its offsets in the original text, its value and its score.
  - `anonymize(text, options?)` detects and applies a policy (`mask`, `keep` or `block`) per entity, per kind or by default. If an entity is blocked, the result has no anonymized text, and `blocked_by` says which entity caused it.
- Selection by country, kind or entity name, with `except` to leave out specific entities.
- 61 entities: 8 multi-country ones (IBAN, credit card, email, IP and MAC address, UUID…) and 53 national identifiers from Spain, Germany, the United Kingdom, Italy, Sweden, Finland, Poland, France, the Netherlands, Portugal, Belgium and Austria.
- Checksum validation for 34 entities (NIF letter, IBAN mod 97, Luhn…), and context words to raise the score of low-confidence matches.
- Classification of every entity by `country`, `kind`, `dataClass` and `identifiability`.
- `supported_entities()`, `supported_countries()` and `supported_kinds()` to inspect the catalog, plus the `REGISTRY`, `BY_NAME`, `ENTITY_NAMES` and `CATALOG` exports.
- `EuroPiiError` and `isEuroPiiError` for typed errors.
- Typed end to end: entity names, countries and kinds are literal unions.
- ESM and CommonJS builds with TypeScript declarations. Zero runtime dependencies. Requires Node.js 22 or later.

[Unreleased]: https://github.com/axium-lab/euro-pii/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/axium-lab/euro-pii/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/axium-lab/euro-pii/releases/tag/v1.0.0
