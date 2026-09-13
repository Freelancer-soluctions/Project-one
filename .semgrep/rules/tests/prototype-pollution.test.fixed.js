// Prototype Pollution fix: Validate and sanitize user input before Object.assign
// This should NOT trigger the prototype-pollution rule

const target = {};
const data = validateAndSanitize(req.query.data); // validated/sanitized input

// SAFE: Object.assign with validated input
Object.assign(target, data);
