// Unsafe Deserialization fix: Validate then JSON.parse
// This should NOT trigger the unsafe-deserialization rule

// SAFE: Validate input before JSON.parse
const data = validateJsonInput(req.body.data);
JSON.parse(data);
