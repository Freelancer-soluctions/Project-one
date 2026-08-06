import request from 'supertest';
import app from '../../../src/app.js';

/**
 * Creates a supertest request instance based on environment.
 * If BASE_URL is set, uses it to test against a remote deployed service.
 * Otherwise, uses the in-process Express app for local testing.
 */
export function createRequest() {
  const baseUrl = process.env.BASE_URL;

  if (baseUrl) {
    // Strip trailing slash if present
    const normalizedUrl = baseUrl.replace(/\/$/, '');
    return request(normalizedUrl);
  }

  // In-process mode: test against the Express app directly
  return request(app);
}

export default createRequest;
