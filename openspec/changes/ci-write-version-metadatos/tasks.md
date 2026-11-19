# Tasks

## 1. Script write-version.mjs

- [x] 1.1 Crear `scripts/write-version.mjs` que escribe `dist/version.json` con `{ revision, created }`.
- [x] 1.2 Usar `GITHUB_SHA` o `git rev-parse HEAD` para revision.
- [x] 1.3 Usar `SOURCE_DATE_EPOCH` o fecha del commit (`git log -1 --format=%ct`) para created; solo `Date.now()` si se pide explícitamente.
- [x] 1.4 Añadir `SOURCE_DATE_EPOCH` al build de imagen (Dockerfile o build arg de BuildKit).

## 2. Endpoint de versión

- [x] 2.1 Añadir endpoint en `apps/server` que sirva `version.json` (soporte).

## 3. Verificación

- [x] 3.1 Ejecutar dos builds del mismo commit y comparar `version.json` (deben ser idénticos).
- [x] 3.2 Verificar que `Date.now()` no se usa por defecto.

## Resultado de la verificación (2026-11-18)

Commit de prueba: `4420021b63228a185b07ebb84e5cf9534d626409` (epoch `1795044485` →
`2026-11-18T23:28:05.000Z`).

- **Script** `scripts/write-version.mjs`: `revision` ← `GITHUB_SHA` → `git rev-parse HEAD`;
  `created` ← `SOURCE_DATE_EPOCH` (segundos Unix → ISO 8601 UTC) → `git log -1 --format=%ct`.
  `Date.now()` solo con `--now`. Falla ruidoso si no puede resolver una revisión real: no hay
  `revision: unknown`.
- **Determinismo (3.1)**: dos ejecuciones separadas por 1 s →
  `c35d1d415b9f…aafc` idéntico en ambas; `created` = fecha del commit, no la hora de ejecución.
  Los 16 tests de `scripts/write-version.test.mjs` cubren además el caso `GITHUB_SHA` +
  `SOURCE_DATE_EPOCH` → mismo objeto que la vía git.
- **`Date.now()` (3.2)**: con el reloj fijado en 2030 y `created` saliendo de la fecha del commit,
  el test comprueba que `resolveCreated()` ignora el reloj; solo `--now` lo usa (2 tests).
- **Endpoint** `GET /version` (`apps/server/src/app.ts` + `src/utils/version/build-version.ts`):
  200 con `{ revision, created }`; 404 `{ error: "version.json no encontrado…" }` si el build no
  generó el archivo (dev). Fuera de `/api/v1`, sin auth ni CSRF, igual que `/health`. Ruta literal
  `dist/version.json` (cwd = `apps/server`) para no disparar
  `security/detect-non-literal-fs-filename`. 5 unit tests del lector (válido, ENOENT, JSON roto,
  forma inválida, campos extra descartados) y prueba de wiring con supertest (200 y 404).
- **Imagen**: `ARG GITHUB_SHA` + `ARG SOURCE_DATE_EPOCH` en la etapa `build`; el script corre
  después de `tsc` y antes de `prune`, así que `dist/version.json` viaja al runtime.
  `build.yml`, `deploy.yml` (2 builds) y `preview.yml` pasan los dos build-args (`.git` está en
  `.dockerignore`, la imagen no puede resolver el commit sola).
- **Prueba real de imagen** (`docker build --target build`, args del commit de prueba):
  `version.json → /app/apps/server/dist/version.json (revision=4420021b…, created=2026-11-18T23:28:05.000Z)`
  y `readBuildVersion()` dentro del contenedor devuelve ese mismo objeto (EXIT 0).
- **`actionlint`** sobre `build.yml`, `deploy.yml`, `preview.yml` → EXIT 0.
- **`docker build --check`** → «Check complete, no warnings found»; **hadolint** sin hallazgos
  nuevos (los `DL3066`/`DL3025` ya existían en `HEAD`).
- **`tsc --noEmit -p apps/server`** → EXIT 0; `npm run build --workspace=server-express` → EXIT 0;
  ESLint `--max-warnings 0` sobre los archivos nuevos → EXIT 0; `npm run test:scripts` →
  24 archivos / 326 tests.

## Divergencias del artefacto

- **Sin build-args el build no falla.** `docker build` sin `GITHUB_SHA`/`SOURCE_DATE_EPOCH`
  (compose local, docs de aprendizaje) emite `WARN: sin metadatos de versión…`, sigue adelante y
  la app responde 404 en `/version`. Se prefirió eso a romper esos flujos o a hornear una
  revisión inventada; verificado: build sin args → EXIT 0 con el WARN.
- **Se eligió build-arg, no `ENV`.** El PRD admite cualquiera de los dos; con `ENV` la imagen no
  tendría `version.json` (el contexto excluye `dist/`), así que el endpoint nunca serviría nada.
- **Impacto mayor que el declarado**: el wiring de build-args tocó tres workflows que no estaban
  en la lista original (`build`, `deploy`, `preview`). Sin eso, o se rompía el build o las
  imágenes publicadas no llevaban metadatos.
