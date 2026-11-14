# Design: ci-typescript-strict-config

## Decisiones

### D1 — Strict incremental, no "strict desde cero"
Activar `strict: true` en `tsconfig.base.json` y propagarlo a `apps/server/tsconfig.json` vía `extends`. Los 230 `.ts` ya compilan limpio (`tsc --noEmit` exit 0), así que no hay deuda de tipos. Se excluyen `noUnusedLocals`/`noUnusedParameters` para no bloquear por variables no usadas en código legacy.

### D2 — Base compartida en raíz
Crear `tsconfig.base.json` en la raíz con `strict: true`, `target: ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`, `esModuleInterop`, `skipLibCheck`, `forceConsistentCasingInFileNames`, `resolveJsonModule`, `isolatedModules`. `apps/server/tsconfig.json` extiende `../../tsconfig.base.json`.

### D3 — Build con project references (composite)
- `apps/server/tsconfig.json`: `composite: true`, `outDir: ./dist`, `rootDir: ./src`, `tsBuildInfoFile: ./.cache/tsc/tsconfig.tsbuildinfo`.
- Root `tsconfig.json`: `files: []`, `references: [{ path: "./apps/server" }]`.
- Build: `tsc -b` (project references). Typecheck CI: `tsc --noEmit -p apps/server/tsconfig.json` (o `tsc -b --noEmit`).
- Reconciliación con `ci-build-gates`: ese change usa `tsc -p apps/server/tsconfig.build.json` (sin composite). Este change introduce composite; `ci-build-gates` debe migrar a `tsc -b` en un follow-up. Hasta entonces, ambos coexisten: `tsconfig.build.json` para el build gate, `tsconfig.json` (composite) para typecheck.

### D4 — Type stripping (Node 22+)
Node ≥22.11 soporta `--experimental-strip-types`. Considerar para dev, pero mantener `tsx` como runtime principal (ya en uso). No bloqueante.

### D5 — Include acotado
`include: ["src"]` únicamente (no `scripts`, `prisma`, `tests`) para evitar TS6059 cuando `rootDir` es `src`.

### D6 — @types/node
Pin `@types/node` en root y apps/server a la misma versión (26.6.5, ya en server).

## Riesgos
- `tsc -b` requiere que todos los imports sean relativos o via paths; verificar.
- `composite` requiere `declaration: true` implícito; puede generar .d.ts en dist/. Mitigar con `declaration: false`? No, composite requiere declarations. Aceptar.
- Conflicto con ci-build-gates: resolver en D3.