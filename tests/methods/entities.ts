import { Nerium, REGISTRY } from '../../src/index';

// Ojo: JSON.stringify se come `validation.run` porque es una funcion. Queda su
// `kind`, que es lo que interesa mirar aqui.
console.log('\n── registry completo');
console.log(JSON.stringify(new Nerium().supported_entities(), null, 2));

console.log('\n── agrupado por categoria');
const porCategoria = new Map<string, string[]>();
for (const entity of REGISTRY) {
  porCategoria.set(entity.category, [
    ...(porCategoria.get(entity.category) ?? []),
    `${entity.name}(${entity.country})`,
  ]);
}
console.log(
  JSON.stringify(Object.fromEntries([...porCategoria].sort()), null, 2),
);

console.log('\n── cuentas');
console.log(
  JSON.stringify(
    {
      entidades: REGISTRY.length,
      patrones: REGISTRY.reduce((total, e) => total + e.patterns.length, 0),
      con_checksum: REGISTRY.filter((e) => e.validation?.kind === 'checksum')
        .length,
      con_filtro: REGISTRY.filter((e) => e.validation?.kind === 'filter').length,
      sin_validacion: REGISTRY.filter((e) => e.validation === undefined).length,
    },
    null,
    2,
  ),
);
