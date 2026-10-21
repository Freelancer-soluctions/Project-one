import { createServer } from 'http';
import app from '../app.ts';
import { swaggerDocs as V1SwaggerDocs } from '../docs/swagger.ts';
import dotenv from '../config/dotenv.ts';
import { attachSocketServer } from '../socket/levels/level-02-server.ts';

async function bootstrap() {
  const PORT = dotenv('PORT') || 3000;

  // Crear un único HTTP server para Express + Socket.IO
  const httpServer = createServer(app);

  // Adjuntar Socket.IO al mismo httpServer
  const io = attachSocketServer(httpServer);
  app.set('io', io);

  // Iniciar (Express + Socket.IO comparten el mismo puerto)
  httpServer.listen(PORT, () => {
    console.log('listening on port ' + PORT);
    V1SwaggerDocs(app, PORT);
  });

  // Configuración de timeouts
  httpServer.keepAliveTimeout = 60 * 1000 + 1000;
  httpServer.headersTimeout = 60 * 1000 + 2000;

  // Graceful shutdown unificado
  const shutdown = async (b: string): Promise<void> => {
    console.log('🛑 Recibida señal ' + b + '. Cerrando...');
    io.close(() => {
      httpServer.close(() => {
        console.log('🛑 Servidor cerrado.');
        process.exit(0);
      });
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});
