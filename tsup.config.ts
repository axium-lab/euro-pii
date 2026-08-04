import { defineConfig } from 'tsup';

// Dual ESM + CJS build, mirroring @axium-lab/docxium. Types are emitted once
// from the ESM pass and shared through package.json#exports.
// No externals: the library has zero runtime dependencies.
export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    outDir: 'dist/esm',
    target: 'es2022',
    dts: true,
    splitting: false,
    clean: false,
  },
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    outDir: 'dist/cjs',
    target: 'es2022',
    dts: false,
    splitting: false,
    clean: false,
  },
]);
