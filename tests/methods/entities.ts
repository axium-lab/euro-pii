import { Nerium, REGISTRY } from '../../src/index';

// Careful: JSON.stringify drops `validation.run` because it is a function. Its
// `kind` survives, which is the part worth looking at here.
console.log('\n── full registry');
console.log(JSON.stringify(new Nerium().supported_entities(), null, 2));

console.log('\n── grouped by kind');
const byKind = new Map<string, string[]>();
for (const entity of REGISTRY) {
  byKind.set(entity.kind, [
    ...(byKind.get(entity.kind) ?? []),
    `${entity.name}(${entity.country})`,
  ]);
}
console.log(
  JSON.stringify(Object.fromEntries([...byKind].sort()), null, 2),
);

console.log('\n── counts');
console.log(
  JSON.stringify(
    {
      entities: REGISTRY.length,
      patterns: REGISTRY.reduce((total, e) => total + e.patterns.length, 0),
      with_checksum: REGISTRY.filter((e) => e.validation?.kind === 'checksum')
        .length,
      with_filter: REGISTRY.filter((e) => e.validation?.kind === 'filter')
        .length,
      without_validation: REGISTRY.filter((e) => e.validation === undefined)
        .length,
    },
    null,
    2,
  ),
);
