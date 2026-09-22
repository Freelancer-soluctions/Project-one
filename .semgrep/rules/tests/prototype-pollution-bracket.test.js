// Prototype Pollution vulnerability: bracket-notation write with user-controlled key
// This should trigger the prototype-pollution rule

const FAKE_TARGET = {};
const userKey = req.body.key; // user-controlled input
const FAKE_VALUE = 'FAKE_value';

// VULNERABLE: computed property write with unvalidated user-controlled key
FAKE_TARGET[userKey] = FAKE_VALUE;
