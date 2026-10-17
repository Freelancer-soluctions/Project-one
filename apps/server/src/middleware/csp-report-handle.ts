// csp-report-handler.js
// --------------------------------------------------------------
// Middleware para capturar y registrar violaciones CSP.
// Cuando el navegador bloquea un script, iframe, imagen o estilo
// NO permitido por tu Content Security Policy, envía un POST
// automáticamente a este endpoint.
// --------------------------------------------------------------

import type { Request, Response } from 'express';

/**
 * Forma estructural mínima del logger que consume este handler.
 * `logger/index.js` (winston) la cumple; se tipa estructural para no
 * acoplar este middleware a una implementación concreta.
 */
type ReportLogger = {
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
};

export const cspReportHandler = (logger: ReportLogger) => {
  return (req: Request, res: Response) => {
    try {
      const body = req.body;

      // ----------------------------------------------------------
      // Detectar si el cuerpo tiene un reporte CSP válido
      // Navegadores varían la propiedad:
      //   - "csp-report"   (Firefox, Safari)
      //   - "cspReport"    (Chrome, algunos proxies)
      //   - o todo dentro de body
      // ----------------------------------------------------------
      const report = body?.['csp-report'] || body?.cspReport || body;

      if (!report) {
        // Caso raro: el navegador envió el POST sin datos válidos
        logger.warn('CSP report recibido sin contenido válido', {
          ip: req.ip,
          body,
        });
        return res.status(204).end();
      }

      // ----------------------------------------------------------
      // Registrar violación REAL — Esto sí indica algo crítico
      // ----------------------------------------------------------
      logger.error('🚨 VIOLACIÓN DE CSP DETECTADA', {
        ip: req.ip,
        violatedDirective: report['violated-directive'],
        blockedUri: report['blocked-uri'],
        originalPolicy: report['original-policy'],
        sourceFile: report['source-file'],
        lineNumber: report['line-number'],
        columnNumber: report['column-number'],
        userAgent: req.headers['user-agent'],
      });

      // CSP siempre debe responder 204 “No Content”
      return res.status(204).end();
    } catch (err) {
      // ----------------------------------------------------------
      // Si hay error interno, se registra.
      // Igual se responde 204 porque es lo que espera el navegador.
      // ----------------------------------------------------------
      logger.error('Error procesando CSP report', {
        error: err instanceof Error ? err.message : String(err),
      });
      return res.status(204).end();
    }
  };
};
