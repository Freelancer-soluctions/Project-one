import cors from 'cors';
import express from 'express';
import corsOptions from './config/cors.js';
import routes from './routes/v1/index.js';
import cookieParser from 'cookie-parser';
import { limiter, errorHandler } from './middleware/index.js';
import { csrfConditional } from './middleware/verifyCsrf.js';
import { helmetConfig } from './utils/helmet/helmet.config.js';
import { register } from './socket/monitor/metrics.js';

const app = express();

app.use(helmetConfig);

// middleware
app.use(
  express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 })
);

// Body parser para que el navegador pueda enviar reportes CSP
app.use(
  express.json({
    limit: '50mb',
    type: ['application/json', 'application/csp-report'],
  })
);

app.use(cookieParser());

app.use(cors(corsOptions));

// Health check endpoint (para validación de preview/CI)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Endpoint para que Prometheus recolecte métricas del servidor WebSocket
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch {
    res.status(500).json({ error: 'Error al generar métricas' });
  }
});

app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/v1/auth')) return next();
  limiter(req, res, next);
});

// Aplicar CSRF condicionalmente a todas las rutas
// Routes
app.use('/api/v1', csrfConditional, routes);

// Error handler
app.use(errorHandler);

export default app;
