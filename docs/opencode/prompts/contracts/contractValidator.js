import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @module contractValidator
 * @description Ajv-powered JSON Schema validation for agent output contracts.
 * 
 * Validation pipeline:
 * 1. parseContractEnvelope - extracts agent, version, payload from XML envelope
 * 2. validateWithAjv - validates payload against agent schema (allOf + base.$ref) using Ajv
 * 3. validateSubSchema - dispatches to responseTypes.success/failure sub-schemas
 * 
 * Hand-rolled validation functions (checkRequiredFields, checkTypes, validateObjectFields,
 * FORMAT_VALIDATORS, validatePayload, validateResponseType, validateSuccessPayload,
 * validateFailurePayload) have been removed. Caveman field expansion has been removed.
 * All validation now routes through validateContract using Ajv with allErrors: true
 * and ajv-formats for uri/date-time validation.
 */

const ajv = new Ajv({ allErrors: true, strict: 'log' });
addFormats(ajv);

// Pre-register base.schema.json at module init for $ref resolution
const baseSchemaRaw = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'base.schema.json'), 'utf-8'));
// Strip $schema to avoid Ajv trying to resolve meta-schema
const { $schema: _baseSchemaRef, ...baseSchema } = baseSchemaRaw;
ajv.addSchema(baseSchema, 'base.schema.json');

// responseTypes is our custom branching keyword (success/failure sub-schemas) — not JSON Schema standard
// Ajv ignores it as a no-op; branching handled in validateContract
ajv.addKeyword({
  keyword: 'responseTypes',
  validate: () => true,
  errors: false
});

export class ContractParseError extends Error {
  constructor(message, rawResponse) {
    super(message);
    this.name = 'ContractParseError';
    this.rawResponse = rawResponse;
  }
}

export class ContractValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ContractValidationError';
    this.errors = errors;
  }
}

const schemaCache = new Map();
const validatorCache = new Map(); // compiled Ajv validate functions
// Cache keys: agentName (base), agentName_success, agentName_failure

export const DEGRADED_AGENTS = new Set();

/**
 * Parses the XML envelope from an agent response.
 * @param {string} response - Raw agent response string with <output-contract> envelope
 * @returns {{agent: string, version: number, payload: object}}
 * @throws {ContractParseError} If envelope is missing or JSON payload is invalid
 */
export function parseContractEnvelope(response) {
  const openMatch = response.match(/<output-contract\s+(?:agent=(["'])([^"']+)\1\s+version=(["'])(\d+)\3|version=(["'])(\d+)\5\s+agent=(["'])([^"']+)\7)\s*>/);
  if (!openMatch) {
    throw new ContractParseError('Invalid or missing output-contract envelope', response);
  }
  const agent = openMatch[2] || openMatch[8];
  const version = parseInt(openMatch[4] || openMatch[6], 10);
  const closeIdx = response.lastIndexOf('</output-contract>');
  if (closeIdx === -1) {
    throw new ContractParseError('Missing closing output-contract tag', response);
  }
  const contentStart = openMatch.index + openMatch[0].length;
  const payloadStr = response.substring(contentStart, closeIdx).trim();
  let payload;
  try {
    payload = JSON.parse(payloadStr);
  } catch (e) {
    throw new ContractParseError('Failed to parse JSON payload', response);
  }
  return { agent, version, payload };
}

