// eslint-disable-next-line no-unused-vars
import jwt, { decode } from 'jsonwebtoken';
import dontenv from '../config/dotenv.js';
import logger from '../logger/index.js';

/**
 * Verifies JWT token from Authorization header and attaches user data to request.
 * This middleware extracts the JWT from the 'Bearer {token}' format in the Authorization header,
 * validates the token signature and expiration, and attaches the decoded user
 * information to the request object for downstream middleware and routes.
 *
 * @param {Object} req - Express request object containing Authorization header
 * @param {string} [req.headers.authorization] - JWT token in 'Bearer {token}' format
 * @param {Object} res - Express response object for error responses
 * @param {Function} next - Express next middleware function
 * @returns {void} Calls next() with user data attached, or sends 401/403 response
 * @throws {Error} When JWT verification fails due to invalid signature or expired token
 * @throws {Error} When Authorization header is missing or malformed
 */
export const verifyToken = async (req, res, next) => {
  try {
    // Get the token from the headers
    const authHeader = req.headers.authorization || req.headers.Authorization;
    console.log('auth', authHeader);
    if (!authHeader) {
      logger.warn('⚠️ INTENTO DE ACCESO SIN TOKEN', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
      });
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];

    // if does not exists a token
    if (!token) {
      logger.warn('⚠️ HEADER DE AUTORIZACIÓN MALFORMADO', {
        ip: req.ip,
        authHeader: authHeader.substring(0, 20) + '...',
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
      });
      return res.status(401).json({ message: 'Sorry, you must log in.' });
    }

    // decode the token and verify the time
    const decoded = await jwt.verify(token, dontenv('SECRETKEY'), {
      algorithms: ['HS256'],
      issuer: 'mi-api',
      audience: 'mi-front',
    });

    // Validate if the token has no expired
    // console.log(decoded)
    // console.log(Date.now(decoded.exp))
    // if (decoded.exp <= Date.now()) {
    //   return res
    //     .status(401)
    //     .json({ message: 'Token expired' })
    // }
    // save the token on request object to using on routes
    req.userId = decoded.id;
    req.user = decoded;
    // continue with the next function
    next();
  } catch (error) {
    logger.warn(error.message, {
      ip: req.ip,
      expiredAt: error.expiredAt,
      path: req.path,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });
    return res.status(401).json({ error: error.message });
  }
};
