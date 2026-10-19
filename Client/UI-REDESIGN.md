# WiseRoom — light workspace refinement

Applied to `C:\Users\mayan\Downloads\WORKSPACE\WiseRoom` on 2026-10-19. This revision replaces the earlier dark theme.

## What changed

- White surfaces and very light blue backgrounds. Incoming cards are white; outgoing cards are `#E9F4FD`, with dark `#1D3449` text. The orange logo asset is unchanged.
- DM Sans for UI/messages and JetBrains Mono for code remain in use. Message text is now 15px, with comfortable line spacing.
- Replaced the two header rows (about 151px combined) with one 60px bar containing Workspace, the room title/count, Members, and Invite. Room actions are rendered into the shared header with a React portal while their existing state/API logic stays in RoomPage.
- Sidebar reduced from 248px to 208px; a collapse button reduces it to 72px. Intermediate widths use 188px; mobile uses the existing drawer.
- Clicking Workspace opens a rotary room picker. Actual rooms appear as circular buttons around a turning ring. Click a circle to enter, or rotate using the arrow buttons/keyboard and open the selected room from the center. Search and groups of eight support larger room lists.
- Member panel is narrower and its summary is more compact. Dialogs, account controls, directory, code blocks, and authentication appearance use the same light theme.
- Dialogs explicitly restore focus to their opener. Member-panel keyboard handling yields to an open native dialog.

## Files changed in this revision

All paths below are relative to the main repository.

| File | Change |
| --- | --- |
| `Client/src/index.css` | Light theme, compact shell, collapse states, message readability, rotary animation, responsive layouts |
| `Client/src/components/WorkspaceLayout.jsx` | Smaller collapsible navigation, Workspace dial trigger, shared header slot |
| `Client/src/components/RoomDial.jsx` | New actual-room rotary picker, search, pagination, keyboard interaction |
| `Client/src/components/Icon.jsx` | Dial icon |
| `Client/src/components/Modal.jsx` | Explicit focus restoration |
| `Client/src/Pages/RoomPage.jsx` | Shared-header portal; removes duplicate header; nested-dialog keyboard fix |
| `Client/src/main.jsx` | Light Clerk appearance |
| `Client/index.html` | Light browser theme color |
| `Client/UI-REDESIGN.md` | This report |

No backend source, API helper, database schema, migration, dependency manifest, credential file, or logo asset was changed in this revision. Existing room permissions, invitations, membership, message persistence, cursor pagination, and 4,000-character limit remain in use. No mock application data or fake controls were added.

## Verification actually performed

### Main project commands

- Frontend `npm run lint`: passed.
- Frontend `npm run build`: passed, 99 modules.
- Backend `npm test`: all 38 existing tests passed (6 user sync, 14 rooms/memberships, 18 messaging).
- `git diff --check`: passed after normalizing final newlines. Existing LF/CRLF conversion notices remain informational.

### Real signed-in browser and Neon

- Verified the single header is 60px and the old duplicate room-heading element no longer exists.
- Measured sidebar widths of 208px expanded and 72px collapsed. Collapsing retained the current conversation and all messages.
- Opened the rotary picker with actual rooms. Created `Reading room` through the existing API dialog to verify switching between two rooms.
- Verified rotation buttons, arrow-key rotation, Enter navigation, direct circle navigation, current-room marking, search, and empty-search state.
- Opened the dial while the member panel was open. Focus stayed in the dialog; Escape closed the dial without closing the member panel; focus returned to Workspace.
- Checked 320x740, 390x844, 768x1024, 1280x800, and 1440x900 layouts. No horizontal document/header overflow; composer stayed within the viewport.
- Verified mobile navigation and the mobile rotary picker fit the viewport.
- Sent a real message in Reading room and reloaded; the message persisted. Retrieved and copied the actual invitation using the compact header controls.
- Confirmed existing Design studio messages and code blocks still render when switching back.
- Checked final browser console error logs.

### Contrast calculations

These are calculations for specific color pairs, not a claim of full application accessibility certification.

| Element | Contrast ratio |
| --- | --- |
| Outgoing message text | 11.48:1 |
| Incoming message text | 12.81:1 |
| Outgoing message timestamp | 4.74:1 |
| Primary button text | 6.86:1 |
| Code text | 8.71:1 |

## Design references

- [Turn.io design case study by O0](https://www.ozero.design/works/turn-io): a human-centered conversational identity and restrained interaction. This is a design reference; its marketing website is not a template for the application.
- [Intercom Messenger accessibility](https://www.intercom.com/blog/messenger-accessibility): keyboard controls, visible focus, focus containment, and color contrast.

## Scope and remaining verification limits

- Socket.IO/live delivery remains the next milestone. Refresh latest is still required for other users' new messages.
- Browser checks used the signed-in owner account. Separate-member join/leave and a fresh OAuth sign-in/sign-up round trip were not repeated in this revision; existing backend authorization tests passed.
- The dial's multi-page branch supports more than eight rooms, but the live browser check used the two actual rooms available. No extra fake rooms were inserted for that branch.
- Design studio retains its four earlier verification messages. Reading room contains one new verification message. No existing messages were removed or changed.
- Earlier real pagination checks (30 to 38 messages, no duplicates, scroll preservation) remain documented in the previous report backup. This revision retains that pagination code and passes its backend tests; it did not repeat the temporary 34-message fixture run.
- Screenshots and pre-change backups are outside the repository in the local `ui-light-refinement` working folder. No new dependencies were installed.
