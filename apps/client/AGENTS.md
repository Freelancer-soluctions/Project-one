# Client — React Frontend

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

## Available Skills

Skills relevant to client-side development. Load with `/skill <name>`.

### Frontend Skills

| Skill | Description | URL |
|-------|-------------|-----|
| `vercel-react-best-practices` | React/Next.js performance optimization: waterfall elimination, bundle size, re-renders | [SKILL.md](../../.agents/skills/vercel-react-best-practices/SKILL.md) |
| `shadcn` | shadcn/ui: CLI components, theming, composition patterns, Tailwind integration | [SKILL.md](../../.agents/skills/shadcn/SKILL.md) |
| `tailwind-design-system` | Tailwind CSS v4: design tokens, component libraries, responsive patterns | [SKILL.md](../../.agents/skills/tailwind-design-system/SKILL.md) |
| `storybook` | Storybook stories, CSF 3.0, Args, Decorators, Parameters | [SKILL.md](../../.agents/skills/storybook/SKILL.md) |
| `modern-javascript-patterns` | ES6+ patterns: async/await, destructuring, functional programming, modules | [SKILL.md](../../.agents/skills/modern-javascript-patterns/SKILL.md) |

### Testing Skills

| Skill | Description | URL |
|-------|-------------|-----|
| `vitest` | Vitest config, test suites, mocks (vi.fn), code coverage, parallel execution | [SKILL.md](../../.agents/skills/vitest/SKILL.md) |
| `react-testing-library` | React Testing Library: user-centric queries, user-event, async utilities | [SKILL.md](../../.agents/skills/react-testing-library/SKILL.md) |
| `playwright-best-practices` | Playwright E2E: POM, API mocking, auth, accessibility, visual regression | [SKILL.md](../../.agents/skills/playwright-best-practices/SKILL.md) |
| `test-driven-development` | TDD: write test first, watch it fail, write minimal code to pass | [SKILL.md](../../.agents/skills/test-driven-development/SKILL.md) |

## Auto-invoke Skills (Client)

When performing these actions in the client, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
|--------|-------|
| Creating or updating shadcn/ui components | `shadcn` |
| Escribir o modificar historias Storybook | `storybook` |
| Fixing a bug or implementing a feature | `test-driven-development` |
| Optimizing React component rendering performance | `vercel-react-best-practices` |
| Refactoring legacy code to modern JavaScript patterns | `modern-javascript-patterns` |
| Styling components with Tailwind CSS classes | `tailwind-design-system` |
| Writing React component tests with Testing Library | `react-testing-library` |
| Writing unit/integration tests with Vitest | `vitest` |
