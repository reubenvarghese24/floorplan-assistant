# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

```bash
npm install       # first time only
npm start         # starts server at http://localhost:3000
```

No build step. Edit files in `public/` and reload the browser — changes are instant.

## Architecture

Two-tier: a Node/Express server handles file I/O and serves static assets; a vanilla JS frontend talks to it via fetch.

**Server (`server.js`)** — reads both JSON files into memory arrays at startup, validates incoming requests, mutates the arrays, and writes back to disk with `fs.writeFileSync` on every mutation. No ORM, no migrations — the JSON files are the schema.

**Frontend (`public/app.js`)** — single IIFE, no framework, no bundler. One shared `State` object (`{ unit, furniture, rooms, editingFurnitureId, editingRoomId }`) is the source of truth in the browser. All API calls go through `apiFetch()`, which all named wrappers (`getFurniture`, `createRoom`, etc.) delegate to.

**Data files** (`data/furniture.json`, `data/rooms.json`) — plain JSON arrays. `rooms.json` items carry a `layout` array (floor plan placements) and wall features; `furniture.json` items carry a `unit` field per record so display conversions work even when the global toggle changes after items were saved.

## Key conventions

**Unit handling:** furniture dimensions are stored in the unit active at save time (`item.unit: "in"|"cm"`). The global toggle (`State.unit`, persisted in `localStorage`) is display-only. `convertDimension(value, fromUnit, toUnit)` in `app.js` handles all conversions — always go through it rather than multiplying by `IN_TO_CM` (2.54) directly.

**IDs:** generated client-side by `genId()` in `server.js` (`Date.now().toString(36) + random`). The server re-uses an incoming `wf.id` on wall features when present (to preserve identity across edits) and generates a new one otherwise.

**Saving layouts:** `PUT /api/rooms/:id` merges the incoming body with the existing room using spread (`{ ...existing, ...updates }`), so fields not present in the PUT body (like `layout`) are preserved. Always include `wallFeatures` in PUT bodies even if unchanged.

**HTML/CSS patterns:** tabs work by toggling `.active` on `.tab-btn` and `#tab-{name}` panel pairs. Modals toggle `.hidden`. Error fields follow the `{fieldId}-error` id convention (e.g. `f-name` → `f-name-error`). CSS variables are defined on `:root` in `style.css` — use them for all colors and spacing.

## API surface

| Method | Route | Body / Notes |
|---|---|---|
| GET | `/api/furniture` | Returns `{ items: Furniture[] }` |
| POST | `/api/furniture` | `{ name, category, width, depth, height, unit, weight?, notes? }` |
| PUT | `/api/furniture/:id` | Same shape as POST |
| DELETE | `/api/furniture/:id` | — |
| GET | `/api/rooms` | Returns `{ items: Room[] }` |
| POST | `/api/rooms` | `{ name, width, depth, wallFeatures[] }` |
| PUT | `/api/rooms/:id` | Same shape as POST; preserves `layout` field via spread |
| DELETE | `/api/rooms/:id` | — |

All errors return `{ error: string }` with an appropriate HTTP status.
