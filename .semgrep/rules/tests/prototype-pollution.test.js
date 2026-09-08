// Prototype Pollution (CWE-1321) test fixtures - vulnerable case
// vulnerable: should trigger the rule (Object.assign with user input)
const http = require('http');

http
  .createServer((req, res) => {
    // VULNERABLE: user-controlled input from query string passed to Object.assign
    const userInput = req.query.data; // uncontrolled user input
    Object.assign(target, userInput); // ← this should trigger the rule
  })
  .listen(3000);
