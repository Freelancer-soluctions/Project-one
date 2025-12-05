// helmet.config.js
// Archivo centralizado para configurar Helmet con
// Content Security Policy (CSP) sólido y adaptable,
// comentado para entender exactamente qué hace cada línea.

import helmet from 'helmet'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

export const helmetConfig = helmet({
  // -----------------------------------------------------------
  // OCULTAR DETALLES INTERNOS DE EXPRESS
  // -----------------------------------------------------------
  // Elimina el header "X-Powered-By" para evitar decir
  // abiertamente que el backend corre sobre Express.
  hidePoweredBy: true,

  // 🚨 Aquí está: reportingEndpoints está AL MISMO NIVEL que contentSecurityPolicy
  reportingEndpoints: [
    {
      name: 'csp-endpoint',
      url: '/api/v1/security/csp-report'
    }
  ],

  // -----------------------------------------------------------
  // CONTROLAR TODAS LAS POLÍTICAS DE SEGURIDAD
  // -----------------------------------------------------------
  contentSecurityPolicy: {
    useDefaults: true,

    // Aquí se definen todas las fuentes permitidas del frontend.
    // Si en el futuro React carga imágenes externas, scripts CDN,
    // iframes o conexiones WebSocket externas, se agregan aquí.
    directives: {
      // -------------------------------------------------------
      // DEFAULT-SRC
      // -------------------------------------------------------
      // Política base: TODO lo que no tenga una regla más específica
      // solo podrá cargar desde 'self'.
      defaultSrc: ["'self'"],

      // -------------------------------------------------------
      // SCRIPT-SRC
      // -------------------------------------------------------
      // Controla desde dónde pueden cargarse scripts JS.
      // Como el frontend está en otro dominio, se añade.
      // IMPORTANTE:
      // - Si algún día se usan scripts desde un CDN (ej. Google Maps),
      //   se deben añadir aquí.
      scriptSrc: [
        "'self'",
        FRONTEND_URL
      ],

      // -------------------------------------------------------
      // STYLE-SRC
      // -------------------------------------------------------
      // Permite cargar estilos solo desde:
      // - El propio backend
      // - El dominio del frontend
      // - 'unsafe-inline' es necesario porque React Vite genera estilos inline.
      //   Cuando pase a producción con build final, probablemente podrá eliminarse.
      styleSrc: [
        "'self'",
        FRONTEND_URL,
        "'unsafe-inline'"
      ],

      // -------------------------------------------------------
      // IMG-SRC
      // -------------------------------------------------------
      // Permite imágenes desde el backend, desde el frontend,
      // y desde blobs/base64 (React las usa a veces).
      // - Si en el futuro se cargan imágenes de un CDN (ej. CloudFront),
      //   se agrega aquí.
      imgSrc: [
        "'self'",
        FRONTEND_URL,
        'data:',
        'blob:'
      ],

      // -------------------------------------------------------
      // CONNECT-SRC
      // -------------------------------------------------------
      // Define quién puede hacer peticiones XHR, fetch, WebSockets
      // hacia el backend.
      // Aquí se habilita el frontend actual.
      connectSrc: [
        "'self'",
        FRONTEND_URL
      ],

      // -------------------------------------------------------
      // FRAME-ANCESTORS
      // -------------------------------------------------------
      // Controla quién puede insertar el sitio dentro de un iframe.
      // Protege contra clickjacking.
      // El usuario indicó que NO usa iframes.
      // Cuando el proyecto tenga dominio propio, reemplazar 'none'
      // por el dominio deseado.
      frameAncestors: ["'none'"],

      // -------------------------------------------------------
      // BASE-URI
      // -------------------------------------------------------
      // Controla dónde puede apuntar la etiqueta <base>.
      // Mantener siempre 'self' o eliminarla por seguridad.
      baseUri: ["'self'"],

      // -------------------------------------------------------
      // OBJECT-SRC
      // -------------------------------------------------------
      // Evita cargar Flash, Java applets, etc (deshabilitado totalmente).
      objectSrc: ["'none'"],

      // -------------------------------------------------------
      // MANIFEST-SRC
      // -------------------------------------------------------
      // Permite los archivos manifest (PWA). Por ahora no se usa.
      manifestSrc: ["'self'", FRONTEND_URL],

      // -------------------------------------------------------
      // 📌 AÑADIR REPORTES CSP
      // -------------------------------------------------------

      // Reportes clásicos (mayor compatibilidad)
      reportUri: ['/api/v1/security/csp-report'], // <<< AÑADIDO PARA ACTIVAR REPORTES CSP >>>

      // Reportes modernos (estándar actual)
      reportTo: 'csp-endpoint' // <<< AÑADIDO PARA BROWSER MODERNO >>>
    }
  },

  // -----------------------------------------------------------
  // PERMITE CONTROLAR SI EL NAVEGADOR PUEDE ADIVINAR TIPOS MIME
  // -----------------------------------------------------------
  noSniff: true,

  // -----------------------------------------------------------
  // PROTEGE CONTRA CLICKJACKING
  // -----------------------------------------------------------
  frameguard: {
    action: 'deny'
  },

  // -----------------------------------------------------------
  // CONTROLA LA POLÍTICA DE REFERER
  // -----------------------------------------------------------
  // Es más privado mandar solo "strict-origin-when-cross-origin".
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // -----------------------------------------------------------
  // LIMITA EL USO DE API COMO GEOLOCALIZACIÓN, CÁMARA, ETC.
  // -----------------------------------------------------------
  // Se deja vacío; si en el futuro se usa mapa, cámara o sensores,
  // se agregan aquí.
  permissionsPolicy: {
    features: {
      camera: "'none'",
      geolocation: "'none'",
      microphone: "'none'"
    }
  }
})

// NOTAS
// Qué cambiar al pasar a producción
// Caso	Qué modificar
// El frontend ya no está en localhost:5173	Cambiar FRONTEND_URL a https://tu-dominio.com
// Si React carga scripts externos (CDN)	Añadir dominio en scriptSrc
// Si React carga imágenes de un CDN	Añadir dominio en imgSrc
// Si usará mapas, Stripe, PayPal, reCAPTCHA	Ajustar connectSrc, scriptSrc y frameAncestors
// Si se usan iFrames	Reemplazar frameAncestors: ["'none'"]
