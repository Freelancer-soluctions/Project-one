// ============================================================
// level-11-scale.js — Arquitectura Multi-Instancia con Redis Adapter
// ============================================================
// Este archivo educativo explica cómo escalar Socket.IO más allá de una
// sola instancia usando el patrón de arquitectura multi-instancia.
//
// PROBLEMA:
//   Socket.IO por defecto usa un adapter en memoria. Esto significa que:
//   - Los eventos solo se entregan a sockets en la MISMA instancia del servidor
//   - Si tienes 2 instancias ejecutándose, un evento emitido en instancia A
//     NO llega a sockets conectados en instancia B
//
// SOLUCIÓN:
//   Redis Adapter permite que múltiples instancias de Socket.IO se comuniquen
//   mediante Pub/Sub de Redis:
//
//   [Instancia A] --emit--> [Redis Pub] --sub--> [Instancia B]
//                                    ↑
//                                    └--emit--> [Sockets locales en B]
//
//   Cuando instancia A emite io.to('roomX').emit('event', data):
//   1. Redis Adapter publica el evento en canal 'socket.io#event#roomX'
//   2. Instancia B (suscrita al mismo canal) recibe el evento
//   3. Instancia B reenvía el evento a SUS sockets locales en roomX
//   4. Resultado: todos los sockets en roomX reciben el evento, sin importar
//      en qué instancia están conectados
//
// REQUISITOS:
//   npm install @socket.io/redis-adapter ioredis
//   REDIS_URL=redis://localhost:6379 node src/bin/index.js
//
// ESCALABILIDAD:
//   - Vertical: PM2 cluster (múltiples procesos en mismo servidor)
//   - Horizontal: Redis adapter + múltiples servidores detrás de load balancer
//   - Sticky sessions: NO requeridas con Redis adapter (estado compartido en Redis)
// ============================================================

/**
 * ESCALADO VERTICAL (misma máquina, más núcleos)
 * ----------------------------------------------
 * Usar PM2 en cluster mode:
 *   pm2 start ecosystem.config.js --instances max
 *
 * Cada instancia:
 * - Comparte el mismo puerto 3000 (gracias al clustering de PM2)
 * - Tiene su propio espacio de memoria (eventos, sockets, etc.)
 * - Sin Redis adapter: eventos aislados por instancia
 * - Con Redis adapter: eventos propagados entre todas las instancias
 */

/**
 * ESCALADO HORIZONTAL (múltiples máquinas)
 * ----------------------------------------
 * Arquitectura con load balancer:
 *
 *   [Clientes] <---> [Load Balancer] <---> [Instancia A]
 *                                        <---> [Instancia B]
 *                                        <---> [Instancia C]
 *                                                  |
 *                                         [Redis Server] <-- Pub/Sub
 *
 * Sin sticky sessions requeridas porque:
 * - La autenticación (JWT) es stateless
 * - El estado de salas se mantiene en Redis adapter
 * - Cada instancia puede manejar cualquier cliente
 *
 * Requisitos:
 *   - Redis accesible por todas las instancias
 *   - Puerto 3000 expuesto en cada instancia
 *   - Load balancer configurado para TCP (WebSocket requiere conexión persistente)
 */

/**
 * TOMA DE DECISIONES: ¿CUÁNDO ESCALAR?
 * ------------------------------------
 *
 * 1. ¿Un solo servidor alcanza la carga esperada?
 *    → Sí: Usar single instance (desarrollo o <100 CCU)
 *    → No: Continuar al paso 2
 *
 * 2. ¿La limitación es CPU en un solo servidor?
 *    → Sí: PM2 cluster mode (usar todos los núcleos)
 *    → No: Continuar al paso 3
 *
 * 3. ¿Necesitas distribuir carga entre múltiples servidores?
 *    → Sí: Redis adapter + múltiples instancias detrás de LB
 *    → No: Revisar si hay otros cuellos de botella (DB, red, etc.)
 *
 * 4. ¿Necesitas orquestación avanzada y auto-scaling?
 *    → Sí: Kubernetes o similar
 *    → No: Mantener arquitectura actual con Redis adapter
 *
 * CCU = Concurrent Connected Users (usuarios simultáneos conectados)
 */

