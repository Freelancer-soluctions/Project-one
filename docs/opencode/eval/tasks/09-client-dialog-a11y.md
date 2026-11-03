# TASK-09 — Fix dialog accessibility

## Task ID & Title

`TASK-09` — Fix the missing accessible name and focus return on a shadcn/ui dialog
used in the client.

## Scope

- **Goal:** the dialog has an accessible name, traps focus, and returns focus to
  the trigger on close; a React Testing Library test asserts it.
- **In scope:** the one composed dialog component and its test.
- **Out of scope:** redesigning the dialog, restyling Tailwind classes beyond the
  fix, other dialogs, e2e coverage.
- **Affected apps:** client.

## Inputs

- The composed shadcn dialog component and an existing RTL test helper.
- `docs/code-review-checklist.md` accessibility expectations.

## Steps expected

1. grill-me — where the name comes from (title vs `aria-label`), whether focus
   return is Base UI's job or ours, which query to assert with.
2. spec — `client-accessibility` delta: accessible name, focus trap, focus return.
3. review — reviewer checks the assertions are user-centric (`getByRole`).
4. implement — component fix + RTL test using `user-event`.
5. verify — client test run for the dialog test; lint clean.
6. commit — `fix(client)` commit, signed, DCO signoff.
7. Trello — card created and linked.

## Expected artifacts

- OpenSpec change with a `client-accessibility` delta.
- Component diff + RTL test.
- Test output proving the name is exposed and focus returns to the trigger.
- One signed commit; one Trello card id.

## Acceptance criteria

- [ ] `getByRole('dialog', { name: ... })` resolves without `aria-label` hacks.
- [ ] Focus returns to the trigger after close (asserted, not assumed).
- [ ] No unrelated visual/style change in the diff.
- [ ] Client tests and lint pass.
- [ ] Commit is conventional, signed, DCO-signed-off, and references the Trello card.

## Run notes

### Run A

_pending_

### Run B

_pending_
