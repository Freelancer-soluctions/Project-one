import type { Request } from 'express';

/**
 * Throwaway probe file (deleted after the experiment): merges a request body
 * into a target object without sanitising it, which is the sink the custom
 * `prototype-pollution` rule looks for.
 */
export const mergeRequestBody = (req: Request): Record<string, unknown> => {
  const target: Record<string, unknown> = {};
  return Object.assign(target, req.body);
};
