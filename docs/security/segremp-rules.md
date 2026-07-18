# Semgrep Security Rules Definition

## Overview

This document describes the **Semgrep security rules configuration** used in this repository to perform **Static Application Security Testing (SAST)** following a **Shift-Left security strategy**.

Semgrep scans the source code to detect common vulnerabilities during development and CI pipelines, allowing issues to be detected **before reaching production**.

The rules implemented focus primarily on **JavaScript, Node.js, Express, and React applications** and are aligned with security categories inspired by the **OWASP Top 10**.

---

# Security Rule Categories

## Broken Access Control

Rules that detect improper authorization validation, unsafe redirects, or filesystem access issues.

* `javascript.browser.security.open-redirect.js-open-redirect`
* `javascript.browser.security.open-redirect-from-function.js-open-redirect-from-function`
* `javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage`
* `javascript.express.security.audit.express-check-directory-listing.express-check-directory-listing`
* `javascript.express.security.audit.express-open-redirect.express-open-redirect`
* `javascript.express.security.audit.express-path-join-resolve-traversal.express-path-join-resolve-traversal`
* `javascript.express.security.audit.possible-user-input-redirect.unknown-value-in-redirect`
* `javascript.express.security.audit.res-render-injection.res-render-injection`
* `javascript.lang.security.audit.detect-non-literal-fs-filename.detect-non-literal-fs-filename`
* `javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal`
* `javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring`
* `javascript.lang.security.detect-no-csrf-before-method-override.detect-no-csrf-before-method-override`
* `javascript.lang.security.insecure-object-assign.insecure-object-assign`
* `typescript.react.security.audit.react-jwt-decoded-property.react-jwt-decoded-property`
* `typescript.react.security.audit.react-jwt-in-localstorage.react-jwt-in-localstorage`

---

## Broken Authentication

Rules detecting weak session management and insecure authentication configurations.

* `javascript.express.security.audit.express-cookie-settings.express-cookie-session-default-name`
* `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-domain`
* `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-expires`
* `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-httponly`
* `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-path`
* `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-secure`
* `javascript.express.security.audit.express-jwt-not-revoked.express-jwt-not-revoked`
* `javascript.express.security.audit.remote-property-injection.remote-property-injection`
* `javascript.jsonwebtoken.security.audit.jwt-exposed-data.jwt-exposed-data`

---

## Cross-Site Scripting (XSS)

Rules that detect unsafe HTML rendering and DOM manipulation vulnerabilities.

* `javascript.audit.detect-replaceall-sanitization.detect-replaceall-sanitization`
* `javascript.browser.decoded-xss.decoded-xss`
* `javascript.browser.security.dom-based-xss.dom-based-xss`
* `javascript.browser.security.insecure-document-method.insecure-document-method`
* `javascript.browser.security.insecure-innerhtml.insecure-innerhtml`
* `javascript.browser.security.raw-html-concat.raw-html-concat`
* `javascript.browser.security.raw-html-join.raw-html-join`
* `javascript.express.security.audit.xss.direct-response-write.direct-response-write`
* `javascript.express.security.audit.xss.mustache.escape-function-overwrite.escape-function-overwrite`
* `javascript.express.security.injection.raw-html-format.raw-html-format`
* `javascript.lang.security.audit.unknown-value-with-script-tag.unknown-value-with-script-tag`
* `typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml`
* `typescript.react.security.audit.react-href-var.react-href-var`
* `typescript.react.security.audit.react-unsanitized-method.react-unsanitized-method`
* `typescript.react.security.audit.react-unsanitized-property.react-unsanitized-property`
* `typescript.react.security.react-markdown-insecure-html.react-markdown-insecure-html`

---

## Cryptographic Failures

Rules detecting insecure cryptographic practices or weak encryption usage.

* `javascript.jsonwebtoken.security.jwt-none-alg.jwt-none-alg`
* `javascript.lang.security.audit.md5-used-as-password.md5-used-as-password`
* `javascript.lang.security.detect-pseudorandombytes.detect-pseudoRandomBytes`
* `javascript.node-crypto.security.aead-no-final.aead-no-final`
* `javascript.node-crypto.security.gcm-no-tag-length.gcm-no-tag-length`
* `problem-based-packs.insecure-transport.js-node.using-http-server.using-http-server`
* `typescript.react.security.react-insecure-request.react-insecure-request`

---

## Identification and Authentication Failures

Rules identifying insecure secrets or misconfigured authentication mechanisms.

* `javascript.express.security.audit.express-session-hardcoded-secret.express-session-hardcoded-secret`
* `javascript.express.security.cors-misconfiguration.cors-misconfiguration`
* `javascript.express.security.express-jwt-hardcoded-secret.express-jwt-hardcoded-secret`
* `javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret`
* `javascript.lang.security.audit.hardcoded-hmac-key.hardcoded-hmac-key`

---

## Injection

Rules detecting unsafe code execution, command injection, template injection, or SQL injection patterns.

