// Prototype Pollution fix: sanitized bracket-notation write + safe alternatives
// This should NOT trigger the prototype-pollution rule

// SAFE 1: key passes through the configured sanitizer before the computed write
const FAKE_TARGET = {};
const cleanKey = validateAndSanitize(req.body.key); // validated/sanitized input
FAKE_TARGET[cleanKey] = 'FAKE_value';

// SAFE 2: allowlisted + sanitized key before the computed write
const FAKE_ALLOWED_KEYS = ['FAKE_name', 'FAKE_email'];
const rawKey = req.query.key;
if (FAKE_ALLOWED_KEYS.includes(rawKey)) {
  FAKE_TARGET[validateAndSanitize(rawKey)] = 'FAKE_value';
}

// SAFE 3: Map instead of a mutable object for user-controlled keys
const FAKE_STORE = new Map();
FAKE_STORE.set(req.params.key, 'FAKE_value');
