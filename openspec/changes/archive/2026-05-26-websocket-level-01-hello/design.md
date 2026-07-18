## Context

Se necesita establecer una infraestructura base para comunicación en tiempo real (WebSocket) que sirva como plataforma de aprendizaje progresivo. El proyecto actual tiene un backend Express en puerto 3000 y frontend React/Vite en puerto 5173. Este es el primer nivel de 10 cambios incrementales donde se sientan las bases educativas y técnicas.

El usuario no tiene experiencia con WebSockets, por lo que el diseño prioriza la claridad pedagógica: código comentado línea por línea en español, niveles progresivos, y documentación explícita.

## Goals / Non-Goals

**Goals:**
- Establecer un servidor Socket.IO independiente en puerto 3001
- Crear estructura de niveles educativos (`apps/server/src/socket/levels/`)
- Level 1: Archivo teórico de solo comentarios explicando conceptos fundamentales
- Level 2: Servidor funcional mínimo con logging de eventos y graceful shutdown
- Documentación (README) con guía de uso y aprendizaje
- Separación total del servidor Express existente (puerto 3000)

**Non-Goals:**
- No se implementa lógica de negocio (autenticación, rooms, eventos de dominio)
- No se modifica el servidor Express existente
- No se integra con la base de datos
- No se implementan notificaciones de menciones (será en niveles futuros)
- No se añaden tests automatizados (el foco es educativo)

## Decisions

### 1. Socket.IO sobre WebSocket nativo
**Decisión**: Usar Socket.IO v4 en lugar de WebSocket nativo (ws) o Raw WebSocket API.

**Por qué**: Socket.IO abstrae la capa de transporte (usa WebSocket cuando está disponible, con fallback automático a HTTP long-polling). Provee características cruciales para producción: room management, middleware de autenticación, reconnection automática, acknowledgments, y broadcasting estructurado. Además, la curva de aprendizaje se beneficia de tener eventos nombrados en lugar de mensajes raw.

**Alternativas consideradas**: ws (biblioteca minimalista) — rechazada porque requeriría implementar manualmente reconnection, rooms, y fallback; Raw WebSocket API — rechazada por falta de features para producción.

### 2. Servidor HTTP dedicado en puerto 3001
**Decisión**: Crear un `http.createServer()` independiente para Socket.IO en puerto 3001.

**Por qué**: Separar el servidor WebSocket del Express existente evita acoplamiento, permite escalado independiente, y simplifica el modelo mental para el aprendizaje. El servidor Express en 3000 no necesita modificaciones.

**Alternativas consideradas**: Montar Socket.IO sobre el servidor Express existente — rechazada porque mezcla responsabilidades y complica el aprendizaje al tener que entender la integración antes de entender WebSocket.
**Riesgo — Integración futura con Express**: Este diseño deliberadamente separa Socket.IO con `http.createServer()` para aprendizaje progresivo. Niveles superiores migrarán Socket.IO a montarse sobre el servidor Express existente. El archivo `level-02-server.js` quedará como referencia educativa.

### 3. Estructura de niveles educativos
**Decisión**: Organizar el código en `apps/server/src/socket/levels/level-XX-*.js` con niveles numerados e incrementales.

**Por qué**: El formato nivelado permite progresión natural. Cada nivel se puede ejecutar de forma independiente. El código está comentado línea por línea en español para máxima claridad pedagógica.

### 4. CORS: mismo origen que Express
**Decisión**: Configurar CORS en Socket.IO permitiendo `http://localhost:5173` (origen del frontend Vite).

**Por qué**: La política CORS aplica también a WebSocket durante el handshake. Usar el mismo origen que Express mantiene consistencia y evita errores de conexión.

### 5. Graceful Shutdown
**Decisión**: Escuchar señales SIGINT/SIGTERM para cerrar el servidor Socket.IO limpiamente.

**Por qué**: Previene pérdida de conexiones, cierra sockets correctamente, y es una práctica de producción desde el nivel 1 para inculcar buenos hábitos.

## Risks / Trade-offs

- **[Riesgo educativo]**: Los comentarios extensos en español pueden quedar obsoletos si el código cambia. → **Mitigación**: Los archivos de nivel son educativos y autocontenidos; se actualizan con cada nivel.
- **[Puerto adicional]**: Usar puerto 3001 requiere documentar y recordar que hay dos servidores. → **Mitigación**: README explica claramente la arquitectura de dos puertos.
- **[Dependencia externa]**: Socket.IO agrega ~50KB al bundle del servidor. → **Mitigación**: Es una dependencia estándar de industria para WebSocket; el costo es aceptable y bien conocido.
- **[Seguridad]**: Socket.IO expone puerto adicional que debe ser asegurado. → **Mitigación**: En niveles futuros se agregará autenticación y rate limiting; por ahora solo CORS básico.
