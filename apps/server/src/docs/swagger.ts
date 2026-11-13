import type { Express, Request, Response } from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
// Opciones compartidas con el generador del contrato versionado
// (`scripts/generate-openapi.ts` → `openapi.yaml`): una sola fuente para los
// globs de anotaciones (change `ci-shifting-left`, capability api-contract-linting).
import { swaggerOptions } from './swagger-options.js';

// Docs in JSON format
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Function to setup our docs
export const swaggerDocs = (app: Express, port: number | string): void => {
  // Route-Handler to visit our docs
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  // Make our docs in JSON format available
  app.get('/api/v1/docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  console.log(
    `Version 1 Docs are available on http://localhost:${port}/api/v1/docs`
  );
};
