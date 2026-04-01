# E2E - End-to-End Tests

Playwright E2E tests for the full application.

## Commands

```bash
npm run test                # Run Playwright tests
npx playwright test        # Alternative
npx playwright --ui        # Interactive UI mode
npx playwright show-report  # View last report
```

## Configuration

`playwright.config.js` auto-starts:

- Client: http://localhost:3000
- Server: http://localhost:4000

baseURL: http://localhost:3000

## Testing

Tests go in `tests/` directory.

```bash
# Run specific test file
npx playwright test tests/example.spec.js

# Run with headed browser
npx playwright test --headed
```
