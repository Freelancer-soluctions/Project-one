// SSRF (CWE-918) test fixtures
// vulnerable: should trigger the rule (fetch with user-controlled URL)
const http = require('http');

async function fetchUserData(userInput) {
  // VULNERABLE: user-controlled URL passed directly to fetch
  const response = await fetch(userInput); // ← this should trigger the rule
  const data = await response.text();
  return data;
}

// fixed: should NOT trigger the rule (validated URL)
async function fetchSafeData(validatedId) {
  // SAFE: validated ID, whitelisted domain
  const url = `https://api.example.com/users/${validatedId}`; // controlled domain
  const response = await fetch(url); // ← this should NOT trigger the rule
  const data = await response.text();
  return data;
}
