---
description: Permanently delete a Trello card via Composio Trello API
---

## Guide: Delete a Trello Card

Permanently deletes a card by parsing `$ARGUMENTS` as `key:"value"` pairs.

## Arguments

| Key | Required | Description |
|-----|----------|-------------|
| `card` | ✅ | Card name or shortLink |

> **Note:** Trello only deletes archived cards. If the card is open, the flow archives it first, then deletes.

## Tool: TRELLO_DELETE_CARDS_BY_ID_CARD

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `idCard` | string | ✅ | Card ID or shortLink |

## Flow

1. If `card:` is a shortLink (8 chars), use as idCard. If name, find via TRELLO_GET_SEARCH.
2. Check if card is already closed (archived).
3. If open, call TRELLO_UPDATE_CARDS_BY_ID_CARD(idCard, closed:"true") first.
4. Execute TRELLO_DELETE_CARDS_BY_ID_CARD with idCard.
5. Return confirmation.

> **Optimization:** Use TRELLO_GET_SEARCH to find card by name — 1 call instead of enumerating the board.

## Examples

```
/trello-delete-card card:"CSH9VRvs"
/trello-delete-card card:"Implement login"
```

If `$ARGUMENTS` is empty, show usage instructions.
