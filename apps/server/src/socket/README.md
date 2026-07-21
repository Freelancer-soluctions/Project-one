# Arquitectura de Socket.IO y EventBus

## Diagrama de Flujo ASCII

```
Controller HTTP → Service Layer → notificationBus → Socket.IO → Cliente
       │                │                │                │
    createNote()    mentionParser()   EventEmitter    io.to(room)
    POST /notes     detecta @user     bus.emit()      socket.emit()
```

## ¿Por qué desacoplar service y socket layers?

1. **Evitar dependencias circulares**: Si el servicio conoce Socket.IO directamente, creamos acoplamiento fuerte que dificulta cambios futuros.
2. **Testabilidad**: Podemos probar servicios sin necesidad de un servidor Socket.IO corriendo.
3. **Extensibilidad**: Podemos añadir otros mecanismos de notificación (email, push, etc.) sin tocar la lógica de negocio.
4. **Separación de responsabilidades**: El servicio se enfoca en lógica de dominio, mientras que la capa de sockets maneja la distribución en tiempo real.

## Estrategia de Testing

### Mock del notificationBus (3 líneas aproximadamente)
```javascript
const mockBus = {
  emit: jest.fn(),
  on: jest.fn()
};

// En el test del servicio
service.createNote(data);
expect(mockBus.emit).toHaveBeenCalledWith('MENTION_CREATED', expectedData);
```

### Mock de Socket.IO (~30 líneas)
```javascript
const mockIo = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
  sockets: {
    adapter: {
      rooms: new Map(),
      sids: new Set()
    }
  }
};

// Configuración compleja para simular rooms, conexiones, etc.
// Mucho más verboso y frágil que mockear un simple EventEmitter
```

## Referencia de Nombres de Eventos

| Evento | Descripción | Dirección |
|--------|-------------|-----------|
| MENTION_CREATED | Se creó una nueva mención @usuario | Servicio → Socket.IO → Cliente |
| MENTION_READ | Usuario marcó una mención como leída | Cliente → Socket.IO → Servicio |

**Nota**: Los eventos siguen la convención de mayúsculas con guiones bajos para facilitar su identificación en logs y debugging.