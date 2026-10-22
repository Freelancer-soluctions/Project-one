import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from './app.js';

/**
 * Regresión de cabeceras de seguridad (change `server-restore-helmet-middleware`).
 *
 * La Fase 2 de la migración TS (`bf3cf1f2`) perdió el `app.use(helmetConfig)`
 * al convertir `app.js` → `app.ts`: el server servía sin CSP, sin ocultar
 * `X-Powered-By` y con las cabeceras OWASP A05 ausentes. Estos tests lo
 * capturan: comentar el `app.use(helmetConfig)` los pone en rojo.
 *
 * Ruta usada: POST /api/v1/security/csp-report (200, sin DB ni auth) — el 404 de una
 * ruta inexistente NO es válido para estas aserciones: `finalhandler` de Express
 * SOBREESCRIBE el CSP con su default `default-src 'none'` en respuestas de error.
 */
describe('Security headers (helmet restaurado)', () => {
  it('no expone X-Powered-By', async () => {
    const res = await request(app)
      .post('/api/v1/security/csp-report')
      .type('json')
      .send({ 'csp-report': { 'document-uri': 'https://x.test/' } });
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('emite Content-Security-Policy con default-src self y frame-ancestors none', async () => {
    const res = await request(app)
      .post('/api/v1/security/csp-report')
      .type('json')
      .send({ 'csp-report': { 'document-uri': 'https://x.test/' } });
    const csp = res.headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('emite X-Content-Type-Options: nosniff', async () => {
    const res = await request(app)
      .post('/api/v1/security/csp-report')
      .type('json')
      .send({ 'csp-report': { 'document-uri': 'https://x.test/' } });
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('emite X-Frame-Options: DENY', async () => {
    const res = await request(app)
      .post('/api/v1/security/csp-report')
      .type('json')
      .send({ 'csp-report': { 'document-uri': 'https://x.test/' } });
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  it('emite Referrer-Policy: strict-origin-when-cross-origin', async () => {
    const res = await request(app)
      .post('/api/v1/security/csp-report')
      .type('json')
      .send({ 'csp-report': { 'document-uri': 'https://x.test/' } });
    expect(res.headers['referrer-policy']).toBe(
      'strict-origin-when-cross-origin'
    );
  });
});
