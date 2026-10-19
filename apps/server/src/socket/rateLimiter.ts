// ============================================================
// rateLimiter.js — Token Bucket rate limiter para Socket.IO
// ============================================================
// Algoritmo Token Bucket: cada usuario tiene un bucket con N tokens.
// Cada mensaje consume 1 token. Los tokens se regeneran a tasa fija.
// Si el bucket está vacío, se rechaza el mensaje.
// ============================================================

import type { AuthenticatedSocket } from './auth.js';
/**
 * Token Bucket para rate limiting en memoria.
 * Por ahora no requiere Redis (single-instancia). Redis se añade
 * en nivel 10 (scaling) para rate limiting compartido entre nodos.
 */
class TokenBucket {
  capacity: number;
  tokens: number;
  refillRate: number;
  refillInterval: number;
  intervalId: NodeJS.Timeout;

  /**
   * @param config - Configuración del bucket
   * @param config.capacity - Máximo de tokens acumulables
   * @param config.refillRate - Tokens por segundo que se regeneran
   * @param config.refillInterval - Intervalo de recarga en ms
   */
  constructor({
    capacity,
    refillRate,
    refillInterval = 1000,
  }: {
    capacity: number;
    refillRate: number;
    refillInterval?: number;
  }) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.refillInterval = refillInterval;

    // Intervalo que recarga tokens periódicamente
    this.intervalId = setInterval(() => {
      this.tokens = Math.min(this.capacity, this.tokens + this.refillRate);
    }, this.refillInterval);

    // Permitir que el intervalo no bloquee el proceso
    this.intervalId.unref();
  }

  /**
   * Intenta consumir N tokens del bucket.
   * @param count - Número de tokens a consumir
   * @returns true si hay suficientes tokens
   */
  consume(count = 1) {
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }

  /** Detiene el intervalo de recarga. Llama en cleanup. */
  stop() {
    clearInterval(this.intervalId);
  }
}

/**
 * Crea middleware de rate limiting para Socket.IO.
 * Aplica límites por conexión, por evento y por broadcast.
 * @param {Object} options
 * @param {number} [options.connectionRate=100] - Conexiones/minuto por IP
 * @param {number} [options.eventRate=30] - Eventos/segundo por usuario
 * @param {number} [options.broadcastRate=10] - Broadcasts/segundo por usuario
 * @returns {Function} middleware (socket, next) => void
 */
export const createSocketRateLimiter = (
  options: {
    connectionRate?: number;
    eventRate?: number;
    broadcastRate?: number;
  } = {}
) => {
  const { connectionRate = 100, eventRate = 30 } = options;

  // Buckets por IP para rate limiting de conexiones
  const connectionBuckets = new Map<string, TokenBucket>();

  // Buckets por usuario para rate limiting de eventos
  // (clave: `user.id` numérico o, en su defecto, `socket.id` string)
  const eventBuckets = new Map<string | number, TokenBucket>();

  // Cleanup periódico de buckets inactivos (cada 5 minutos)
  setInterval(
    () => {
      connectionBuckets.clear();
      eventBuckets.clear();
    },
    5 * 60 * 1000
  );

  /**
   * Middleware de conexión — limitar conexiones por IP
   * @param {import('socket.io').Socket} socket - Socket entrante
   * @param {Function} next - Callback para continuar la cadena de middleware
   * @returns {void}
   */
  const connectionMiddleware = (
    socket: AuthenticatedSocket,
    next: (err?: Error) => void
  ) => {
    const clientIp = socket.handshake.address;
    if (!connectionBuckets.has(clientIp)) {
      // 100 conexiones por minuto ≈ ~1.67 tokens/segundo, capacity 100
      connectionBuckets.set(
        clientIp,
        new TokenBucket({
          capacity: connectionRate,
          refillRate: Math.max(1, Math.floor(connectionRate / 60)),
        })
      );
    }
    const bucket = connectionBuckets.get(clientIp);
    if (!bucket.consume()) {
      return next(
        new Error('RATE_LIMITED: Demasiadas conexiones desde esta IP')
      );
    }
    next();
  };

  // Retornamos ambos middlewares para flexibilidad
  return {
    connection: connectionMiddleware,
    /**
     * Middleware por evento — limitar eventos/segundo por usuario
     * Se ejecuta en cada evento entrante ANTES del handler.
     * @param {import('socket.io').Socket} socket - Socket activo
     */
    event: (socket: AuthenticatedSocket) => {
      socket.use(([event], next) => {
        if (
          event === 'connect' ||
          event === 'disconnect' ||
          event.startsWith('/')
        ) {
          return next();
        }
        const userId = socket.data.user?.id || socket.id;
        if (!eventBuckets.has(userId)) {
          eventBuckets.set(
            userId,
            new TokenBucket({
              capacity: eventRate,
              refillRate: eventRate,
            })
          );
        }
        const bucket = eventBuckets.get(userId);
        if (!bucket.consume()) {
          socket.emit('error:rate_limit', {
            message: 'Demasiados eventos. Intenta de nuevo en un momento.',
          });
          return;
        }
        next();
      });
    },
    /**
     * cleanup: eliminar buckets al desconectar para evitar memory leak
     * Socket.IO emite 'disconnect' cuando un socket se cierra.
     * Sin cleanup, cada IP/usuario deja buckets en memoria permanentemente.
     * @param {import('socket.io').Socket} socket - Socket que se desconecta
     */
    cleanup: (socket: AuthenticatedSocket) => {
      const clientIp = socket.handshake.address;
      connectionBuckets.delete(clientIp);
      const userId = socket.data.user?.id || socket.id;
      eventBuckets.delete(userId);
    },
  };
};
