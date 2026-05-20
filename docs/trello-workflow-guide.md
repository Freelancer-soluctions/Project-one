# Trello Workflow Guide

> **This project uses OpenCode slash commands for Trello operations.**
> Commands live in `.opencode/command/` and read board data from `.opencode/trello-context.json`.
> The **project-manager** agent executes these commands when delegated by the orchestrator.
> **Always use `/trello-*` commands instead of calling Composio tools directly.**

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Workflow Commands](#2-workflow-commands)
3. [Board Context Registry](#3-board-context-registry)
4. [Agent Delegation Model](#4-agent-delegation-model)
5. [Composio Tools Reference](#5-composio-tools-reference)
6. [Optimization Strategies](#6-optimization-strategies)

---

## 1. Architecture Overview

```
              ┌──────────────────┐
              │   Orchestrator   │
              │  (coordinator)   │
              └──────┬───────────┘
                     │ delegates via @project-manager
                     ▼
        ┌────────────────────────┐
        │    project-manager     │
        │   (Trello agent)       │
        └───────────┬────────────┘
                    │ reads & executes
                    ▼
        ┌────────────────────────┐
        │  .opencode/command/    │
        │  trello-create-card.md │
        │  trello-update-card.md │
        │  trello-delete-card.md │
        └───────────┬────────────┘
                    │ resolves names→IDs via
                    ▼
        ┌────────────────────────┐
        │ .opencode/             │
        │ trello-context.json    │
        └───────────┬────────────┘
                    │ calls via
                    ▼
        ┌────────────────────────┐
        │   Composio Trello API  │
        │  (TRELLO_ADD_CARDS,    │
        │   TRELLO_UPDATE_CARDS, │
        │   TRELLO_DELETE_CARDS) │
        └────────────────────────┘
```

### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| **project-manager agent** | `opencode.jsonc` | AI agent that executes Trello commands |
| **Commands** | `.opencode/command/trello-*.md` | Instruction files the agent reads to know what to do |
| **Context file** | `.opencode/trello-context.json` | Board registry mapping names → Trello IDs |
| **Composio MCP** | MCP config | Actual Trello API connection via Composio |

---

## 2. Workflow Commands

Three commands cover the full card lifecycle:

| Command | File | Purpose |
|---------|------|---------|
| `/trello-create-card` | `trello-create-card.md` | Create a card in a list |
| `/trello-update-card` | `trello-update-card.md` | Update card fields or move between lists |
| `/trello-delete-card` | `trello-delete-card.md` | Permanently delete a card |

### 2.1 /trello-create-card

Creates a card by parsing `$ARGUMENTS` as `key:"value"` pairs.

```
/trello-create-card name:"Implement login" list:"Sprint Backlog" desc:"Add JWT auth"
/trello-create-card name:"Bug fix" list:"In Progress" labels:"Bugs" members:"johangarcia6"
```

**Flow:**
1. Read context file → get default board and its lists/labels/members
2. Resolve `list:` name → ID (context → fallback to Trello API)
3. Resolve `labels:` names → IDs
4. Resolve `members:` usernames → IDs
5. Execute `TRELLO_ADD_CARDS(idList, name, desc?, due?, idLabels?, idMembers?)`
6. Return card URL

### 2.2 /trello-update-card

Updates card fields or moves it to another list.

```
/trello-update-card card:"Implement login" list:"In Progress"
/trello-update-card card:"Bug fix" name:"Bug fix - completed" labels:"Verified on staging"
/trello-update-card card:"Old task" closed:"true"
```

**Flow:**
1. Find card by name or shortLink via `TRELLO_GET_SEARCH`
2. Resolve `list:` name → ID (context → fallback)
3. Resolve `labels:` / `members:` names → IDs
4. Execute `TRELLO_UPDATE_CARDS_BY_ID_CARD` with only the specified fields
5. Return confirmation

### 2.3 /trello-delete-card

Permanently deletes a card. If the card is open, archives it first.

```
/trello-delete-card card:"Implement login"
```

**Flow:**
1. Find card by name or shortLink
2. If card is open, archive it via `TRELLO_UPDATE_CARDS_BY_ID_CARD(closed:"true")`
3. Execute `TRELLO_DELETE_CARDS_BY_ID_CARD`
4. Return confirmation

---

## 3. Board Context Registry

File: `.opencode/trello-context.json`

Stores board mappings so commands can resolve friendly names to Trello IDs without hardcoding.

### Structure

```json
{
  "version": 1,
  "defaultBoard": "project-one",
  "boards": {
    "project-one": {
      "id": "663aa79b4bb80987bc775706",
      "lists": {
        "Backlog": "663aa79b4bb80987bc775707",
        "In Progress": "663aa79b4bb80987bc775709",
        "Done": "663aa79b4bb80987bc77570a"
      },
      "labels": {
        "Bugs": { "id": "663aa79b4bb80987bc7757bf", "color": "orange" },
        "Web": { "id": "663aa79b4bb80987bc7757d1", "color": "green" }
      },
      "members": {
        "johangarcia6": { "id": "6606187e712266870ad3e9a8", "fullName": "johan Garcia" }
      }
    }
  }
}
```

### Adding a new board

```json
"my-new-board": {
  "id": "board-id-here",
  "lists": {
    "To Do": "list-id-1",
    "Doing": "list-id-2",
    "Done": "list-id-3"
  }
}
```

If a board, list, label, or member is NOT in the context file, commands fall back to querying Trello dynamically via Composio — keeping them resilient and up-to-date.

---

## 4. Agent Delegation Model

The orchestrator delegates Trello work to the **project-manager** subagent.

### In the orchestrator prompt

```
@project-manager: /trello-create-card name:"Implement login" list:"Sprint Backlog"
@project-manager: /trello-update-card jwt-auth
@project-manager: /trello-delete-card jwt-auth
```

### In opencode.jsonc

```json
"project-manager": {
  "mode": "subagent",
  "model": "nvidia/minimaxai/minimax-m2.7",
  "description": "Handles Trello project-management workflows - card creation, updates, deletion, state transitions",
  "prompt": "{file:docs/opencode/prompts/project-manager.md}",
  "steps": 10,
  "tools": {
    "write": false,
    "edit": false,
    "bash": false
  }
}
```

### Orchestrator rules for project-manager

- Delegates `/trello-*` commands via `@project-manager: <command>`
- NEVER executes Trello operations directly
- Tracks workflow lifecycle and syncs with OpenSpec phases

---

## 5. Composio Tools Reference

Direct tool access (for reference, but prefer using commands).

### Card Operations

| Operation | Tool Slug | Required Params |
|-----------|-----------|----------------|
| Create card | `TRELLO_ADD_CARDS` | `idList` |
| Get card | `TRELLO_GET_CARDS_BY_ID_CARD` | `idCard` |
| Update card | `TRELLO_UPDATE_CARDS_BY_ID_CARD` | `idCard` |
| Delete card | `TRELLO_DELETE_CARDS_BY_ID_CARD` | `idCard` |
| Search cards | `TRELLO_GET_SEARCH` | `query` |
| Add comment | `TRELLO_ADD_CARDS_ACTIONS_COMMENTS_BY_ID_CARD` | `idCard`, `text` |
| Add label | `TRELLO_ADD_CARDS_ID_LABELS_BY_ID_CARD` | `idCard`, `value` |
| Assign member | `TRELLO_ADD_MEMBER_TO_CARD` | `idCard`, `value` |

### Board & List Operations

| Operation | Tool Slug | Required Params |
|-----------|-----------|----------------|
| List boards | `TRELLO_GET_MEMBERS_BOARDS_BY_ID_MEMBER` | `idMember` |
| Get board | `TRELLO_GET_BOARDS_BY_ID_BOARD` | `idBoard` |
| List lists | `TRELLO_GET_BOARDS_LISTS_BY_ID_BOARD` | `idBoard` |
| List cards | `TRELLO_GET_BOARDS_CARDS_BY_ID_BOARD` | `idBoard` |
| Create list | `TRELLO_ADD_LISTS` | `idBoard`, `name` |

### Key Parameters

**TRELLO_ADD_CARDS:**
| Param | Required | Description |
|-------|----------|-------------|
| `idList` | ✅ | List ID (24-char hex) |
| `name` | Recommended | Card title |
| `desc` | No | Description (0-16384 chars) |
| `due` | No | ISO 8601 date |
| `pos` | No | "top", "bottom", or float |
| `idLabels` | No | Comma-separated label IDs |
| `idMembers` | No | Comma-separated member IDs |

**TRELLO_UPDATE_CARDS_BY_ID_CARD:**
| Param | Required | Description |
|-------|----------|-------------|
| `idCard` | ✅ | Card ID or shortLink |
| `idList` | No | Move to list |
| `name` | No | New title |
| `desc` | No | New description |
| `due` | No | ISO 8601 date |
| `pos` | No | "top", "bottom", or float |
| `idLabels` | No | Replaces all labels |
| `idMembers` | No | Replaces all members |
| `closed` | No | "true" to archive |

**TRELLO_DELETE_CARDS_BY_ID_CARD:**
| Param | Required | Description |
|-------|----------|-------------|
| `idCard` | ✅ | Card ID or shortLink (card must be archived) |

---

## 6. Optimization Strategies

### 6.1 Always use commands over direct tool calls

```
✅ /trello-create-card name:"Task" list:"Backlog"
❌ Calling TRELLO_ADD_CARDS directly with raw IDs
```

Commands handle name→ID resolution, context lookup, and fallback logic automatically.

### 6.2 Use specific fields, never "all"

```
✅ /trello-update-card card:"x" name:"New title"
❌ Fetching card with fields:"all" just to update one field
```

### 6.3 Cache board context

The `.opencode/trello-context.json` file eliminates the need to query Trello for list/label/member IDs on every command. Keep it updated when the board structure changes.

### 6.4 Search before enumerating

```
✅ TRELLO_GET_SEARCH(query:"card name", cards_limit:5) → 1 call
❌ TRELLO_GET_BOARDS_CARDS_BY_ID_BOARD → 1+ calls, full board data
```

### 6.5 Workflow state mapping

| Workflow State | Trello List |
|----------------|-------------|
| Backlog / To Do | Backlog, Sprint Backlog |
| In Progress | In Progress |
| Review / Testing | Testing |
| Done | Done, Sprint Complete |
| Failed / Blocked | Failed |

---

*Document updated for OpenCode command-driven Trello workflow*
*Last updated: May 2026*
