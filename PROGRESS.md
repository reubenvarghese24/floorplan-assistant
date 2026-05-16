# Floorplan Assistant — Progress Log

## [2026-05-11] — 8

### Added: Edge Snapping
Furniture pieces now snap flush when dragged within 6 inches of another piece's edge. Works on both X and Y axes independently — sliding along a snapped edge doesn't cause unwanted jumps. Snapped positions are re-clamped to room boundaries so pieces can't snap outside the room.

---

## [2026-05-11] — 7

### Deployed: App live on Vercel
Pushed to GitHub and deployed via Vercel. Tested with a real user — working.

---

## [2026-05-11] — 6

### Added: Default Starter Data
New users now land on a pre-populated app — 4 IKEA-inspired furniture items (KIVIK Sofa, MALM Bed, HEMNES Coffee Table, KALLAX Bookshelf) and 3 rooms (Living Room, Bedroom, Kitchen), each with a door and window. Seeding only runs once; existing user data is never overwritten.

---

## [2026-05-11] — 5

### Updated: Landing Page + Home Tab
- Removed emojis from landing page step cards
- Added "Home" as the first tab in the app, embedding the landing page content
- "Get Started" button in Home tab and on the external landing page both route to the Inventory tab
- Tab descriptions updated to match the step card copy

---

## [2026-05-11] — 4

### Added: Landing Page
Built a landing page at `/` that introduces the app before users enter it.

**What was built:**
- New `public/index.html` — landing page with hero section, 3-step how-it-works guide, and footer
- `public/app.html` — the full app (renamed from `index.html`)
- ~120 lines of new CSS in `style.css` for landing-specific layouts

**Structure:** Blue hero with tagline "Build your dream floorplan", 3 step cards (Inventory → Rooms → Floor Plan), CTA button linking to `/app.html`. Reuses the existing design system (same colors, fonts, shadows, button styles).

---

## [2026-05-11] — 3

### Development: Moved to localStorage + Vercel-ready
Refactored the app from server-side JSON file storage to browser localStorage, making it deployable as a shareable web app with no user accounts required.

**What changed:**
- `public/app.js` — replaced all 8 server API calls with localStorage equivalents. Each user's furniture and rooms now live entirely in their own browser. The `State` object and all UI logic are unchanged.
- `server.js` — stripped down to a static file server only. All business logic and data storage removed.
- `vercel.json` — created; tells Vercel how to run the Express server so it can be deployed with one click.

**What this enables:**
- Any user can open the app via a shared URL and use it independently
- Progress saves automatically to their browser (persists across reloads)
- No accounts, no database, no shared state between users
- Server kept intentionally so a future `/api/suggest-layout` endpoint (feng shui AI) can be added as a single new route

**Next step for the user:** Push to GitHub → connect to Vercel → get a live URL.

---

## [2026-05-11] — 2

### Fixed: Click and Drag Not Responding (Shelves)
Resolved a bug where furniture — especially shelves — couldn't be reliably clicked or dragged on the floor plan canvas.

**Root cause:** The canvas has a fixed internal size of `700×500` pixels, but CSS applies `max-width: 100%`, which visually shrinks it on smaller screens. Mouse click coordinates from the browser are in CSS pixels (the shrunken size), but the hit detection code was treating them as raw canvas pixels (full 700×500). This offset caused clicks to land in the wrong spot. Shelves were hit hardest because their narrow depth (1.25 ft) left almost no margin for error.

**Fix:** Applied a `canvas.width / rect.width` scaling factor to all three mouse event handlers (`drop`, `mousedown`, `mousemove`) so click coordinates are always translated into the canvas's internal coordinate system correctly.

---

## [2026-05-11] — 1
### Removed: Moving Day Feature
Cut the Moving Day tab entirely from the app. The feature included a checklist that tracked furniture packing status (Not Started → Packed → In Transit → Placed), ordered heaviest-first across all rooms.

**What was removed:**
- Moving Day tab button from the nav
- Full Moving Day HTML panel and checklist UI
- `buildChecklistOrder`, `renderChecklist`, and `cycleStatus` JS functions
- `status` field from all placement objects in the floor plan data
- All associated CSS styles (79 lines)

**Why:** The feature added complexity without being core to the moving assistant experience. Cutting it keeps the app focused on Inventory, Rooms, and Floor Plan.
