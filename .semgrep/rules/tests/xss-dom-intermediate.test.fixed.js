// XSS via DOM intermediate variable (CWE-79) test fixtures
// vulnerable: should trigger the rule (dangerouslySetInnerHTML with intermediate user-controlled variable)
const userValue = req.query.theme; // uncontrolled user input from query string

// VULNERABLE: intermediate variable from user input passed to dangerouslySetInnerHTML
const ComponentVuln = () => (
  <div>
    <span dangerouslySetInnerHTML={{ __html: userValue }} /> // ← this should
    trigger the rule (user-controlled intermediate)
  </div>
);

// fixed: should NOT trigger the rule (constant or DOMPurify-sanitized)
const ComponentSafe = () => (
  <div>
    {/* SAFE: constant string — no user-controlled intermediate */}
    <span dangerouslySetInnerHTML={{ __html: 'Safe constant text' }} />

    {/* SAFE: DOMPurify-sanitized value */}
    {/* <span dangerouslySetInnerHTML={{ __html: dompurify.sanitize(userValue) }} /> */}
  </div>
);

// fixed: safe constant usage
const ComponentConstant = () => (
  <div>
    <span dangerouslySetInnerHTML={{ __html: 'Hardcoded safe content' }} /> // ←
    should NOT trigger
  </div>
);
