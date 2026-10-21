// ============================================================
// adapter.js — Redis Adapter para Socket.IO (multi-instancia)
// ============================================================
// Por defecto, Socket.IO usa un adapter en memoria: los eventos
// solo llegan a sockets en la MISMA instancia del servidor.
//
// Con Redis adapter, cuando una instancia emite io.to('room').emit(),
// Redis publica el evento y TODAS las instancias lo reciben y
// reenvían a sus sockets locales. Así funciona el multi-instancia.
//
// REQUISITO: npm install @socket.io/redis-adapter ioredis
// USO: REDIS_URL=redis://localhost:6379 node src/bin/index.js
// ============================================================

/**
 * Crea el adapter apropiado para Socket.IO según configuración.
 *
 * Si REDIS_URL está definida, usa @socket.io/redis-adapter con ioredis
 * para habilitar comunicación entre múltiples instancias del servidor.
 *
 * Si no hay REDIS_URL, usa el adapter en memoria por defecto de Socket.IO
 * (funciona para una sola instancia o desarrollo local).
 *
 * @param {import('socket.io').Server} server - Instancia del servidor Socket.IO
 * @returns {Promise<void>}
 */
import type { Server } from 'socket.io';

export const createAdapter = async (server: Server): Promise<void> => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    // Sin Redis → adapter en memoria (default de Socket.IO)
    // Funciona para desarrollo local o single-instancia
    console.log('🔌 Socket.IO usando adapter en memoria (single-instancia)');
    console.log('   Para multi-instancia, definir REDIS_URL en entorno');
    return;
  }

  try {
    // Import dinámico: solo se cargan las dependencias de Redis
    // cuando realmente se necesita (ahorra memoria en single-instancia)
    //
    // HALLAZGO Fase 3 (pre-existente, comportamiento PRESERVADO): `ioredis` NO
    // exporta `createClient` (su API es `new Redis(url)`), así que en runtime
    // `createClient` es `undefined`, la llamada lanza TypeError y el catch deja
    // el adapter en memoria. La conversión a `.ts` solo tipa el acceso sin
    // cambiar ese comportamiento; registro en las tasks del change.
    const { createClient } = (await import('ioredis')) as unknown as {
      createClient: (url: string) => {
        on: (event: string, listener: (err: Error) => void) => void;
      };
    };
    const { createAdapter } = await import('@socket.io/redis-adapter');

    // Crear dos clientes Redis (pub/sub):
    // pubClient: publica eventos hacia otras instancias
    // subClient: recibe eventos de otras instancias
    const pubClient = createClient(redisUrl);
    const subClient = createClient(redisUrl);

    // Configurar el adapter en el servidor Socket.IO
    server.adapter(createAdapter(pubClient, subClient));

    console.log(`🔌 Socket.IO usando Redis adapter: ${redisUrl}`);

    // Manejar errores de conexión Redis
    pubClient.on('error', (err) => {
      console.error('❌ Redis pubClient error:', err.message);
    });
    subClient.on('error', (err) => {
      console.error('❌ Redis subClient error:', err.message);
    });
  } catch (err) {
    console.error(
      '❌ Error al configurar Redis adapter:',
      err instanceof Error ? err.message : String(err)
    );
    console.log('   Continuando con adapter en memoria');
    console.log('   Solución: npm install @socket.io/redis-adapter ioredis');
  }
};
