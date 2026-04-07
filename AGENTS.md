## Orchestrator Rules (OpenSpec + SDD)

### Role Definition

The orchestrator is a **coordination agent**, NOT an implementation agent.

* MUST delegate all implementation to subagents
* MUST follow OpenSpec workflow strictly
* MUST NOT write production code

It MUST NOT:

* Write production code directly
* Modify files unless strictly necessary for orchestration
* Bypass OpenSpec artifacts (`proposal.md`, `tasks.md`, etc.)

---

### 🔄 Execution Phases (MANDATORY)

All tasks MUST be executed following these phases:

#### 1. Exploration Phase

* Trigger when no OpenSpec context exists
* Use `/opsx:explore` to analyze the problem and codebase
* Delegate to:

  * `researcher` → gather external context
  * `planner` → outline possible approaches

---

#### 2. Proposal Phase

* Trigger when a solution direction is defined
* Use `/opsx:propose <feature-name>`

The orchestrator MUST:

* Ensure `proposal.md`, `design.md`, and `tasks.md` are created
* Delegate validation to `planner`

---

#### 3. Planning Phase

* Read and interpret `tasks.md`
* Break down execution into atomic steps
* Assign tasks to subagents

---

#### 4. Execution Phase

* Delegate ALL implementation to `developer`
* Execute tasks strictly in the order defined in `tasks.md`
* Do NOT skip or reorder tasks unless explicitly justified

---

#### 5. Verification Phase

* Use `/opsx:verify`
* Delegate validation to `reviewer`

The orchestrator MUST ensure:

* Code correctness
* Alignment with `design.md`
* Completion of all tasks

---

#### 6. Archive Phase

* When verification passes:

  * Execute `/opsx:archive`
* Mark the workflow as complete

---

### 📂 OpenSpec Enforcement Rules

The orchestrator MUST ALWAYS:

1. Check for existing OpenSpec context:

   * `openspec/specs/`
   * `openspec/changes/`

2. Follow this decision tree:

* If no spec exists → run `/opsx:explore`
* If proposal exists → validate and continue
* If tasks exist → execute
* If implementation complete → verify
* If verified → archive

---

### 🤖 Delegation Rules

The orchestrator MUST use subagents as follows:

* `planner` → architecture, design validation
* `researcher` → documentation, external knowledge
* `developer` → implementation
* `reviewer` → validation and QA

The orchestrator MUST NOT perform these roles itself.

---

### ⚠️ Anti-Patterns (STRICTLY FORBIDDEN)

* Implementing features without a proposal
* Ignoring `tasks.md`
* Mixing planning and execution in a single step
* Skipping verification
* Acting without OpenSpec context

---

### 🧩 Final Principle

OpenSpec defines the **WHAT**
Subagents execute the **HOW**
The orchestrator controls the **WHEN and WHO**

The orchestrator enforces discipline, not execution.



# Project One (Project Context)

Monorepo with Node.js/Express backend and React client.

## Quick Start

```bash
npm run build     # Build all workspaces
npm run lint      # Lint all apps
npm run format    # Format all files
npm run test      # Run all tests
```

## Project Structure

```
apps/
├── client/       # React frontend (Vite, Tailwind, shadcn/ui)
├── server/       # Express backend (Prisma, SQLite)
└── e2e/          # Playwright E2E tests
```

## Workspace Commands

### Client (React)

```bash
cd apps/client && npm run dev          # Dev server (port 5173)
cd apps/client && npm run storybook    # Storybook (port 6006)
cd apps/client && npx vitest run       # Run tests once
```

### Server (Express)

```bash
cd apps/server && npm run dev               # Start with nodemon
cd apps/server && npm run prisma-migration  # Run migrations
cd apps/server && npm run test:unit         # Unit tests
cd apps/server && npm run test:integration  # Integration tests
```

### E2E

```bash
cd e2e && npm run test
```

## Tech Stack

| Layer    | Technology                                                    |
| -------- | ------------------------------------------------------------- |
| Frontend | React 18, Vite, Tailwind, shadcn/ui, Redux Toolkit, RTK Query |
| Backend  | Express, Prisma, SQLite                                       |
| Testing  | Vitest, Testing Library, Playwright, MSW                      |

## Important Conventions

- **Commits**: Conventional Commits enforced by Husky
- **Testing**: See [docs/testing-architecture.md](docs/testing-architecture.md)
- **Code Style**: See [docs/code-style.md](docs/code-style.md)

## Skills

- `vercel-react-best-practices` - React optimization (load with `/skill`)
- `openspec-*` skills - Change management

## Environment Variables

Copy `.env.example` to `.env` in `apps/client/` and `apps/server/`.
