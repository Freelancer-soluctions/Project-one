// Unsafe Deserialization vulnerability: JSON.parse with user-controlled input from req.body
// This should trigger the unsafe-deserialization rule

// VULNERABLE: JSON.parse with unvalidated user input
JSON.parse(req.body.data);
