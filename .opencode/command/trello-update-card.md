---
description: Update or move a Trello card via Composio Trello API
---

## Guide: Update a Trello Card

Updates a card by parsing `$ARGUMENTS` as `key:"value"` pairs. Uses `.opencode/trello-context.json` to resolve names to IDs.

## Arguments

| Key | Required | Description |
|-----|----------|-------------|
| `card` | ✅ | Card name or shortLink (e.g. "abc123") |
| `list` | - | Move to list (resolved by name → ID) |
| `name` | - | New title |
| `desc` | - | New description |
| `due` | - | New due date (ISO 8601) |
| `pos` | - | "top", "bottom", or number |
| `labels` | - | Comma-separated label names (replaces all) |
| `members` | - | Comma-separated usernames (replaces all) |
| `closed` | - | "true" to archive, "false" to unarchive |

> **Note:** Omitted fields keep their current value. Use `labels` or `members` only when you want to REPLACE all existing ones.

## Tool: TRELLO_UPDATE_CARDS_BY_ID_CARD

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `idCard` | string | ✅ | Card ID or shortLink |
| `idList` | string | No | Move to list |
| `name` | string | No | New title |
| `desc` | string | No | New description |
| `due` | string | No | ISO 8601 date |
| `pos` | string | No | "top", "bottom", or float |
| `idLabels` | string | No | Comma-separated label IDs |
| `idMembers` | string | No | Comma-separated member IDs |
| `closed` | string | No | "true" or "false" |

## Flow

1. If `card:` is a shortLink (8 chars), use it as idCard. If it's a name, find via TRELLO_GET_SEARCH.
2. If `list:` specified, resolve name → ID (context → if not, TRELLO_GET_BOARDS_LISTS_BY_ID_BOARD).
3. If `labels:` specified, resolve names → IDs (context → if not, TRELLO_GET_BOARDS_BY_ID_BOARD).
4. If `members:` specified, resolve usernames → IDs (context → if not, TRELLO_GET_BOARDS_BY_ID_BOARD).
5. Execute TRELLO_UPDATE_CARDS_BY_ID_CARD with resolved IDs.
6. Return confirmation with card URL.

> **Optimization:** Use TRELLO_GET_SEARCH to find a card by name instead of enumerating the board.

## Examples

```
/trello-update-card card:"CSH9VRvs" name:"Updated title"
/trello-update-card card:"Implement login" list:"In Progress"
/trello-update-card card:"Bug fix" list:"Done" labels:"Verified on staging"
/trello-update-card card:"Old task" closed:"true"
```

If `$ARGUMENTS` is empty, show available lists/labels/members from the context file.
