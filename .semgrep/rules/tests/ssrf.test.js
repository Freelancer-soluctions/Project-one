// SSRF (CWE-918) test fixtures - vulnerable case
// vulnerable: should trigger the rule (fetch with user-controlled URL)
const http = require('http');

async function fetchUserData(userInput) {
  // VULNERABLE: user-controlled URL passed directly to fetch
  const response = await fetch(userInput); // ← this should trigger the rule
  const data = await response.text();
  return data;
}
