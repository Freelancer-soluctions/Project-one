// Prototype Pollution vulnerability: Object.assign with user-controlled input from req.query
// This should trigger the prototype-pollution rule

const target = {};
const data = req.query.data; // user-controlled input

// VULNERABLE: Object.assign with unvalidated user input can lead to prototype pollution
Object.assign(target, data);
