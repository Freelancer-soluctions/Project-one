---
description: Create a Trello card via Composio Trello API
---

## Guide: Create a Trello Card

Creates a card by parsing `$ARGUMENTS` as `key:"value"` pairs. Uses `.opencode/trello-context.json` to resolve names to IDs.

## Arguments

Parse as `key:"value"` pairs:

| Key | Required | Default | Description |
|-----|----------|---------|-------------|
| `name` | ✅ | - | Card title |
| `list` | - | "Backlog" | Target list name |
| `board` | - | `defaultBoard` from context | Board alias in context file |
| `desc` | - | - | Description (0-16384 chars) |
| `due` | - | - | ISO 8601 date (e.g. "2026-06-01T23:59:59.999Z") |
| `pos` | - | "bottom" | Position: "top", "bottom", or number |
| `labels` | - | - | Comma-separated label names |
| `members` | - | - | Comma-separated usernames |

## Tool: TRELLO_ADD_CARDS

Creates the card. Parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `idList` | string | ✅ | List ID (24-char hex) |
| `name` | string | Recommended | Card title |
| `desc` | string | No | Description |
| `due` | string | No | ISO 8601 date |
| `pos` | string | No | "top", "bottom", or float |
| `idLabels` | string | No | Comma-separated label IDs |
| `idMembers` | string | No | Comma-separated member IDs |
| `subscribed` | string | No | "true" to subscribe creator |

## Flow

1. Read `.opencode/trello-context.json` → get `defaultBoard` ID and its lists/labels/members.
2. If `board:` is specified and different, look it up in context file. If not found, resolve dynamically via TRELLO_GET_MEMBERS_BOARDS_BY_ID_MEMBER.
3. Resolve `list:` name → ID (lookup in context → if not found, TRELLO_GET_BOARDS_LISTS_BY_ID_BOARD).
4. Resolve `labels:` names → IDs (from context → if not, TRELLO_GET_BOARDS_BY_ID_BOARD with labels).
5. Resolve `members:` usernames → IDs (from context → if not, TRELLO_GET_BOARDS_BY_ID_BOARD with members).
6. Execute TRELLO_ADD_CARDS with resolved IDs.
7. Return short URL and confirmation.

> **Optimization:** To find existing cards by name, use TRELLO_GET_SEARCH (1 call) instead of enumerating the whole board.

## Examples

```
/trello-create-card name:"Implement login" list:"Sprint Backlog" desc:"Add JWT auth"
/trello-create-card name:"Bug fix" list:"In Progress" labels:"Bugs" members:"johangarcia6"
/trello-create-card name:"Release v2" list:"Done" due:"2026-06-15" pos:"top"
```

If `$ARGUMENTS` is empty, show available boards/lists/labels/members from the context file.
