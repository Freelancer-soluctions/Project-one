# Phase 2 — Knip Baseline (verified 2026-09-22, knip 6.32.2; re-verified Tasks 1.1–1.2, 2026-09-22)

Re-verification (Task 1.1): `npx knip --workspace=apps/client --no-progress` from
repo root, knip 6.32.2 — human-readable + `--reporter json` agree exactly
(files 24, deps 10, devDeps 4, exports 74, duplicates 3, unlisted/binaries/types 0;
gate 112), exit 1 (FAIL). No drift since the snapshot below; no ignore changes made
(false-positive triage deferred to Task 1.3).

Re-verification (Task 1.2): `npx knip --workspace=apps/server --no-progress` from
repo root, knip 6.32.2 — human-readable + `--reporter json` (issues[] aggregation)
agree exactly (files 35, deps 4, devDeps 2, exports 54, duplicates 2,
unlisted/binaries/types 0; gate 95), exit 1 (FAIL). No drift since the snapshot
below; no ignore changes made (false-positive triage deferred to Task 1.3).

Commands (from repo root):

```bash
npx knip --workspace=apps/client --no-progress
npx knip --workspace=apps/server --no-progress
```

Both workspaces exit non-zero (FAIL / blocking after promotion of dead-code jobs).

## apps/client — 112 gate findings + 3 duplicate-export hints (exit 1)

| Category                                               | Count                                             |
| ------------------------------------------------------ | ------------------------------------------------- |
| Unused files                                           | 24                                                |
| Unused dependencies                                    | 10                                                |
| Unused devDependencies                                 | 4                                                 |
| Unused exports                                         | 74                                                |
| Duplicate exports (rule `duplicates: off`, hints only) | 3                                                 |
| Unlisted binaries                                      | 0                                                 |
| Unlisted devDependencies                               | 0                                                 |
| Unused exported types                                  | 0                                                 |
| Configuration hints                                    | 0 (not emitted with `--workspace` flag from root) |

Gate total (files + deps + devDeps + exports): **24 + 10 + 4 + 74 = 112**.

### Unused files (24)

- apps/client/src/components/tiptap/MentionList.test.jsx
- apps/client/src/components/ui/carousel.jsx
- apps/client/src/components/ui/collapsible.jsx
- apps/client/src/hooks/useGetTranslation.js
- apps/client/src/modules/clientOrder/utils/index.js
- apps/client/src/modules/clientOrder/utils/schema.js
- apps/client/src/modules/events/utils/helpers.jsx
- apps/client/src/modules/expenses/schema.test.js
- apps/client/src/modules/home/components/Content.jsx
- apps/client/src/modules/home/components/index.js
- apps/client/src/modules/home/components/UpcomingEvents.jsx
- apps/client/src/modules/notes/constant/enums/enums.js
- apps/client/src/modules/providerOrder/api/clientOrderApi.js
- apps/client/src/modules/providerOrder/pages/ClientOrder.jsx
- apps/client/src/modules/settings/components/SettingsProfile.jsx
- apps/client/src/modules/settings/components/SettingsTabs.jsx
- apps/client/src/services/api.js
- apps/client/src/services/axiosService.js
- apps/client/src/utils/helpers.js
- apps/client/src/utils/objectToFormData.js
- apps/client/src/utils/utils.js
- apps/client/tests/setup/i18n-mock.js
- apps/client/tests/setup/setupTest.unit.js
- apps/client/tests/setup/test-utils.js

### Unused dependencies (10)

- @radix-ui/react-collapsible
- @tanstack/react-query
- @tanstack/react-query-devtools
- add
- command
- date-fns-tz
- embla-carousel-autoplay
- embla-carousel-react
- quill
- shadcn-ui

### Unused devDependencies (4)

- @chromatic-com/storybook
- @storybook/addon-docs
- globals
- why-is-node-running

### Unused exports (74)

