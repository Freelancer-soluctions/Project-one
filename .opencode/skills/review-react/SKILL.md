---
name: review-react
description: >
  Conditional React checklist for code reviews: functional components, hook
  usage, prop drilling, accessibility, and error boundaries. Load when the
  review touches files under apps/client/ or any JSX/React code. Extracted from
  reviewer.md.
license: MIT
metadata:
  author: project-one
  version: '1.0'
---

# Review React — Conditional Checklist

Load this in addition to `review-code` when the review touches client code.

## Load triggers

Load when any of these is true for the changed files:

- Path is under `apps/client/` (`apps/client/src/**`).
- Extension is `.jsx` or `.tsx`.
- The file contains a React import, JSX syntax, or a hook call
  (`apps/client/src/**/*.{js,jsx,ts,tsx}`).

Detect with a glob or `grep -lE "from 'react'|useState|useEffect|<[A-Z][A-Za-z]*[ />]"`.

## The five checks

- **Functional components only** — no class components in new code; no
  `React.Component` inheritance.
- **Hook usage** — complete dependency arrays, cleanup in `useEffect`, no
  conditional hook calls, no hooks inside loops, and no state updates during
  render.
- **No prop drilling** — cross-cutting state goes through context or Redux
  (RTK); flag props passed through three or more intermediate components.
- **Accessibility** — semantic elements, `aria-*` labels on icon-only
  controls, keyboard navigation, focus visible, form labels tied to inputs.
- **Error boundaries** — new route-level or widget-level trees that can throw
  are wrapped, or the risk is explicitly accepted.

## Reporting

- CRITICAL: a crash path reachable by normal navigation, XSS via React escape
  hatches (coordinate with `review-security`).
- HIGH: broken hook dependency causing stale renders or a leak, inoperative
  keyboard path on a primary action.
- Every entry includes `file` and `line`.
