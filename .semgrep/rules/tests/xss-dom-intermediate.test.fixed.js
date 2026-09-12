// XSS DOM intermediate fix: constant string (true-negative)
// This should NOT trigger the xss-dom-intermediate rule

// SAFE: dangerouslySetInnerHTML with constant string (no user-controlled value)
const constantString = 'safe static content';
const el = {};
el.dangerouslySetInnerHTML = { __html: constantString };
