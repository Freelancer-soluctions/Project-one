/**
 * Output Contracts Simulation — verify validation pipeline end-to-end
 * Run: node simulation.mjs
 */

import { validateContract, parseContractEnvelope, DEGRADED_AGENTS, clearDegraded, isDegraded, ContractParseError, ContractValidationError } from './contractValidator.js';

// ─── helpers ────────────────────────────────────────────────────────────────

function xmlEnvelope(agent, version, payload) {
  const basePayload = {
    agent,
    timestamp: '2025-07-09T10:30:00Z',
    responseType: 'success',
    version: parseInt(version, 10),
    ...payload
  };
  return `<output-contract agent="${agent}" version="${version}">${JSON.stringify(basePayload)}</output-contract>`;
}

function pass(label, result) {
  console.log(`  ✅ ${label}`);
  if (result.payload) console.log(`     payload.result=${result.payload?.result}  errors=${result.errors?.length}`);
}

function fail(label, result, expectedError) {
  console.log(`  ❌ ${label}`);
  console.log(`     expected error: "${expectedError}"`);
  console.log(`     got errors:`, JSON.stringify(result.errors?.map(e => e.message || e.field || e)));
}

// ─── Test 1: Valid orchestrator envelope ─────────────────────────────────────

console.log('\n[TEST 1] Valid orchestrator envelope');
{
  const env = xmlEnvelope('orchestrator', '1', {
    responseType: 'success',
    status: 'completed',
    delegatedAgent: 'developer',
    workflowStep: 'implementation',
    result: 'success',
    details: 'Delegated task 1.3 to developer for jwt-auth change',
    changeName: 'jwt-auth',
    taskId: '1.3',
    validationErrors: [],
    nextSteps: ['Implement task 1.4']
  });
  const v = validateContract(env, 'orchestrator');
  v.valid ? pass('Valid orchestrator envelope', v) : fail('Valid orchestrator', v, 'none');
}

// ─── Test 2: Agent mismatch ──────────────────────────────────────────────────

console.log('\n[TEST 2] Agent mismatch');
{
  const env = xmlEnvelope('developer', '1', {
    responseType: 'success',
    status: 'completed',
    result: 'success',
    details: 'Task implemented'
  });
  const v = validateContract(env, 'orchestrator');
  !v.valid && v.errors[0]?.message?.includes('Agent mismatch')
    ? pass('Agent mismatch detected', v)
    : fail('Agent mismatch', v, 'Agent mismatch: expected orchestrator, got developer');
}

// ─── Test 3: Missing required field ─────────────────────────────────────────

console.log('\n[TEST 3] Missing required field (delegatedAgent)');
{
  const env = xmlEnvelope('orchestrator', '1', {
    responseType: 'success',
    status: 'completed',
    // missing delegatedAgent
    workflowStep: 'implementation',
    result: 'success',
    details: 'Missing delegatedAgent'
  });
  const v = validateContract(env, 'orchestrator');
  !v.valid && v.errors.some(e => e.field?.includes('delegatedAgent'))
    ? pass('Missing delegatedAgent detected', v)
    : fail('Missing delegatedAgent', v, 'required field delegatedAgent missing');
}

// ─── Test 4: Degraded mode (agent with no schema) ────────────────────────────

console.log('\n[TEST 4] Degraded mode (agent with no schema)');
clearDegraded('nonexistent-agent'); // ensure clean state
{
  const env = xmlEnvelope('nonexistent-agent', '1', {
    responseType: 'success',
    status: 'completed',
    result: 'ok'
  });
  const v = validateContract(env, 'nonexistent-agent');
  v.valid && v.degraded
    ? pass('Degraded mode activated', v)
    : fail('Degraded mode', v, 'degraded=true, valid=true');
}

// ─── Test 5: Invalid payload (null) ──────────────────────────────────────────

console.log('\n[TEST 5] Invalid payload (null)');
{
  const raw = '<output-contract agent="orchestrator" version="1">null</output-contract>';
  const v = validateContract(raw, 'orchestrator');
  !v.valid && v.errors[0]?.message?.includes('Payload must be a JSON object')
    ? pass('Null payload rejected', v)
    : fail('Null payload rejection', v, 'Payload must be a JSON object');
}

// ─── Test 6: withRetry reissue callback ──────────────────────────────────────

console.log('\n[TEST 6] async withRetry reissue callback');
{
  const { withRetry } = await import('./contractValidator.js');
  let reissueCount = 0;

  // First response: missing required fields (fails base schema validation).
  // Second response: valid with all required fields.
  const invalidResp = '<output-contract agent="orchestrator" version="1">{"agent":"orchestrator","timestamp":"2025-07-09T10:30:00Z","responseType":"success","version":1,"delegatedAgent":"developer","workflowStep":"implementation","result":"success","details":"first invalid","changeName":"test","taskId":"1","validationErrors":[],"nextSteps":[]}</output-contract>';
  const validResp = '<output-contract agent="orchestrator" version="1">{"agent":"orchestrator","timestamp":"2025-07-09T10:30:00Z","responseType":"success","version":1,"status":"completed","delegatedAgent":"developer","workflowStep":"implementation","result":"success","details":"second valid","changeName":"test","taskId":"1","validationErrors":[],"nextSteps":[]}</output-contract>';

  let callCount = 0;
  const reissue = () => {
    reissueCount++;
    return validResp;
  };

  const result = await withRetry('orchestrator', invalidResp, { maxRetries: 3, reissue });

  console.log(`  reissue called ${reissueCount} time(s), valid=${result.exhausted === false}`);
  if (result.exhausted === false && reissueCount >= 1) {
    pass(`withRetry succeeded after ${reissueCount} reissue(s)`, result);
  } else {
    fail('withRetry', result, `reissueCount>=1, exhausted=false, got reissueCount=${reissueCount}, exhausted=${result.exhausted}`);
  }
}

// ─── Test 7: Invalid responseType ────────────────────────────────────────────

console.log('\n[TEST 7] Invalid responseType (not success|failure)');
{
  const env = xmlEnvelope('orchestrator', '1', {
    responseType: 'invalid',
    status: 'completed',
    delegatedAgent: 'developer',
    workflowStep: 'implementation',
    result: 'success'
  });
  const v = validateContract(env, 'orchestrator');
  !v.valid && v.errors.some(e => e.message?.includes('allowed values') || e.message?.includes('responseType'))
    ? pass('Invalid responseType rejected', v)
    : fail('Invalid responseType', v, 'responseType must be success or failure');
}

// ─── Test 8: Agent schema validation with missing required field ──────────────

console.log('\n[TEST 8] Agent schema validation - missing required field in sub-schema');
{
  // responseType=success but missing required 'status' field
  const env = xmlEnvelope('orchestrator', '1', {
    responseType: 'success',
    // missing status
    delegatedAgent: 'developer',
    workflowStep: 'implementation',
    result: 'success',
    details: 'Missing status field'
  });
  const v = validateContract(env, 'orchestrator');
  !v.valid && v.errors.some(e => e.field?.includes('status'))
    ? pass('Missing required field in sub-schema detected', v)
    : fail('Missing status in sub-schema', v, 'required field status missing');
}

console.log('\n─── Simulation complete ───\n');