# Spec Delta

## Purpose

Enable the permission-grant success path of `checkRoleAuthOrPermisssion`: the middleware reads a nonexistent property (`rolePermits`) while the DAO returns `permits`, making `hasSomePermission` always false and 403ing every non-ADMIN on permission-guarded routes. The fix restores the designed role+permission authorization — gated by product sign-off because it changes runtime authorization from 403 to access.

## ADDED Requirements

### Requirement: The permission-grant path reads the real DAO relation

The success path of `checkRoleAuthOrPermisssion` SHALL read `user.permits` (the relation included by `users/dao.getUserRoleByUserId`: `permits: { include: { permissions: true } }`) instead of the nonexistent `rolePermits`, and derive `rolePermissions` from `permits[].permissions.code`.

#### Scenario: non-ADMIN with the required permission is granted

- **WHEN** a non-ADMIN user whose `userPermits` include the required permission code requests a route guarded by `checkRoleAuthOrPermisssion({ permissions: [...] })`
- **THEN** `hasSomePermission` SHALL be true, `req.userRole` SHALL be assigned the verified role code, and `next()` SHALL be called
- **AND** the regression test SHALL be written against the DAO's real shape (`permits`, not the phantom `rolePermits`) and therefore fail on the pre-fix implementation — the red→green evidence SHALL be recorded in tasks

### Requirement: Missing permissions still fail closed

Users whose `permits` do NOT include any required permission code, or who have no `permits` at all, SHALL continue to receive 403 "Insufficient permissions for this operation" — the fix only un-breaks the grant path, it does not open access by default.

#### Scenario: non-ADMIN without the required permission is rejected

- **WHEN** a non-ADMIN user whose `permits` do not include the required permission code requests a permission-guarded route
- **THEN** the response SHALL be 403 (unchanged from pre-fix)

#### Scenario: non-ADMIN with no permits rows is rejected

- **WHEN** a non-ADMIN user with no `permits` rows requests a permission-guarded route
- **THEN** the response SHALL be 403 (unchanged from pre-fix)

### Requirement: Product sign-off gates the merge

The change SHALL NOT merge before (1) the production `userPermits`×`permissions`×`users` matrix is reviewed and (2) product confirms that holders of those permissions MUST access the affected routes (21 route files, 102 permission-guarded sites inventoried in tasks §1.2). Without sign-off the change stays implemented-on-branch with green tests.

#### Scenario: merge blocked without sign-off

- **WHEN** the inventory table and the matrix review are not recorded in tasks
- **THEN** the change SHALL remain un-merged despite green tests
- **AND** the blocking state SHALL be visible in tasks (1.1 unchecked)

### Requirement: Authorization delta is inventoried for post-deploy validation

The change SHALL document the affected routes (module, route, method, roles allowlist, required permissions, pre-fix state 403, post-fix state) as the validation baseline for deployment.

#### Scenario: inventory supports deploy validation

- **WHEN** the fix deploys
- **THEN** the inventory table SHALL allow verifying that each previously-403 route now grants access exactly to the roles/permissions the matrix declares
