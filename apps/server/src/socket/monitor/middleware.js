import { wsConnectedUsers, wsEventsTotal, wsEventDuration, wsErrorsTotal, wsReconnectionsTotal } from './metrics.js'

/**
 * Middleware de métricas para Socket.IO.
 * Actualiza gauges, counters y histograms en eventos clave.
 * @param {import('socket.io').Server} io
 */
export const setupMetricsMiddleware = (io) => {
  // Actualizar gauge de conexiones activas
  io.engine.on('connection', () => {
    wsConnectedUsers.inc()
  })

  io.engine.on('disconnect', () => {
    wsConnectedUsers.dec()
  })
  
  // Track reconnections at engine level
  io.engine.on('connection', (socket) => {
    if (socket.recovered) {
      wsReconnectionsTotal.inc()
    }
  })
}

/**
 * Middleware por socket para recolectar métricas por evento.
 * @param {import('socket.io').Socket} socket
 */
export const setupSocketMetrics = (socket) => {
   socket.use(async ([event], next) => {
    if (event === 'connect' || event === 'disconnect') {
      return next()
    }

    const endTimer = wsEventDuration.startTimer({ event_type: event })

     try {
       next()
       wsEventsTotal.inc({ event_type: event })
     } catch {
       wsErrorsTotal.inc({ error_type: 'server' })
     } finally {
       endTimer()
     }
  })
}