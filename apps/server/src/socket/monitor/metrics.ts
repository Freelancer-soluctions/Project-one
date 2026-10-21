import client from 'prom-client';

// ============================================================
// metrics.js — Métricas Prometheus para WebSocket
// ============================================================
// Usamos prom-client para exponer métricas en formato Prometheus.
// Grafana puede consumir estas métricas desde el endpoint /metrics.
// ============================================================

// Colectar métricas por defecto del runtime (CPU, memoria, GC, etc.)
client.collectDefaultMetrics();

// --- Métricas personalizadas ---

// Gauge: usuarios actualmente conectados vía WebSocket
export const wsConnectedUsers = new client.Gauge({
  name: 'ws_connected_users',
  help: 'Número de usuarios conectados actualmente vía WebSocket',
});

// Counter: total de eventos procesados
export const wsEventsTotal = new client.Counter({
  name: 'ws_events_total',
  help: 'Total de eventos WebSocket procesados',
  labelNames: ['event_type'], // label para filtrar por tipo de evento
});

// Histogram: duración de procesamiento de eventos en ms
export const wsEventDuration = new client.Histogram({
  name: 'ws_event_duration_ms',
  help: 'Duración de procesamiento de eventos WebSocket en milisegundos',
  labelNames: ['event_type'],
  buckets: [1, 5, 10, 50, 100, 500], // buckets en ms
});

// Counter: errores WebSocket por tipo
export const wsErrorsTotal = new client.Counter({
  name: 'ws_errors_total',
  help: 'Total de errores WebSocket',
  labelNames: ['error_type'], // validation, auth, rate_limit, server
});

// Counter: reconexiones de clientes
export const wsReconnectionsTotal = new client.Counter({
  name: 'ws_reconnections_total',
  help: 'Total de reconexiones de clientes WebSocket',
});

// Registrar todas las métricas en el registry por defecto
export const register = client.register;
