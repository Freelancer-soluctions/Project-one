// XSS via DOM intermediate variable (CWE-79) test fixtures - vulnerable case
// vulnerable: should trigger the rule (dangerouslySetInnerHTML with intermediate user-controlled variable)
const userValue = req.query.theme; // uncontrolled user input from query string

// VULNERABLE: intermediate variable from user input passed to dangerouslySetInnerHTML
const ComponentVuln = () => (
  <div>
    <span dangerouslySetInnerHTML={{ __html: userValue }} /> // ← this should
    trigger the rule (user-controlled intermediate)
  </div>
);
