import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Proyecto vitest MINIMO y AUTONOMO para `scripts/ci/**`.
// Motivo: los configs de los workspaces usan `root: <workspace>`, asi que
// `scripts/` queda fuera de su `include`; este proyecto lo cubre sin tocar
// esos configs ni el array `workspaces` del manifest raiz.
export default defineConfig({
  test: {
    root: __dirname,
    include: ['scripts/ci/*.test.mjs'],
    environment: 'node',
  },
});
