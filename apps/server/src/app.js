import cors from 'cors';
import express from 'express';
import corsOptions from './config/cors.js';
import routes from './routes/v1/index.js';
import cookieParser from 'cookie-parser';
import { limiter, errorHandler } from './middleware/index.js';
import { csrfConditional } from './middleware/verifyCsrf.js';
import { helmetConfig } from './utils/helmet/helmet.config.js';
import { register } from './socket/monitor/metrics.js';
import { secretsClient } from './config/aws/secret-manager.client.js';
import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { prisma } from './config/db.js';

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
// Checks DB connectivity via Prisma; returns 200 if healthy, 503 if degraded
app.get('/health', async (req, res) => {
  const timeoutMs = 500; // Keep health check fast (<500ms)
  let dbStatus = 'ok';

  try {
    // Race between Prisma query and timeout
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('DB connectivity timeout')),
          timeoutMs
        )
      ),
    ]);
  } catch (error) {
    console.warn('Health check: DB connectivity failed', error.message);
    dbStatus = 'degraded';
  }

  const statusCode = dbStatus === 'ok' ? 200 : 503;
  res.status(statusCode).json({
    status: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Test-only smoke route: exercises the app's secretsClient path (AWS Secrets Manager)
// Only available when NODE_ENV=test or ENABLE_SMOKE_ROUTE=true (for preview CI)
if (
  process.env.NODE_ENV === 'test' ||
  process.env.ENABLE_SMOKE_ROUTE === 'true'
) {
  app.get('/_smoke/secrets', async (req, res) => {
    try {
      const secretName = req.query.name || 'preview-smoke-test';
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await secretsClient.send(command);
      res.status(200).json({
        success: true,
        secretName,
        value: response.SecretString,
      });
    } catch (error) {
      console.error('Smoke secrets route error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  console.log('🔧 Test-only /_smoke/secrets route enabled');
}

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
