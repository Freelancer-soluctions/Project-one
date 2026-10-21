# Design

> Cambio de bugs latentes descubiertos por la migración TS (registrados sin fix por zero-behavior-change). Verificado por @planner (2026-10-20): los 3 bugs confirmados contra el código real; 2 bloqueadores de approach corregidos aquí.

## Decisión 1 — Fix 1: el setter va en AMBAS factories y los 3 caminos de éxito (P0-1)

`events/routes.ts` L243 monta `checkRoleAuthOrPermisssion` (NO `checkRoleAuth`). Análisis de caminos:

| Factory                                | Caminos de éxito                                                                                                                                   | `req.userRole` hoy                        |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `checkRoleAuth` (L33-47)               | 1: roles permitidos → next()                                                                                                                       | ❌ const local, nunca asigna              |
| `checkRoleAuthOrPermisssion` (L87-159) | 3: (a) `userRoleCode === ADMIN` → next() (L110-112); (b) `permissions.length === 0` → next() (L122-124); (c) permiso concedido → next() (L146-152) | ❌ usa `userRoleCode` local, nunca asigna |

**El fix DEBE asignar `req.userRole = userRoleCode` (o `user.roles.code`) en TODOS los caminos de éxito de AMBAS factories.** Si se parchea solo `checkRoleAuth` → el bug de events sigue vivo; si solo el camino de permisos → el ADMIN recibe 403 (inversión del fallo). El tipo global `userRole?: string` YA existe en `verifyToken.ts` (`declare global`, con comentario "Set por verifyRole" — hoy mentira, pasa a verdad).

Consecuencia de producto: NO es nueva — `openspec/specs/soft-delete-query/spec.md` L24-33 YA exige "ADMIN bypass soft-delete filter / Non-ADMIN using showDeleted returns 403". El fix RESTAURA conformidad con esa spec publicada. Task 1.1 verifica consumers del frontend, no reabre la decisión.

## Decisión 2 — Fix 2: aplanado en el SERVICE, solo PATCH, preservando `language` (P2-1/P2-2)

Verificado: el **create/upsert NO tiene el bug** — `settings/service.ts` L67-69 ya despliega `{ ...displayOptions, createdOn }` en el service. El bug es **exclusivo del PATCH**: controller L173 pasa `updateData.displayOptions = displayOptions` crudo → dao L223 `Prisma.settingsUpdateInput` → clave inexistente en el modelo (8 columnas planas). **Por qué `strict` no lo detectó**: `updateData` es variable (no literal) → excess property check no aplica → el test con mock del dao (task 2.3) es el instrumento válido.

El aplanado va en el **service** (consistencia con el create) y debe **preservar `language`** (el controller acepta `language` + `displayOptions` juntos; un spread de solo displayOptions lo descartaría). El create NO se toca.

## Decisión 3 — dotenv: Opción C híbrida (P1-1/P1-2)

**Rechazadas:** (a) firma `string | undefined` global — rompe el tipado de jsonwebtoken en 6 sitios, obliga a ramificar ~23 call-sites, y no añade valor a los ~12 consumidores opcionales que ya tienen default propio (`|| 3000`, `Number(...) || 20`, `Math.max(12, ...)`); (b) throw en module-scope de dotenv.ts — el blast radius es todo el suite (logger/pagination importan dotenv transitivamente; 144 test files).

**Elegida — Opción C:** mantener `dotenv(key): string` (con `?? ''`) para keys opcionales y añadir:

```ts
export function requireEnv(key: CriticalEnvKey): string {
  const value = process.env[key];
  if (!value) throw new Error(`❌ Missing required env var: ${key}`);
  return value;
}
```

usada en las **~10 llamadas críticas**: `SECRETKEY` (verifyToken L86, socket/auth L43, createToken L10/L158), **`REFRESHSECRETKEY`** (createToken L34/L182 — ausente del proposal original, igual de crítica), `AES_GCM_KEY` (encription-prisma-middleware L20 YA tiene guard fail-loud ✓, pero `prisma-query.ts` L11 hace `Buffer.from(...)` **sin guard** → degrada en silencio devolviendo ciphertext — este es el agujero real), `ALGORITHM`.

Inventario real (verificado): ~26 llamadas (2 comentadas), ~10-11 críticas. Corrección del proposal: el conteo "23" no distinguía críticas de opcionales.

**Testabilidad garantizada:** `.env.test` está commiteado (SECRETKEY, REFRESHSECRETKEY, AES_GCM_KEY, ALGORITHM presentes) y `setupGlobal.ts` lo carga como globalSetup → los tests no se afectan. El throw perezoso en el acceso está scoped al call-site real.

## Decisión 4 — Alcance excluido (follow-ups registrados)

- `patchSettingsById` no setea `updatedOn` (el create sí) — mismo tipo de defecto latente; follow-up, no este change.
- `checkRoleAuthOrPermisssion` L98 usa `userId as number` sin guard de `!userId` (403 vs 401) — cosmético, fuera de alcance.
- La spec de soft-delete-query ya cubre el 403 — este change cruza por referencia, no redeclara.
