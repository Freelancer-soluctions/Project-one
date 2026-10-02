# server-typescript-migration

**Change unificado (2026-10-01):** absorbe `typescript-strict-check` (eliminado) — su orden gradual de flags `strict` es ahora la Fase 4 de este change; su infraestructura (tsconfigs, `type-check`, `server-typecheck` activo) ya existe en el árbol por el change `quality-gates` y se verifica, no se reimplementa.

Incremental TypeScript migration of `apps/server` (228 JS files, ~29k lines) — Phase 0 tooling infrastructure (verified), strangler-fig conversion in follow-up phase changes, and gradual strict hardening as Phase 4 (single owner). Research: `docs/learning/typescript-migration-server.md`
