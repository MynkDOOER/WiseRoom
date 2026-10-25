# WiseRoom — consistent interior and real logo

Applied directly to the main project, October 20, 2026.

Current design: [design.md](../design.md). Components: [ui-kit.md](../ui/ui-kit.md).

## Changes

- All visible brand placements share the actual orange/ivory favicon artwork. `WiseRoomLogo.jsx` reuses the original paths, colors, and proportions in the landing header/footer, sidebar, and auth layout. Short document/conversation/drawn-W animations run on entry and hover/focus, with a static reduced-motion fallback.
- Matched live rooms to the landing preview: warm dark framed workspace, quiet author/time rows, small pastel avatars, compact single-row composer, restrained dividers and orange primary actions. Emoji, code insertion, voice recording, send, and existing keyboard behavior are retained.
- Added a left-side timeline ruler connected to actual loaded message positions. It supports dragging, hover/focus message snippets, saved indicators, Arrow/Home/End/Page keys, and accurate current scroll progress. Search filters and newly loaded history update its positions.
- Added a desktop room context column using real members/roles/presence, with existing member-details, room-settings, and owner management actions. All member and room context comes from actual records. The context column hides below 1250px; the existing header actions stay available.
- Preserved owner-only Invite and made it orange with readable contrast. Existing API permission checks and authentication are unchanged.
- Fixed latest-message anchoring when fonts, code highlighting, and composer sizes settle. A reader browsing older history keeps their position. Existing cursor pagination is preserved.
- Updated UI kit documentation with the landing page as the continuing design source of truth.

## Interior verification (historical milestone results)

- ESLint and production build.
- Desktop: real room loading/history/code rendering, timeline Home navigation, dragging to 50% scroll with matching progress and preview, existing Manage members dialog, compact composer, and owner Invite visibility.
- Mobile at 390 × 844: no horizontal overflow, visible compact composer, native history scrolling, timeline navigation, and preserved header controls.
- Used real existing rooms and messages; no new rooms, memberships, or messages created for this update.
- Automated tests were not run for this visual update.

## Main files

`WiseRoomLogo.jsx`, `BrandSignature.jsx`, `MessageRail.jsx`, `RoomContextPanel.jsx`, `ChatPanel.jsx`, `RoomPage.jsx`, `LandingPage.jsx`, `AuthLayout.jsx`, `MemberAvatar.jsx`, `styles/interior.css`, `main.jsx`, and `docs/ui/ui-kit.md`.

The timeline covers currently loaded history. Scrolling to its beginning can trigger the existing older-message pagination; it is not a database-wide search or summary feature.
