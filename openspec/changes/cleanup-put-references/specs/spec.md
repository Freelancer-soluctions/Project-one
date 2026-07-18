## ADDED Requirements

*None. This is a cleanup-only change with no new capabilities.*

## MODIFIED Requirements

*None. No spec-level behavior changes — only dead code removal and documentation fixes.*

## REMOVED Requirements

*None. No capabilities are removed.*

---

### Summary

This change does not alter any system behavior, API contracts, or specifications. All modifications are limited to:
- Dead code removal (duplicate Swagger JSDoc blocks)
- Documentation corrections (`@route PUT` → `@route PATCH`)
- Test code updates (`.put()` → `.patch()` with updated descriptions)

No spec-level requirements are added, modified, or removed.
