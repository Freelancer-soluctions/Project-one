import request from 'supertest';
import app from '../../../src/app.js';

/**
 * Creates a supertest request instance based on environment.
 * If BASE_URL is a real absolute http(s) URL, uses it to test against a remote deployed service.
 * Otherwise, uses the in-process Express app for local testing.
 *
 * GOTCHA — `process.env.BASE_URL` SIEMPRE existe y vale `"/"`:
 * Vite resuelve su opcion `base` y la inyecta en `process.env.BASE_URL`
 * (`node_modules/vite/dist/node/chunks/config.js`, `const BASE_URL = resolvedBase`),
 * con default `"/"` cuando no se configura `base`. Un chequeo `if (baseUrl)` por tanto es
 * SIEMPRE verdadero, y `request("/")` es una URL relativa que superagent no puede resolver
 * -> `ECONNREFUSED` en 14 de 17 smoke tests, tanto en local como en CI.
 *
 * Por eso el guard valida que sea una URL http(s) ABSOLUTA de verdad, no solo truthy. Cualquier
 * valor que no sea eso (incluido el `"/"` de Vite y el `""` de un env vacio) cae al modo
 * in-process, que es el que funciona.
 */
const REMOTE_URL_PATTERN = /^https?:\/\/[^\s/]+/;

export function createRequest() {
  const baseUrl = process.env.BASE_URL;

  if (baseUrl && REMOTE_URL_PATTERN.test(baseUrl)) {
    // Strip trailing slash if present
    const normalizedUrl = baseUrl.replace(/\/$/, '');
    return request(normalizedUrl);
  }

  // In-process mode: test against the Express app directly
  return request(app);
}

export default createRequest;
