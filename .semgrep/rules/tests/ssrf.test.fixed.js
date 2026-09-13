// SSRF fix: fetch with whitelist-validated URL
// This should NOT trigger the ssrf rule

const whitelist = ['https://api.example.com', 'https://internal.example.com'];

// SAFE: fetch with whitelisted URL
fetch(whitelist[req.query.url]);
