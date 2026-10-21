/**
 * Minimal surface types for the `security` module.
 *
 * The module exposes routes only (no dao/service/controller): its single
 * endpoint, `POST /csp-report`, receives Content-Security-Policy violation
 * reports pushed automatically by the browser. The shapes below describe the
 * wire payload that endpoint accepts — browsers wrap the violation document
 * under `csp-report` (Firefox/Safari) or `cspReport` (Chrome/some proxies),
 * or send it as the whole body.
 */

/** CSP violation document as sent by the browser. */
export interface CspViolationReport {
  'violated-directive'?: string;
  'blocked-uri'?: string;
  'original-policy'?: string;
  'source-file'?: string;
  'line-number'?: number;
  'column-number'?: number;
  [key: string]: unknown;
}

/** Body accepted by `POST /csp-report` (any of the browser wrapper shapes). */
export interface CspReportBody {
  'csp-report'?: CspViolationReport;
  cspReport?: CspViolationReport;
  [key: string]: unknown;
}
