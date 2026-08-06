import { EventEmitter } from 'events';

// ============================================================
// notificationBus.js — Bus de eventos para desacoplar servicios
// ============================================================
// PROPÓSITO: El bus de eventos (EventEmitter) separa la capa de
// servicios (controllers, DAOs, etc.) de Socket.IO. En lugar de
// importar `io` directamente en un servicio (creando acoplamiento
// y posibles circular dependencies), el servicio emite eventos
// en el bus y un handler dedicado los reenvía a Socket.IO.
//
// BENEFICIOS:
//   - Pruebas: podemos mockear el bus sin tocar Socket.IO
//   - Desacoplamiento: servicios no saben que Socket.IO existe
//   - Escalabilidad: múltiples consumidores pueden escuchar
// ============================================================

// Singleton: un solo bus para toda la aplicación
// El límite por defecto de EventEmitter es 10 listeners.
// Aumentamos a 50 para soportar múltiples handlers sin warnings.
const bus = new EventEmitter();
bus.setMaxListeners(50);

// Constantes de eventos — un solo lugar para mantener sincronizados
// los nombres entre emisores (servicios) y receptores (socket handlers)
export const BUS_EVENTS = {
  // Emitido cuando se crea una mención en una nota
  // Payload: { noteId, noteTitle, mentionedByUserId, mentionedUserId, excerpt }
  MENTION_CREATED: 'mention:created',

  // Emitido cuando se marcan menciones como leídas
  // Payload: { mentionIds, userId }
  MENTION_READ: 'mention:read',
};

/**
 * Obtiene la instancia singleton del bus de eventos.
 * @returns {EventEmitter}
 */
export const getBus = () => bus;

// Export default para conveniencia (import simplificado en servicios)
export default bus;