shadcn/ui re-exports (28): AlertDialogPortal, AlertDialogOverlay, AlertTitle,
badgeVariants, CalendarDayButton, CommandSeparator, DialogPortal, DialogOverlay,
DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel,
DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup,
DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent,
DropdownMenuSubTrigger, DropdownMenuRadioGroup, useFormField, PopoverAnchor,
SelectGroup, SelectLabel, SelectSeparator, SelectScrollUpButton,
SelectScrollDownButton, TableFooter, TableCaption, toggleVariants, reducer
(use-toast.js).

App code (46): fieldLimits.js default, zod-i18n.js default + i18n, useFetch,
useInitializeI18n, useGetAllAttendanceQuery, SignUpApi, updateAuthData,
useGetAllClientOrderQuery + default, useGetAllClientsQuery,
useGetAllEmployeesQuery, AttendButton, AttendeeList, MAX_PAGE_SIZE,
EventModalityCodes, EventsDialogSchema, useGetAllExpensesQuery,
expenseCategoryEnumValues, EventCalendar, inventoryMovementAPI,
adaptQueryStatus, useGetAllPayrollQuery, useGetAllPerformanceEvaluationsQuery,
useGetAllPermissionsQuery, useGetAllProductsQuery, currencyFormatter,
useGetAllProviderOrdersQuery + default, useGetAllProvidersQuery,
ProvidersCodes, PatchSettingsById, SettingsProductCategoriesDialog,
SettingsProductCategoriesBasicInfo,
SettingsProductCategoriesDialog (component), useLazyGetStockByProductIdQuery,
useCreateUserMutation, UsersDialog, useGetAllVacationsQuery,
useGetAllWarehousesQuery, SERVER_EVENTS, CLIENT_EVENTS, createMentionPayload,
getToken.

### Duplicate exports (3, hints only)

- FIELD_LIMITS|default (config/fieldLimits.js)
- inventoryMovementAPI|default (inventoryMovementAPI.js)
- SERVER_EVENTS|EVENTS (services/socketService.js)

## apps/server — 95 gate findings + 2 duplicate-export hints (exit 1)

| Category                                               | Count                                             |
| ------------------------------------------------------ | ------------------------------------------------- |
| Unused files                                           | 35                                                |
| Unused dependencies                                    | 4                                                 |
| Unused devDependencies                                 | 2                                                 |
| Unused exports                                         | 54                                                |
| Duplicate exports (rule `duplicates: off`, hints only) | 2                                                 |
| Unlisted binaries                                      | 0                                                 |
| Unlisted devDependencies                               | 0                                                 |
| Unused exported types                                  | 0                                                 |
| Configuration hints                                    | 0 (not emitted with `--workspace` flag from root) |

Gate total (files + deps + devDeps + exports): **35 + 4 + 2 + 54 = 95**.

### Unused files (35)

- apps/server/ecosystem.config.js
- apps/server/src/config/aws/secrets.js
- apps/server/src/docs/schemas.js
- apps/server/src/modules/clientOrder/{controller,dao,routes,service}.js (4)
- apps/server/src/modules/providerOrder/{controller,dao,routes,service}.js (4)
- apps/server/src/modules/providerOrder/schemas/providerOrder.joi.js
- apps/server/src/modules/users/constants/users.js
- apps/server/src/socket/levels/level-01-conceptos.js
- apps/server/src/socket/levels/level-03-client.js
- apps/server/src/socket/levels/level-04-auth.js
- apps/server/src/socket/levels/level-05-rooms.js
- apps/server/src/socket/levels/level-06-events.js
- apps/server/src/socket/levels/level-07-integration.js
- apps/server/src/socket/levels/level-08-offline.js
- apps/server/src/socket/levels/level-09-hardening-client.js
- apps/server/src/socket/levels/level-09-hardening-server.js
- apps/server/src/socket/levels/level-10-wss.js
- apps/server/src/socket/levels/level-11-scale.js
- apps/server/src/utils/cloudinary/cloudinary.js
- apps/server/src/utils/joiSchemas/joi.js
- apps/server/src/utils/prisma-dinamic-service/service.js
- apps/server/src/utils/responses&Errors/globalErrorResponse.js
- apps/server/test-sanitize.js
- apps/server/test-sanitize.mjs
- apps/server/tests/orphans/bin/server.test.js
- apps/server/tests/orphans/role.test.js
- apps/server/tests/orphans/users-path-param-validation.test.js
- apps/server/tests/test-server.js
- apps/server/tests/unit/manual-test.js

