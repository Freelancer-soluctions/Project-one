import app from '../app.js';
import { swaggerDocs as V1SwaggerDocs } from '../docs/swagger.js';
import dotenv from '../config/dotenv.js';
// import { loadSecrets } from '../config/aws/secrets.js'

// const PORT = dotenv('PORT') || 3000
// const server = app.listen(PORT, () => {
//   console.log(`listening on port ${PORT}`)
//   V1SwaggerDocs(app, PORT)
// })

// // keep alive
// server.keepAliveTimeout = (60 * 1000) + 1000
// server.headersTimeout = (60 * 1000) + 2000

async function bootstrap() {
  // 1. Variables base (.env)
  const PORT = dotenv('PORT') || 3000;

  // // 2. Cargar secretos (LocalStack o AWS)
  // const secrets = await loadSecrets()

  // 3. Inyectar secretos al runtime
  // process.env.JWT_ACCESS_SECRET = secrets.JWT_ACCESS_SECRET
  // process.env.JWT_REFRESH_SECRET = secrets.JWT_REFRESH_SECRET
  // process.env.SECRETCOOKIEKEY = secrets.COOKIE_SECRET
  // process.env.AES_GCM_KEY = secrets.AES_GCM_KEY
  // process.env.DATABASE_URL = secrets.DATABASE_URL
  // process.env.POSTGRES_PASSWORD = secrets.POSTGRES_PASSWORD
  // process.env.PGADMIN_DEFAULT_PASSWORD = secrets.PGADMIN_PASSWORD

  // 4. Arrancar servidor
  const server = app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
    V1SwaggerDocs(app, PORT);
  });

  // 5. Configuración de timeouts
  server.keepAliveTimeout = 60 * 1000 + 1000;
  server.headersTimeout = 60 * 1000 + 2000;
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});
