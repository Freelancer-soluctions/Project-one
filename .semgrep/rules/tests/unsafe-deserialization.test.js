// Unsafe Deserialization (CWE-502) test fixtures - vulnerable case
// vulnerable: should trigger the rule (JSON.parse with user input)
const userInput = req.query.data; // uncontrolled user input from query string
const parsed = JSON.parse(userInput); // ← this should trigger the rule
