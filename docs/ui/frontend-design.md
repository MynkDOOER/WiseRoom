# WiseRoom — current frontend design

Source paths in this document are relative to `Client/` unless prefixed with another repository folder.

The public homepage is the visual source of truth for all frontend screens. This document follows [design.md](../design.md) and [ui-kit.md](ui-kit.md).

## Visual direction

- Warm charcoal canvas/sidebar/panels: `#0F0C11`, `#151118`, `#1A161D`.
- Ivory main text `#F4EDE6`, secondary text `#B9AFA8`, and orange primary actions `#FF5A1F`.
- Bricolage Grotesque display headings, Hanken Grotesk UI/messages, JetBrains Mono code/technical labels.
- Thin warm borders, rounded panels, quiet depth, and visible orange focus states.
- Actual orange/ivory artwork in `WiseRoomLogo.jsx`, shared across public header/footer, sidebar, and authentication, with brief animation and reduced-motion support.

## Screen patterns

- `/`: pill navigation, editorial hero, grid/glow, illustrative product preview, chat onboarding walkthrough, feature grid, real Clerk account entry, outlined footer wordmark.
- `/workspace`: real room directory, unread/request summary, create/join actions, activity column.
- Navigation: remembered 200–320px desktop sidebar resizing/collapse; mobile drawer; actual-room picker with existing search/paging/keyboard controls.
- `/rooms/:roomId`: shared compact header and owner-only Invite, framed chronological conversation, grouped author rows, code/voice content, reactions/threads, and a compact single-row composer.
- `MessageRail`: previews and pointer/keyboard navigation for loaded history; native scrolling and cursor pagination remain available.
- `RoomContextPanel`: actual desktop members/details with existing management/settings controls; header access remains on narrow screens.
- Clerk forms: shared padded fields, full-width social controls, orange Continue, readable labels, and isolated styles.
- Dialogs/Inbox/Threads/Saved: reuse the same palette, fonts, components, focus behavior, and real data.

## Implementation map

| File | Responsibility |
| --- | --- |
| `src/styles/interior.css` | Final shared visual treatment, imported last |
| `src/styles/landing.css` | Scoped public page |
| `src/styles/auth.css`, `authAppearance.js` | Real Clerk forms and style isolation |
| `src/components/WiseRoomLogo.jsx` | Original animated mark |
| `src/components/WorkspaceLayout.jsx` | Sidebar, shared header, drawer, room switching |
| `src/components/ChatPanel.jsx`, `MessageRail.jsx` | Conversation, composer, history navigation/anchoring |
| `src/components/RoomContextPanel.jsx` | Real room members and details |
| `src/Pages/RoomPage.jsx` | Existing room state, ownership controls, and contextual views |

Preserve authentication, room/member permissions, existing URLs, API integrations, voice recording, code rendering, saved messages, threads, and message pagination. The public chat preview is illustrative; authenticated workspace content uses actual records.

## Verification record

The initial shared-header work on October 19 recorded frontend lint/build (99 modules), 38 backend tests, real room switching, member controls, and desktop/mobile overflow checks. Those are historical results for that revision.

Subsequent collaboration work recorded 15 frontend and 82 backend tests; see [collaboration-reference.md](../reports/collaboration-reference.md). Current landing/auth/interior updates passed lint/build and browser inspection of desktop/mobile layouts, actual Clerk cards, owner Invite, member management, timeline navigation, and scroll anchoring. Automated tests were not rerun for those visual-only updates; the historical counts are not new test runs.

See [landing-redesign.md](../reports/landing-redesign.md) and [interior-consistency.md](../reports/interior-consistency.md) for those implementation records. [README.md](../../README.md) tracks the multi-room chat scope and delivery roadmap.
