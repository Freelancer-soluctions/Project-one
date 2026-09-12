// XSS DOM intermediate vulnerability: dangerouslySetInnerHTML with user-controlled value from req.query
// This should trigger the xss-dom-intermediate rule

// VULNERABLE: dangerouslySetInnerHTML with unvalidated user input
const el = {};
el.dangerouslySetInnerHTML = { __html: req.query.theme };
