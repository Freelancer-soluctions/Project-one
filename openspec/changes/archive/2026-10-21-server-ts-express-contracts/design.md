# Design

> Hereda protocolo del padre (lotes + gates, sin `any`, un archivo = un commit). Decisiones propias del boundary Express.

## Decisión 1 — `declare global` completo, una sola fuente

La augmentación vive en `middleware/verifyToken.ts` (donde el token se verifica) y `app.ts` se queda sin su propio bloque (o lo consolida importando el middleware). Contrato:

```ts
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number; // id del usuario verificado (JWT sub)
      userRole?: string; // código de rol (C01/C02/...)
      user?: JwtPayload; // payload completo (F3, ya existente)
    }
  }
}
```

Evidencia-based: los 95 accesos previos (`req.user` en 23 ficheros) + los `req.userId`/`req.userRole` que el mock de integration tests ya poblaba (`req.userId = 1; req.userRole = 'ADMIN'; req.user = { id: 1, role: 'ADMIN' }`) — el tipo global ESPEJA lo que `verifyToken` realmente popula. Si al tipar handlers aparece un acceso a una prop no declarada, el tipo global se amplía a la evidencia (nunca un cast en el handler).

## Decisión 2 — Wrapper: `(fn: RequestHandler): RequestHandler` + catch unknown

```ts
const handleCatchErrorAsync =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch((err: unknown) => next(err));
  };
```

Efecto: contextual typing tipa los 125 call-sites `handleCatchErrorAsync(async (req, res) => ...)` SIN tocar los archivos (req: Request, res: Response por inferencia). El `catch (err: unknown)` + `next(err)` alinea con `useUnknownInCatchVariables` (Fase 4-6.5) — NextFunction acepta `unknown` en sus overloads de error. Restricción heredada del JSDoc original resuelta: las props globales YA estarán declaradas (Decisión 1) — por eso el orden es globals ANTES que wrapper.

## Decisión 3 — Fallout: contextual, no manual

Con wrapper + globals, el fallout esperable es acotado: (a) handlers que destructuran `req.query` (ParsedQs) y pasan valores a services — los services aún implicit-any los aceptan (no error); (b) handlers que accedan props inexistentes → se corrigen amplificando el global o corrigiendo el typo real; (c) `res.status().json()` — cubierto por express types. El fallout se resuelve **módulo a módulo** (mismo orden de riesgo que F2/F1: settings → attendance → news → users → auth → events → resto) con los 4 gates por lote. Si un módulo colisiona con la sesión paralela de `domain-interfaces`, se salta y se procesa al final (coordinación por lote).

## Decisión 4 — Métrica de readiness (gate de cierre del change)

Al cierre: `npx tsc --noEmit --noImplicitAny -p apps/server` — baseline 406 TS7006 → objetivo **≤ 60** (residuales esperados: tests/ ~74 se reduce con los fixes de modules, socket/utils quedan para Fase 4). La métrica exacta se registra en tasks y es la evidencia de que la task 6.3 del padre puede activarse sin big-bang.

## Decisión 5 — No-duplicación con `server-ts-domain-interfaces`

Este change NO introduce los Inputs de dominio (eso es `domain-interfaces`); solo tipa el BOUNDARY (req/res/next). Si un handler ya recibe Inputs del módulo (settings, etc.), el cast de `req.body` permanece en el handler — ambas capas son compatibles. Los commits de este change evitan los archivos en vuelo por la sesión paralela (coordinación declarada en el proposal).
