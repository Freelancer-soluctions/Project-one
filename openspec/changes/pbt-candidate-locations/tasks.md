# Tasks: pbt-candidate-locations

## 0. Catálogo (artefacto)

- [ ] 0.1 Crear y mantener el catálogo en `docs/pbt-candidate-analysis.md` (ya creado) con todos los candidatos, invariantes y prioridad.
- [ ] 0.2 Verificar que cada entrada del catálogo corresponde a un símbolo exportado real del repo.

## 1. Alta prioridad — Utils (server + client)

- [ ] 1.1 (server) `getSafePagination` (pagination.ts): `1 ≤ take ≤ 100`, `skip ≥ 0`, entero, page=1 ⇒ skip=0.
- [ ] 1.2 (server) `sanitizePrismaMessage` (sanitizePrismaMessage.ts): idempotencia, unknown ⇒ DEFAULT_SAFE, código conocido ⇒ mensaje mapeado, includeOriginal agrega `[DEV]`.
- [ ] 1.3 (client) `pickDirty` (pickDirty.js): solo claves dirty, recursión, array ⇒ data[key], inválido ⇒ `{}`.
- [ ] 1.4 (client) `cn` (lib/utils.js): determinismo, twMerge idempotencia.
- [ ] 1.5 (client) `generateRandomBarcode` (barcode.js): longitud exacta, solo dígitos, padding.
- [ ] 1.6 (client) `currencyFormat` MXN (currencyFormat.js): 2 decimales (semi-puro, Intl).

## 2. Alta prioridad — Parsers

- [ ] 2.1 (server) `parseMentions` (mentionParser.ts): posiciones coherentes, sin solapamiento, `null/undefined/''` ⇒ `[]`.
- [ ] 2.2 (server) `extractMentionIds` (mentionParser.ts): IDs únicos, `null` ⇒ `[]`, dedup, orden estable (semi-puro, cheerio).
- [ ] 2.3 (client) `getUserFromToken` (jwt-decode.js): token inválido ⇒ error object (comportamiento actual).

## 3. Media prioridad — Schemas (Joi + Zod)

- [ ] 3.1 (server) Todos los `*.joi.ts` en `modules/*/schemas/` + `utils/joiSchemas/joi.ts`: valid ⇒ no error; inválido ⇒ error.
- [ ] 3.2 (client) Todos los `modules/*/utils/schema.js`: safeParse válido ⇒ success; inválido ⇒ failure.

## 4. Media prioridad — Services / State machines

- [ ] 4.1 (server) `canTransition` / `getAllowedNextStates` (events stateMachine.ts): solo transiciones en `validTransitions`, unknown ⇒ false/[].
- [ ] 4.2 (server) `timeStrToDate`, `formatTime`, `validateEventModality` (events service.ts): round-trip `formatTime(timeStrToDate(x)) === x`.
- [ ] 4.3 (server) Settings patch-display: merge/patch properties.

## 5. Baja prioridad — Store / Reducers

- [ ] 5.1 (client) `authSlice` reducer `updateAuthData`, `logout`: `logout` ⇒ `user=null`, `isAuth=false`, `isError=false`, `errorMessage=''`.
- [ ] 5.2 (client) `settingsSlice`: setters de carga/error.

## 6. Cierre

- [ ] 6.1 `npm run test:pbt` verde tras implementar.
- [ ] 6.2 `openspec validate pbt-candidate-locations --strict` exit 0.
- [ ] 6.3 Archivar el change cuando todas las propiedades estén implementadas (solo cuando se pida).