### Unused dependencies (4)

- cloudinary
- knex
- socket.io-client
- vite

### Unused devDependencies (2)

- @prisma/language-server
- why-is-node-running

### Unused exports (54)

Middleware: migrateExistingData, testEncryption, loginLimiterEnhanced,
changePasswordLimiter, forgotPasswordLimiter, validateNumericPathParam default,
verifyCsrfOld, checkRoleAuth. Modules: updateAttendanceById, logOut,
changePassword, getUserById (auth dao), saveRefreshToken, createAuditLog,
RegisterParamsSchema, validateEventModality, News (joi), findHashtagByName,
findHashtagById, getNoteHashtags, getAllProductProviders, updateById (products
service), SettingsLanguagePartial, SettingsDisplayPartial,
SettingsProductCategoryCreatePartial, SettingsProductCategoryFiltersPartial,
getUserByEmail, UserStatus, UserStatusUpdate, UserStatusArray, User, UserUpdate,
Role, RoleUpdate, RoleArray, getUserRoleByCode. Socket: createMentionNewPayload,
createMentionReadPayload, mentionBatchSchema, leaveUserRoom,
getActiveUserSockets, isUserOnline, getActiveRoomCount. Utils: roles, HTTPCodes,
PRODUCTSSTATUSCODE, createTokenOld, createRefreshTokenOld, createRefreshToken,
getRow, createManyRows, excludefromObject, excludefromArray. Tests:
createRequest.

### Duplicate exports (2, hints only)

- validateNumericPathParam|default
- createRequest|default (tests/smoke/helpers/request.js)

## Notes

- Counts verified via both human-readable and `--reporter json` output; JSON
  aggregation matches the printed section headers exactly.
- Prior baseline in `tasks.md` §3 (52 client / 67 server findings, with unlisted
  binaries 2/3 and config hints 17/9) was recorded from `npx knip --no-progress`
  run **inside** each workspace dir; the delegated `--workspace` invocation from
  the repo root emits no `Unlisted binaries` / `Configuration hints` sections,
  so those categories are 0 here. Gate finding totals are therefore higher
  (112 vs 52 client; 95 vs 67 server) — same underlying dead code, different
  reporter scope, plus dependency drift since the earlier snapshot.
- `duplicates` rule is `off` in both knip.json files; duplicate-export lines are
  informational and excluded from gate totals.
- Existing `ignore` / `ignoreDependencies` / `ignoreBinaries` entries in
  `apps/client/knip.json` and `apps/server/knip.json` retained; false-positive
  triage deferred to Task 1.3.
- Task 1.2 false-positive candidates (server, for Task 1.3 triage — NOT fixed here):
  flagged paths that match existing `ignore` globs yet are still reported under
  the `--workspace`-from-root scope: `src/socket/levels/**` (10 level files),
  `src/docs/schemas.js` (`src/docs/**`), `tests/**` (3 orphans + `test-server.js`
  - `unit/manual-test.js`, plus `tests/smoke/helpers/request.js` `createRequest`
    export); devDeps `@prisma/language-server` + `why-is-node-running` flagged
    despite being listed in `ignoreDependencies`. Likely a `--workspace` scope
    artifact in how ignore globs resolve — triage in Task 1.3.
