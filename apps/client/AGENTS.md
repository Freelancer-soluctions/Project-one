# Client - React Frontend

React 18 app with Vite, Tailwind, shadcn/ui, Redux Toolkit, RTK Query.

## Commands

```bash
npm run dev              # Dev server (port 5173)
npm run build            # Production build
npm run storybook        # Storybook (port 6006)
npm run test             # Vitest watch mode
npm run test:run        # Run tests once
npm run test:coverage   # Coverage report
```

## Testing

See root [docs/testing-architecture.md](../../docs/testing-architecture.md)

**Key patterns:**

- Unit tests: `*.unit.test.jsx` (vi.mock, no MSW, no Redux)
- Integration tests: `*.integration.test.jsx` (MSW + Redux real)
- MSW setup: `tests/setup/msw/server.js`

```bash
# Single test
npx vitest run src/components/Button.unit.test.jsx
```

## Path Alias

Use `@/` for `src/` imports:

```javascript
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
```
