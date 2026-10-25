> Historical UI milestone report. Its polling implementation was superseded by Socket.IO on 2026-10-22; see [realtime.md](../realtime.md) for the current transport and recovery behavior.

# WiseRoom reference UI and collaboration update

Implemented in the actual `Downloads/WORKSPACE/WiseRoom` project. Existing authentication, room creation/admission, ownership, member management, local pictures, text history and voice recording are preserved.

Current shared design: [design.md](../design.md) and [ui-kit.md](../ui/ui-kit.md). This report preserves the collaboration implementation/verification record.

## What changed

Current Home/sidebar/chat styling uses warm charcoal surfaces, ivory text, orange actions, Bricolage Grotesque headings, Hanken Grotesk UI/messages, and JetBrains Mono code/metadata. Conversations use grouped rows, inline timestamps, code cards, voice controls, contextual actions, a timeline rail, and a compact single-row composer. Actual records determine live room content; the public chat preview is labeled separately.

Invite is only rendered for the owner, guarded again before the frontend invitation request, and enforced by the existing owner-only backend service. The owner button remains visible at mobile widths.

## Additional features approved during this update

| Feature | Implementation |
| --- | --- |
| Inbox and unread counts | Per-membership `lastReadAt`, authenticated activity feed and mark-read actions |
| Threads | Same-room root/reply relation, persisted replies, chronological pagination and focused drawer |
| Reactions | Six supported reactions, per-user compound key, explicit idempotent active state |
| Saved | Personal saved-message rows; removed members cannot use Saved to bypass room access |
| Pinned rooms | Personal membership preference persisted in the database |
| Presence and typing | Authenticated room-scoped heartbeat/typing state with expiry and current-membership filtering |
| Message updates | Visible-tab polling, chronological merging, cursor catch-up, preserved older history and a new-message jump action |

Socket.IO was not added. Presence polls every four seconds; message/thread updates every six seconds; activity refreshes every fifteen seconds. Presence is in memory for this single development server, with a sixty-second online expiry and five-second typing expiry. Multi-instance deployment needs shared presence storage. This is polling, not a pushed WebSocket transport.

## Files and layers

- **UI:** `WorkspaceLayout`, `HomePage`, `RoomsDashboard`, `ForYou`, `ActivityPage`, `ChatPanel`, `MessageItem`, `ThreadPanel`, `VoiceMessage`, `CodeNote`, `MessageLinks`, `InlineJoin`, `styles/reference.css`, and the shared avatar/kit components.
- **Client integration:** `api/collaboration.js`, `useRoomPresence`, unread context in `WorkspaceProvider`, and the rendering/poll-window helpers.
- **Backend:** separate collaboration/activity routes, controller, service and repository; `utils/roomPresence.js`; additions to message/room repositories and services.
- **Database:** additive migration `20261020160000_collaboration` adds thread relations, reactions, saves, read state and pins. Existing rows/messages are preserved. Migration applied and Prisma Client generated successfully.
- **Dependencies:** Highlight.js, loaded separately with selected language grammars. Existing React Bits/Hugeicons attribution remains in `Client/licenses/`.

## API additions

All routes require verified Clerk authentication. Room actions also require current membership and scope message IDs to that room.

- `GET /api/activity/inbox|threads|saved?before=…`
- `GET /api/activity/unread`
- `POST /api/activity/read`
- `GET /api/rooms/:roomId/messages/changes?after=…`
- `PUT /api/rooms/:roomId/messages/:messageId/reaction`
- `PUT /api/rooms/:roomId/messages/:messageId/saved`
- `GET|POST /api/rooms/:roomId/messages/:messageId/thread`
- `POST /api/rooms/:roomId/read`
- `PUT /api/rooms/:roomId/pin`
- `GET|POST /api/rooms/:roomId/presence`

Save/reaction requests specify an explicit desired state, so retries do not toggle twice. Membership checks and message writes use Serializable transactions with bounded retries. Feed queries restrict access to current room memberships. Activity and history pages are bounded and cursor-paginated. Unread read-through timestamps advance monotonically.

## Collaboration verification (historical milestone results)

- Client lint and production build pass; syntax highlighting is split into a separate bundle.
- **15 frontend tests pass**, including safe code highlighting/HTML escaping, URL-card parsing and the older-history polling regression.
- **82 backend tests pass**, including authentication, room/message scoping, saves, reaction idempotency, threads, unread/read state, pinning, presence expiry and existing room/voice flows. These tests use isolated Clerk/database doubles.
- Live browser/real database checks: existing room loading, real reaction persistence, saving/loading a message, a persisted self-test thread reply and thread listing, and personal pin/unpin.
- Desktop and mobile checks at 390px/320px: owner Invite visibility, no horizontal page overflow, drawer navigation, thread panel, composer and focus behavior.
- The user confirmed owner-only invites and cross-account typing in their two-account Testing room.
- One self-test thread reply was added to the existing single-member Design studio room: “Thread check: replies stay together.” Test reaction/save/pin changes were restored.

## Practical limits

The unread model tracks room read-through time rather than individual per-message receipts. Presence is ephemeral/single-process. Saved and unread feeds display accessible records only. Link cards use the submitted URL rather than scraping external metadata. Audio is still stored on local disk; codec support depends on the browser, and an unavailable waveform decoder does not prevent native playback. Existing local-media backup/deployment requirements from the earlier report still apply.

No deployment, commit or push was performed.
