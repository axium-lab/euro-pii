/** Lanza todos los escenarios manuales de tests/methods/, uno por proceso. */
import { spawnSync } from 'node:child_process';

// run('documents');
run('text');
// run('entities');

function run(name: string): void {
  console.log(
    `\n════ methods/${name}.ts ═══════════════════════════════════════`,
  );

  const script = new URL(`./methods/${name}.ts`, import.meta.url).pathname;

  const { status } = spawnSync('bun', [script], { stdio: 'inherit' });

  if (status !== 0) process.exit(status ?? 1);
}
