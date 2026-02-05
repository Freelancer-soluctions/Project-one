Write-Host "▶ Running Semgrep SAST scan..." -ForegroundColor Cyan

docker run --rm `
  -v "${PWD}:/src" `
  -w /src `
  semgrep/semgrep:latest `
  semgrep scan `
    --config p/owasp-top-ten `
    --config p/owasp-top-ten `
    --config p/security-audit `
    --config p/secrets `
    --config p/sql-injection `
    --config="r/ajinabraham.njsscan.database.nosql_injection.node_nosqli_js_injection" `
    --config="r/ajinabraham.njsscan.database.nosql_find_injection.node_nosqli_injection" `
    --config p/command-injection `
    --config p/jwt `
    --config p/auth `
    --config="r/javascript.node-crypto.security.gcm-no-tag-length.gcm-no-tag-length" `
    --config p/http-security `
    --config p/expressjs `
    --config p/nodejs `
    --config p/javascript `
    --config p/react-security `
    --config p/react `
    --config p/xss `
    --config p/dom-security `
    --config p/best-practices `
    --config p/bug-risk `