// validateWithAjv — replaces ~100 lines of hand-rolled validation
// Compiles schema with Ajv, returns {valid, errors} with errors mapped to {field, message}
function validateWithAjv(schema, payload) {
  let validate;
  try {
    validate = ajv.compile(schema);
  } catch (e) {
    return { valid: false, errors: [{ field: 'unknown', message: e.message }] };
  }
  const valid = validate(payload);
  if (valid) return { valid: true, errors: [] };
  
  const errors = (validate.errors || []).map(e => {
    let field;
    if (e.instancePath && e.instancePath !== '') {
      field = e.instancePath.replace(/^\//, '').replace(/\//g, '.');
    } else if (e.params?.missingProperty) {
      field = e.params.missingProperty;
    } else if (e.params?.additionalProperty) {
      field = e.params.additionalProperty;
    } else {
      field = 'unknown';
    }
    return { field, message: e.message || '' };
  });
  return { valid: false, errors };
}

// Sub-schema validation for responseTypes (success/failure branching)
 // Compiles and caches responseTypes.success and responseTypes.failure sub-schemas separately
 function validateSubSchema(schema, payload, agentName) {
   const errors = [];
   const responseType = payload?.responseType;
   const subSchemaKey = responseType ? schema?.responseTypes?.[responseType] : null;
   
   if (!subSchemaKey) return { errors: [] }; // backward compat: no sub-schema defined
   
   const cacheKey = `${agentName}_${responseType}`;
   let validate = validatorCache.get(cacheKey);
   
   if (!validate) {
     try {
       // Ajv strict mode requires sub-schemas to have explicit type: "object"
       const subSchema = { ...subSchemaKey, type: 'object' };
       ajv.addSchema(subSchema, cacheKey);
       validate = ajv.getSchema(cacheKey);
       validatorCache.set(cacheKey, validate);
     } catch (e) {
       return { errors: [{ field: 'unknown', message: `Sub-schema compilation failed: ${e.message}` }] };
     }
   }
   
   const valid = validate(payload);
   if (!valid) {
     errors.push(...(validate.errors || []).map(e => {
       let field;
       if (e.instancePath && e.instancePath !== '') {
         field = e.instancePath.replace(/^\//, '').replace(/\//g, '.');
       } else if (e.params?.missingProperty) {
         field = e.params.missingProperty;
       } else if (e.params?.additionalProperty) {
         field = e.params.additionalProperty;
       } else {
         field = 'unknown';
       }
       return { field, message: e.message || '' };
     }));
   }
   return { errors };
 }

/**
 * Loads and caches an agent's JSON Schema.
 * @param {string} agentName - Name of the agent (e.g., 'developer', 'orchestrator')
 * @returns {object|null} Schema object with $schema stripped, or null if file doesn't exist
 */
export function loadAgentSchema(agentName) {
  if (schemaCache.has(agentName)) {
    return schemaCache.get(agentName);
  }
  const schemaPath = path.resolve(__dirname, `${agentName}.schema.json`);
  if (!fs.existsSync(schemaPath)) {
    return null;
  }
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const schemaRaw = JSON.parse(schemaContent);
  // Strip $schema to avoid Ajv trying to resolve meta-schema
  const { $schema: _schemaRef, ...schema } = schemaRaw;
  schemaCache.set(agentName, schema);
  // Register with Ajv for $ref resolution
  ajv.addSchema(schema, `${agentName}.schema.json`);
  return schema;
}

/**
 * Validates an agent response against its JSON Schema using Ajv.
 * 
 * Pipeline: parseContractEnvelope → validateWithAjv (base schema via allOf+base.$ref) 
 * → validateSubSchema (responseTypes dispatch) → return {valid, errors}
 * 
 * @param {string} response - Raw agent response with XML envelope
 * @param {string} agentName - Expected agent name (validated against envelope)
 * @param {object} [options] - Currently unused (kept for API compatibility)
 * @returns {Promise<{valid: boolean, agent: string, version: number, errors: Array, payload: object, degraded?: boolean}>}
 */
export function validateContract(response, agentName, options = {}) {
  let parsed;
  try {
    parsed = parseContractEnvelope(response);
  } catch (e) {
    return { valid: false, agent: null, version: null, errors: [{ field: 'unknown', message: e.message }], payload: null };
  }
  let { agent, version, payload } = parsed;
  if (agent !== agentName) {
    return { valid: false, agent, version, errors: [{ message: `Agent mismatch: expected ${agentName}, got ${agent}` }], payload };
  }
  // Guard: payload must be object
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return { valid: false, agent, version, errors: [{ message: 'Payload must be a JSON object (null/array rejected)' }], payload };
  }

  // Degraded fast-path
  if (DEGRADED_AGENTS.has(agentName)) {
    return { valid: true, degraded: true, warning: `No schema for agent '${agentName}', running in degraded mode (fast-path)`, agent, version, errors: [], payload };
  }
  
  const schema = loadAgentSchema(agentName);
  if (!schema) {
    DEGRADED_AGENTS.add(agentName);
    return { valid: true, degraded: true, warning: `No schema for agent '${agentName}', running in degraded mode`, agent, version, errors: [], payload };
  }
  
  // Base validation with Ajv
  const baseResult = validateWithAjv(schema, payload);
  const allErrors = [...baseResult.errors];
  
  if (!baseResult.valid) {
    return { valid: false, agent, version, errors: allErrors, payload };
  }
  
  // Sub-schema dispatch for responseTypes
  const subResult = validateSubSchema(schema, payload, agentName);
  allErrors.push(...subResult.errors);
  
  if (allErrors.length > 0) {
    return { valid: false, agent, version, errors: allErrors, payload };
  }
  
  return { valid: true, agent, version, errors: [], payload, degraded: false };
}

// P0 fix (Task 3.2): createEscalationReport now includes reissueRequired hint.
export function createEscalationReport(agentName, response, validationErrors, retryCount, options = {}) {
  return {
    type: 'escalation',
    agentName,
    rawResponse: response,
    validationErrors,
    retryCount,
    reissueRequired: options.reissueRequired ?? true,
    reissuePossible: !!options.reissue,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Checks if an agent is in degraded mode (no schema file loaded).
 * @param {string} agentName - Agent name
 * @returns {boolean}
 */
export function isDegraded(agentName) {
  return DEGRADED_AGENTS.has(agentName);
}

/**
 * Clears degraded mode for an agent, forcing fresh schema load on next validation.
 * Also clears schemaCache and validatorCache entries for the agent.
 * @param {string} agentName - Agent name
 */
export function clearDegraded(agentName) {
  DEGRADED_AGENTS.delete(agentName);
  schemaCache.delete(agentName);
  // Clear validatorCache entries for this agent (base + success + failure)
  validatorCache.delete(agentName);
  validatorCache.delete(`${agentName}_success`);
  validatorCache.delete(`${agentName}_failure`);
}

// P0 fix (Task 3.2): withRetry now accepts (agentName, response, options) where options
// is {maxRetries?, reissue?}. Backward compat: also accepts (agentName, response, maxRetries)
// when arg 3 is a number. The reissue callback MAY be async — if it returns a
// Promise, withRetry awaits it before validating the fresh response.
// Emits BOTH `exhausted` (legacy) and `reissueRequired` (new) for backward compatibility.
// `shouldRetry` is intentionally not returned: withRetry ALWAYS exhausts the budget
// internally before returning; callers should re-invoke withRetry if they want more attempts.
export async function withRetry(agentName, response, arg3 = {}) {
  let maxRetries = 2;
  let reissue = null;
  if (typeof arg3 === 'number') {
    maxRetries = arg3;
  } else if (arg3 && typeof arg3 === 'object') {
    if (typeof arg3.maxRetries === 'number') maxRetries = arg3.maxRetries;
    if (typeof arg3.reissue === 'function') reissue = arg3.reissue;
  }
  let retryCount = 0;
  let currentResponse = response;
  while (retryCount <= maxRetries) {
    const result = validateContract(currentResponse, agentName);
    if (result.valid) {
      return { exhausted: false, validationErrors: [], retryCount, maxRetries };
    }
    retryCount++;
    if (retryCount > maxRetries) {
      return {
        exhausted: true,
        reissueRequired: !reissue,
        reissuePossible: !!reissue,
        validationErrors: result.errors,
        retryCount,
        maxRetries,
      };
    }
    if (reissue) {
      // Await async reissue callbacks; sync callbacks are awaited transparently.
      const fresh = reissue();
      currentResponse = (fresh && typeof fresh.then === 'function') ? await fresh : fresh;
    } else {
      // No reissue — further retries on the same broken response are pointless.
      return {
        exhausted: true,
        reissueRequired: true,
        reissuePossible: false,
        validationErrors: result.errors,
        retryCount,
        maxRetries,
      };
    }
  }
  return {
    exhausted: true,
    reissueRequired: !reissue,
    reissuePossible: !!reissue,
    validationErrors: [],
    retryCount,
    maxRetries,
  };
}