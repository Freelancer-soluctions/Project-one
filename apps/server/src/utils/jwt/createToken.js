import dotenv from '../../config/dotenv.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const createTokenOld = (payload = {}) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { ...payload },
      dotenv('SECRETKEY'),
      {
        // expiresIn: '120000' // 2 min
        // expiresIn: '10m'
        // expiresIn: '9000000' // 15 min (900000)
        // expiresIn: '5m'
        expiresIn: '1d',
      },
      (err, token) => {
        if (err) {
          reject('token not generated.');
        } else {
          // console.log('token generated', token)
          resolve(token);
        }
      }
    );
  });
};

export const createRefreshTokenOld = (payload = {}) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { ...payload },
      dotenv('REFRESHSECRETKEY'),
      {
        expiresIn: '1d',
      },
      (err, token) => {
        if (err) {
          reject('refresh token not generated.');
        } else {
          resolve(token);
        }
      }
    );
  });
};

/// ------------------------------------------------------------------

// Opciones base para firmar los tokens JWT.
// - Uso HS256 porque es seguro mientras la clave tenga suficiente entropía.
// - Defino issuer y audience para evitar uso del token fuera del contexto esperado.
const SIGN_OPTIONS = {
  algorithm: 'HS256',
  issuer: 'mi-api',
  audience: 'mi-front',
};

// Las opciones para refresh tokens usan la misma configuración base.
// - No defino el expiry aquí porque lo paso al llamar la función.
// - Mantengo separación por claridad.
const SIGN_REFRESH_OPTIONS = {
  ...SIGN_OPTIONS,
  // refresh puede tener un expiry mayor (1 día, 7 días o lo que yo quiera)
};

// Función que valida que el payload no sea vacío ni inválido.
// Esto evita firmar tokens corruptos o mal construidos.
function validatePayload(payload) {
  if (
    !payload || // Debe existir
    typeof payload !== 'object' || // Debe ser un objeto
    Array.isArray(payload) || // No debe ser un array
    Object.keys(payload).length === 0 // No debe estar vacío
  ) {
    throw new Error(
      'El payload del token es obligatorio y debe ser un objeto no vacío.'
    );
  }
}

// Función genérica para crear tokens, recibe:
// - payload: la data que quiero meter en el JWT
// - secret: la clave con la que voy a firmar el token
// - expiresIn: tiempo de expiración del token
// - options: configuración del algoritmo, issuer y audience
const createTokenWithKey = (
  payload,
  secret,
  expiresIn = '15m',
  options = SIGN_OPTIONS
) => {
  return new Promise((resolve, reject) => {
    try {
      // Primero valido el payload para asegurarme que no firmo basura
      validatePayload(payload);

      // Verifico que la clave secreta exista. Firmar sin clave rompería toda la seguridad.
      if (!secret) {
        return reject('La clave secreta del token no está definida.');
      }

      // Firmo el token usando jsonwebtoken
      jwt.sign(
        payload,
        secret,
        { ...options, expiresIn }, // Aplico opciones + expiración específica
        (err, token) => {
          if (err) {
            return reject('Error generando el token.');
          }

          // SOLO en desarrollo imprimo el token (esto nunca debe hacerse en producción)
          if (process.env.NODE_ENV === 'development') {
            console.log('Token generado:', token);
          }

          // Devuelvo el token firmado
          resolve(token);
        }
      );
    } catch (error) {
      // Manejo cualquier error ocurrido en la función
      reject(error.message);
    }
  });
};

// Access token:
// - Se firma con la variable de entorno SECRETKEY
// - Expira rápido (900000 ms = 15min)
// - Usa las SIGN_OPTIONS base
export const createToken = (payload) =>
  createTokenWithKey(payload, dotenv('SECRETKEY'), '900000', SIGN_OPTIONS);

// Refresh token:
// - Se firma con REFRESHSECRETKEY (clave distinta)
// - Expira más largo (1 día por defecto)
// - Usa SIGN_REFRESH_OPTIONS para permitir expiraciones largas
export const createRefreshToken = (payload) =>
  createTokenWithKey(
    payload,
    dotenv('REFRESHSECRETKEY'),
    '1d',
    SIGN_REFRESH_OPTIONS
  );

// Refresh token opaco:
// - No usa JWT, solo genera un string aleatorio criptográficamente seguro.
// - randomBytes(64) garantiza entropía fuerte (CSPRNG)
// - Ideal para rotación e invalidación en BBDD.
export const createRefreshTokenOpaque = () => {
  return new Promise((resolve, reject) => {
    try {
      const token = crypto.randomBytes(64).toString('hex'); // Token opaco seguro
      resolve(token);
    } catch (error) {
      reject(error.message);
    }
  });
};
