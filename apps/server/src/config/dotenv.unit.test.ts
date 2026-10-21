import { describe, it, expect, afterEach } from 'vitest';
import dotenv, { requireEnv } from './dotenv.js';

/**
 * Regresión de `server-ts-latent-defects`, fix 3 (dotenv honesto).
 *
 * `.env.test` está commiteado y lo carga `tests/setupTest.ts`, así que en la
 * suite las keys críticas existen: estos tests no dependen de un `.env` local.
 */

const ORIGINAL_SECRETKEY = process.env.SECRETKEY;
const CRITICAL_KEY = 'SECRETKEY';

afterEach(() => {
  // Restaurar el entorno: el resto de la suite firma/verifica JWT reales.
  if (ORIGINAL_SECRETKEY === undefined) {
    delete process.env[CRITICAL_KEY];
  } else {
    process.env[CRITICAL_KEY] = ORIGINAL_SECRETKEY;
  }
});

describe('requireEnv (unit)', () => {
  it('devuelve el valor de una key crítica presente en el entorno de test', () => {
    const value = requireEnv(CRITICAL_KEY);

    expect(value).toBe(ORIGINAL_SECRETKEY);
    expect(value).not.toBe('');
  });

  it('lanza nombrando la key cuando falta', () => {
    delete process.env[CRITICAL_KEY];

    expect(() => requireEnv(CRITICAL_KEY)).toThrow(
      `❌ Missing required env var: ${CRITICAL_KEY}`
    );
  });

  it('lanza también cuando la key existe pero está vacía', () => {
    process.env[CRITICAL_KEY] = '';

    expect(() => requireEnv(CRITICAL_KEY)).toThrow(
      `❌ Missing required env var: ${CRITICAL_KEY}`
    );
  });

  it('el throw es PEREZOSO: importar el módulo sin la key no rompe el suite', async () => {
    delete process.env[CRITICAL_KEY];

    // El módulo ya estaba importado arriba; la importación dinámica recalca
    // que el fallo ocurre en el ACCESO, no en el import.
    const mod = await import('./dotenv.js');
    expect(mod.requireEnv).toBeTypeOf('function');
    expect(() => mod.requireEnv(CRITICAL_KEY)).toThrow(
      /Missing required env var/
    );
  });
});

describe('dotenv (default) para keys opcionales (unit)', () => {
  it('sigue devolviendo cadena vacía cuando la key opcional no está definida', () => {
    // Contraste que justifica la política: las opcionales tienen default propio
    // en el call-site (`|| 3000`, `Number(...) || 20`), así que no deben lanzar.
    expect(dotenv('CLOUD_NAME')).toBe(process.env.CLOUD_NAME ?? '');
  });
});
