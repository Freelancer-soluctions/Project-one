# server-ts-phase1-leaves

Fase 1 de la migración TypeScript de `apps/server` (hijo de `openspec/changes/server-typescript-migration/`, task 2.1 del padre).

**Alcance:** 36 archivos hoja del grafo de dependencias — `config/` (5), `common/crypto/` (2), `logger/` (4), `utils/constants/enums.js` (1), `utils/joiSchemas/joi.js` (1), schemas de módulos (23: 22 `*.joi.js` + `events/schemas/event-rsvp.js`).

**Protocolo:** `git mv` + tipos en firma pública + imports `.js` intactos (nodenext) + sin `any` nuevo + un archivo = un commit + verificación de gates por lote (`type-check`, `lint`, `test:unit`, `depcruise:server`).

**Fuera de alcance:** middleware/, socket/, docs/, utils/responses&Errors, utils/csrftoken, utils/multer, utils/prisma, tests/, configs raíz (van en fases 2-3/configs del padre).