* `javascript.audit.detect-replaceall-sanitization.detect-replaceall-sanitization`
* `javascript.browser.security.insecure-document-method.insecure-document-method`
* `javascript.browser.security.insecure-innerhtml.insecure-innerhtml`
* `javascript.browser.security.raw-html-concat.raw-html-concat`
* `javascript.browser.security.raw-html-join.raw-html-join`
* `javascript.express.security.audit.xss.direct-response-write.direct-response-write`
* `javascript.express.security.audit.xss.mustache.escape-function-overwrite.escape-function-overwrite`
* `javascript.express.security.express-insecure-template-usage.express-insecure-template-usage`
* `javascript.express.security.express-sandbox-injection.express-sandbox-code-injection`
* `javascript.express.security.injection.raw-html-format.raw-html-format`
* `javascript.express.security.injection.tainted-sql-string.tainted-sql-string`
* `javascript.lang.security.audit.code-string-concat.code-string-concat`
* `javascript.lang.security.audit.dangerous-spawn-shell.dangerous-spawn-shell`
* `javascript.lang.security.audit.detect-non-literal-require.detect-non-literal-require`
* `javascript.lang.security.audit.incomplete-sanitization.incomplete-sanitization`
* `javascript.lang.security.audit.spawn-shell-true.spawn-shell-true`
* `javascript.lang.security.audit.unknown-value-with-script-tag.unknown-value-with-script-tag`
* `javascript.lang.security.audit.unsafe-dynamic-method.unsafe-dynamic-method`
* `javascript.lang.security.detect-child-process.detect-child-process`
* `javascript.lang.security.detect-disable-mustache-escape.detect-disable-mustache-escape`
* `javascript.lang.security.detect-eval-with-expression.detect-eval-with-expression`
* `javascript.lang.security.html-in-template-string.html-in-template-string`
* `javascript.lang.security.spawn-git-clone.spawn-git-clone`
* `javascript.playwright.security.audit.playwright-exposed-chrome-devtools.playwright-exposed-chrome-devtools`
* `typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml`
* `typescript.react.security.audit.react-href-var.react-href-var`
* `typescript.react.security.audit.react-unsanitized-method.react-unsanitized-method`
* `typescript.react.security.audit.react-unsanitized-property.react-unsanitized-property`
* `typescript.react.security.react-markdown-insecure-html.react-markdown-insecure-html`

---

## Insecure Deserialization

* `javascript.express.security.audit.express-third-party-object-deserialization.express-third-party-object-deserialization`

---

## Insecure Design

Rules identifying insecure architectural or configuration patterns.

* `javascript.express.security.audit.express-cookie-settings.express-cookie-session-default-name`
* `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-domain`
* `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-expires`
* `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-httponly`
* `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-path`
* `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-secure`
* `javascript.express.security.audit.express-jwt-not-revoked.express-jwt-not-revoked`
* `javascript.express.security.audit.express-res-sendfile.express-res-sendfile`
* `javascript.express.security.audit.remote-property-injection.remote-property-injection`
* `javascript.express.security.x-frame-options-misconfiguration.x-frame-options-misconfiguration`
* `javascript.jsonwebtoken.security.audit.jwt-exposed-data.jwt-exposed-data`

---

## Security Misconfiguration

* `javascript.express.security.audit.express-check-directory-listing.express-check-directory-listing`
* `javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp`
* `javascript.lang.security.audit.detect-redos.detect-redos`

---

## Sensitive Data Exposure

* `javascript.jsonwebtoken.security.jwt-none-alg.jwt-none-alg`
* `javascript.lang.security.audit.md5-used-as-password.md5-used-as-password`
* `problem-based-packs.insecure-transport.js-node.bypass-tls-verification.bypass-tls-verification`
* `problem-based-packs.insecure-transport.js-node.disallow-old-tls-versions1.disallow-old-tls-versions1`
* `problem-based-packs.insecure-transport.js-node.disallow-old-tls-versions2.disallow-old-tls-versions2`
* `problem-based-packs.insecure-transport.js-node.ftp-request.ftp-request`
* `problem-based-packs.insecure-transport.js-node.http-request.http-request`
* `typescript.react.security.react-insecure-request.react-insecure-request`

---

## Server-Side Request Forgery (SSRF)

* `javascript.chrome-remote-interface.security.audit.chrome-remote-interface-compilescript-injection.chrome-remote-interface-compilescript-injection`
* `javascript.express.security.audit.express-ssrf.express-ssrf`
* `javascript.express.security.express-phantom-injection.express-phantom-injection`
* `javascript.phantom.security.audit.phantom-injection.phantom-injection`
* `javascript.playwright.security.audit.playwright-addinitscript-code-injection.playwright-addinitscript-code-injection`
* `javascript.playwright.security.audit.playwright-evaluate-arg-injection.playwright-evaluate-arg-injection`
* `javascript.playwright.security.audit.playwright-evaluate-code-injection.playwright-evaluate-code-injection`
* `javascript.playwright.security.audit.playwright-goto-injection.playwright-goto-injection`
* `javascript.playwright.security.audit.playwright-setcontent-injection.playwright-setcontent-injection`

---

## Software and Data Integrity Failures

* `javascript.browser.security.insufficient-postmessage-origin-validation.insufficient-postmessage-origin-validation`
* `javascript.browser.security.wildcard-postmessage-configuration.wildcard-postmessage-configuration`
* `javascript.express.security.audit.express-third-party-object-deserialization.express-third-party-object-deserialization`
* `javascript.express.security.express-data-exfiltration.express-data-exfiltration`
* `javascript.lang.security.audit.prototype-pollution.prototype-pollution-assignment.prototype-pollution-assignment`
* `javascript.lang.security.audit.prototype-pollution.prototype-pollution-loop.prototype-pollution-loop`
* `javascript.lang.security.audit.sqli.node-postgres-sqli.node-postgres-sqli`

---

## Vulnerable and Outdated Components

* `javascript.express.security.audit.express-detect-notevil-usage.express-detect-notevil-usage`

---

## Security Strategy

The implemented rules support a **Shift-Left Security approach**, meaning vulnerabilities are detected as early as possible in the development lifecycle:

1. Local development scanning
2. Pre-commit hooks
3. Continuous Integration (CI) security stages
4. Security review before deployment

This strategy helps reduce the cost and impact of vulnerabilities by identifying them **before code reaches production environments**.
