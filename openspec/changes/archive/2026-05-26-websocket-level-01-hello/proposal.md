## Why

El usuario no conoce WebSockets y necesita aprender desde cero hasta producción. Este es el primer nivel de 10 cambios incrementales para construir infraestructura de tiempo real que eventualmente soportará notificaciones de menciones (y futuros tipos de eventos en tiempo real). Se necesita una base educativa sólida antes de implementar funcionalidad real.

## What Changes

- Crear módulo `apps/server/src/socket/` con estructura de niveles educativos progresivos
- Level 1: Archivo de conceptos teóricos (solo comentarios, no ejecutable) explicando WebSocket, HTTP vs WS, Socket.IO, Engine.IO, ciclo de vida, patrones de emit
- Level 2: Server Socket.IO mínimo funcional en puerto 3001 con configuración CORS, logging de conexión/desconexión, y graceful shutdown
- README explicativo de cómo usar los niveles, orden de aprendizaje y cómo probar
- Nueva capacidad: `websocket-infrastructure` — infraestructura base para comunicación en tiempo real

## Capabilities

### New Capabilities
- `websocket-infrastructure`: Infraestructura base para comunicación en tiempo real usando Socket.IO, con servidor dedicado en puerto 3001, configuración CORS, logging de eventos de conexión/desconexión, y graceful shutdown

### Modified Capabilities
<!-- No se modifican capacidades existentes. Este cambio es completamente nuevo y no afecta specs actuales. -->

## Impact

- **Nuevo puerto**: 3001 para WebSocket (no afecta Express en puerto 3000)
- **Nueva dependencia**: `socket.io` en `apps/server/package.json`
- **Nuevo directorio**: `apps/server/src/socket/` con estructura de niveles
- **Sin cambios en código existente**: El servidor Express en puerto 3000 no se modifica
- **Nuevo archivo README**: `apps/server/src/socket/levels/README.md` con guía de aprendizaje
