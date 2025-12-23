import { ENVIROMENTS } from '../constants/enums.js'
import dotenv from '../../config/dotenv.js'
import helmet from 'helmet'

// helmet.config.js
// -----------------------------------------------------------
// Configuración centralizada de Helmet alineada con OWASP Top 10
// - A02: Cryptographic Failures
// - A03: Injection (XSS)
// - A05: Security Misconfiguration
//
// La configuración se adapta automáticamente
// a desarrollo vs producción.
// -----------------------------------------------------------

const FRONTEND_URL = dotenv('FRONTEND_URL')
const NODE_ENV = dotenv('NODE_ENV')
const isProduction = NODE_ENV === ENVIROMENTS.PRODUCTION

export const helmetConfig = helmet({
  // -----------------------------------------------------------
  // OCULTAR DETALLES INTERNOS DE EXPRESS
  // OWASP A05 - Security Misconfiguration
  // -----------------------------------------------------------
  hidePoweredBy: true,

  // -----------------------------------------------------------
  // CSP REPORTING (NAVEGADOR → BACKEND)
  // OWASP A03 - Detección de XSS reales
  // -----------------------------------------------------------
  // Este endpoint NO lo llama el frontend,
  // lo llama automáticamente el navegador.
  reportingEndpoints: isProduction
    ? [
        {
          name: 'csp-endpoint',
          url: '/api/v1/security/csp-report'
        }
      ]
    : undefined,

  // -----------------------------------------------------------
  // CONTENT SECURITY POLICY (CSP)
  // OWASP A03 - Injection (XSS)
  // -----------------------------------------------------------
  contentSecurityPolicy: {
    useDefaults: true,

    directives: {
      // -------------------------------------------------------
      // POLÍTICA BASE
      // -------------------------------------------------------
      defaultSrc: ["'self'"],

      // -------------------------------------------------------
      // SCRIPTS
      // En producción: estricta
      // En desarrollo: se permite lo necesario para Vite/HMR
      // -------------------------------------------------------
      scriptSrc: isProduction
        ? ["'self'", FRONTEND_URL]
        : [
            "'self'",
            FRONTEND_URL,
            "'unsafe-inline'",
            "'unsafe-eval'" // requerido por Vite / source maps
          ],

      // -------------------------------------------------------
      // STYLES
      // unsafe-inline es necesario mientras React genere estilos inline
      // -------------------------------------------------------
      styleSrc: [
        "'self'",
        FRONTEND_URL,
        "'unsafe-inline'"
      ],

      // -------------------------------------------------------
      // IMÁGENES
      // -------------------------------------------------------
      imgSrc: [
        "'self'",
        FRONTEND_URL,
        'data:',
        'blob:'
      ],

      // -------------------------------------------------------
      // FETCH / XHR / WEBSOCKET
      // -------------------------------------------------------
      connectSrc: [
        "'self'",
        FRONTEND_URL
      ],

      // -------------------------------------------------------
      // CLICKJACKING
      // -------------------------------------------------------
      frameAncestors: ["'none'"],

      // -------------------------------------------------------
      // BASE TAG
      // -------------------------------------------------------
      baseUri: ["'self'"],

      // -------------------------------------------------------
      // OBJETOS LEGADOS (Flash, Java)
      // -------------------------------------------------------
      objectSrc: ["'none'"],

      // -------------------------------------------------------
      // MANIFEST (PWA FUTURO)
      // -------------------------------------------------------
      manifestSrc: ["'self'", FRONTEND_URL],

      // -------------------------------------------------------
      // REPORTES CSP
      // SOLO en producción (evita ruido en dev)
      // -------------------------------------------------------
      ...(isProduction && {
        reportUri: ['/api/v1/security/csp-report'],
        reportTo: 'csp-endpoint'
      })
    }
  },

  // -----------------------------------------------------------
  // STRICT-TRANSPORT-SECURITY (HSTS)
  // OWASP A02 - Cryptographic Failures
  // -----------------------------------------------------------
  // ⚠️ SOLO en producción
  // Obliga al navegador a usar HTTPS
  hsts: isProduction
    ? {
        maxAge: 31536000, // 1 año
        includeSubDomains: true,
        preload: true
      }
    : false,

  // -----------------------------------------------------------
  // MIME SNIFFING
  // OWASP A05
  // -----------------------------------------------------------
  noSniff: true,

  // -----------------------------------------------------------
  // CLICKJACKING (HEADER X-FRAME-OPTIONS)
  // -----------------------------------------------------------
  frameguard: {
    action: 'deny'
  },

  // -----------------------------------------------------------
  // REFERER POLICY
  // Evita filtrar rutas o tokens en headers
  // -----------------------------------------------------------
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // -----------------------------------------------------------
  // PERMISSIONS POLICY
  // OWASP A05
  // -----------------------------------------------------------
  permissionsPolicy: {
    features: {
      camera: "'none'",
      geolocation: "'none'",
      microphone: "'none'"
    }
  }
})
