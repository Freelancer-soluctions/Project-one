// SSRF vulnerability: fetch with user-controlled URL from req.query
// This should trigger the ssrf rule

// VULNERABLE: fetch with unvalidated user-controlled URL
fetch(req.query.url);
