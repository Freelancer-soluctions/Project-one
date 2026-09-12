// Unsafe Deserialization (CWE-502) test fixtures
// vulnerable: should trigger the rule (JSON.parse with user input)
const userInput = req.query.data; // uncontrolled user input from query string
const parsed = JSON.parse(userInput); // ← this should trigger the rule

// fixed: should NOT trigger the rule (validated input)
const userInput2 = validateJsonInput(req.query.data); // controlled/sanitized input
const parsed2 = JSON.parse(userInput2); // ← this should NOT trigger the rule

function validateJsonInput(input) {
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed === 'object' && !parsed.__proto__) {
      return parsed;
    }
    return null;
  } catch (e) {
    return null;
  }
}
