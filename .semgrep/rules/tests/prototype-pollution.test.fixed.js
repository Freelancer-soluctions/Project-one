// Prototype Pollution (CWE-1321) test fixtures
// vulnerable: should trigger the rule (Object.assign with user input)
const http = require('http');

http
  .createServer((req, res) => {
    // VULNERABLE: user-controlled input from query string passed to Object.assign
    const userInput = req.query.data; // uncontrolled user input
    Object.assign(target, userInput); // ← this should trigger the rule
  })
  .listen(3000);

// fixed: should NOT trigger the rule (validated/controlled input)
const http2 = require('http');

http2
  .createServer((req, res) => {
    // SAFE: validated input from schema
    const userInput = validateAndSanitize(req.query.data); // controlled/sanitized
    Object.assign(target, userInput); // ← this should NOT trigger the rule
  })
  .listen(3000);

function validateAndSanitize(input) {
  // Input validation logic
  return input && typeof input === 'string' ? input.replace(/[^\w]/g, '') : {};
}