/**
 * COMPARACIÓN DE ADAPTERS
 * -----------------------
 *
 * Adapter en memoria (default):
 *   - Pros: Simple, cero dependencias, baja latencia
 *   - Cons: Escalado vertical limitado (una instancia por proceso)
 *   - Caso de uso: Desarrollo, staging, <100 CCU
 *
 * Redis adapter:
 *   - Pros: Escalado ilimitado, estado compartido, tolerancia a fallos
 *   - Cons: Añade latencia de red (Redis), complejidad operacional
 *   - Caso de producción: >100 CCU, alta disponibilidad requerida
 *
 * Otros adapters disponibles:
 *   - MongoDB adapter: bueno si ya usas MongoDB
 *   - Postgres adapter: bueno si ya usas Postgres
 *   - Custom adapter: para integraciones específicas
 */

/**
 * CONSIDERACIONES DE IMPLEMENTACIÓN
 * ---------------------------------
 *
 * 1. Manejo de conexiones:
 *    - Socket.IO mantiene conexión persistente por cliente
 *    - Cada conexión consume memoria (~10KB base + overhead)
 *    - Calcular: max_connections = available_memory / memory_per_connection
 *
 * 2. Heartbeats y timeouts:
 *    - Socket.IO envía ping cada 25s por defecto
 *    - Ajustar según requisitos de red y firewalls
 *    - En ecosystem.config.js: listen_timeout y kill_timeout importantes
 *
 * 3. Persistencia de estado:
 *    - Con Redis adapter: rooms y sockets state se sincronizan automáticamente
 *    - Sin adapter: cada instancia mantiene su propio estado (no escalable)
 *    - Estado de aplicación (ej. conteo de usuarios): usar Redis directamente
 *
 * 4. Monitoreo:
 *    - Métricas por instancia: conexiones activas, eventos por segundo
 *    - Métricas globales: usar Redis para contadores agregados
 *    - Alertas: lag de Redis, uso de memoria, tasa de reconexiones
 *
 * 5. Despliegue y actualizaciones:
 *    - Con PM2: zero-downtime reload usando 'pm2 reload ecosystem.config.js'
 *    - Con LB: despliegue blue-green o rolling update
 *    - Compatibilidad hacia atrás: mantener mismos eventos y formatos
 */

/**
 * EJEMPLO DE CONFIGURACIÓN DE REDIS
 * ---------------------------------
 *
 * En producción, usar Redis con:
 *   - Persistencia AOF (Append Only File) para durabilidad
 *   - Réplicas para alta disponibilidad
 *   - Sharding si el volumen de Pub/Sub es muy alto
 *   - Monitoreo: latency, hit rate, evictions, memory usage
 *
 * URL de conexión típicas:
 *   Desarrollo:   REDIS_URL=redis://localhost:6379
 *   Docker:       REDIS_URL=redis://redis:6379
 *   Producción:   REDIS_URL=rediss://:password@redis-cluster.example.com:6380
 *
 * Nota: Si usas SSL/TLS (rediss://), asegurar que Node.js confía en el certificado
 */

/**
 * LIMITACIONES Y CONSIDERACIONES
 * ------------------------------
 *
 * 1. Latencia adicional:
 *    - Cada evento cruzará la red hacia Redis y de vuelta
 *    - Latency típica: 1-5ms en mismo datacenter, 20-50ms entre regiones
 *    - Para aplicaciones de baja latencia (<10ms requerida): considerar
 *      optimizaciones o arquitecturas alternativas
 *
 * 2. Costo de Redis:
 *    - Una instancia Redis básica puede manejar decenas de miles de eventos/segundo
 *    - Monitorear usage y escalar verticalmente o con clustering si es necesario
 *
 * 3. Complejidad operacional:
 *    - Ahora hay que mantener: servidores Node.js + Redis + Load Balancer
 *    - Incluir health checks para todos los componentes
 *    - Plan de backup y recuperación para Redis
 *
 * 4. Seguridad:
 *    - Proteger acceso a Redis (firewall, auth, TLS)
 *    - Limitar quién puede publicar en canales de Socket.IO
 *    - Considerar encriptar datos sensibles si pasan por Redis
 *
 * CONCLUSIÓN:
 *   El Redis adapter es la solución estándar para escalar Socket.IO más allá
 *   de una sola instancia. Es maduro, bien mantenido y usado en producción
 *   por muchas aplicaciones de alto tráfico.
 */

// Exportar vacío para evitar warnings de módulo no utilizado
// Este archivo es puramente educativo, no se importa en ningún lado
export {};