# WiseRoom realtime flow

WiseRoom uses Socket.IO 4 on the Express HTTP server and one authenticated connection per signed-in browser tab. Persistent operations still use the HTTP APIs. PostgreSQL remains the source of truth.

## Follow a message from sender to recipient

1. The sender calls the existing message POST API.
2. The server verifies Clerk authentication and room membership, then commits the message.
3. After commit, it sends a `message:created` notification to current room members' personal socket channels.
4. Browsers showing that room fetch its updated data through the authenticated API. Other pages refresh room previews and unread activity.
5. Messages are merged by database ID, so the sender's HTTP response and the notification cannot add duplicate rows.

Socket notifications contain event types and record identifiers, not message bodies, invite codes, recordings, or another user's saved state. Every content fetch checks current permissions.

## Channels and identity

- `user:<Clerk user ID>` is joined by the server after Clerk session-token verification. It reaches that account's tabs across the workspace.
- `room:<room ID>` is a permission-checked subscription for presence in the currently open room.
- Clients cannot choose another user's personal channel or send persistent updates through arbitrary socket events.
- The allowed browser origin is shared between HTTP CORS and socket authentication. `CLIENT_ORIGIN` defaults to `http://localhost:5173`.
- Session tokens refresh on the existing connection. The server enforces token expiry, and reconnect attempts obtain a fresh Clerk token. Sign-out unmounts the provider and disconnects.

## Events

| Event | Audience / effect |
|---|---|
| `message:created`, `message:updated`, `message:deleted` | Current members; refresh history, previews and unread activity |
| `thread:changed` | Current members; refresh thread replies and parent counts |
| `saved:changed`, `read:changed`, `rooms:changed` | Only that user and their other tabs |
| `room:changed`, `members:changed`, `ownership:changed` | Current members; refresh room information and permissions |
| `requests:changed` | Applicant and current owner only |
| `invitation:changed` | Owner's tabs; refresh their invitation display |
| `room:removed` | Removed user's tabs; revoke the active subscription and clear room content |
| `room:deleted` | Previous members and pending applicants; remove the room or refresh invitation status |
| `presence:changed` | Authorized room viewers; active user IDs and expiring typing state |

## Disconnects and catch-up

The client shows Connecting, Live, Reconnecting, or Session needs attention. A socket reconnect does not restart Express or reload the page.

- Reconnect, page focus, returning from a hidden tab and coming back online request API reconciliation.
- A shared 60-second reconciliation fallback catches missed events, including a server crash after committing a write but before broadcasting it.
- Room history catches up using the forward message cursor and merges by ID. Loaded history is refreshed in batches of 100 through `POST /api/rooms/:roomId/messages/sync`, including old reactions, saves and deleted placeholders.
- An immediate reconciliation after initial history loading covers events arriving during that initial request. Subscriptions are registered before catch-up requests.
- Frequent 4-, 6- and 15-second chat/presence/activity timers have been removed.
- Brief disconnections may miss live notifications. API synchronization recovers persisted state. This implementation does not provide a durable event outbox or exactly-once event delivery.
- No connection-state packet replay is enabled: reconnecting clients recheck current room permissions before receiving content.

## Presence and typing

Presence counts a user once when at least one authenticated, connected tab is visible. Closing one tab does not mark them offline if another active tab remains. Typing is scoped to the tab's current room, throttled in the client, rate limited on the server, expires after four seconds, and is sent without an offline buffer. Temporary typing state is not written to PostgreSQL.

## Deployment scope

The current transport targets one Node backend instance. Running multiple instances requires a compatible shared Socket.IO adapter, shared presence, and appropriate load-balancer routing. HTTP endpoints remain usable if live notifications are unavailable. Voice and image uploads remain ordinary HTTP uploads.

Set `CLIENT_ORIGIN` to the exact frontend origin when deploying. The server binds to `HOST` (default `127.0.0.1`) and `PORT` (default `3000`).

## Files to read first

- `Server/realtime/server.js`: authentication, subscriptions, token refresh, presence and typing.
- `Server/realtime/events.js`: post-commit notification helpers.
- `Client/src/realtime/RealtimeProvider.jsx`: connection lifecycle and reconnect synchronization.
- `Client/src/realtime/useLiveRefresh.js`: coalesced event-driven API refreshes.
- `Client/src/components/ChatPanel.jsx`: history catch-up and scrolling.

## Verification checklist

Manual checks to perform with two accounts: live send/delete/reactions/replies; cross-tab saved/read state; request/approval/rejection; removal/transfer/deletion permissions; disconnect and catch-up; background tabs; typing expiry; and a burst of messages during initial loading. Destructive checks should use disposable rooms/messages.

No automated tests are added or run without a user request. Build/syntax checks do not establish that the two-account browser scenarios pass.

### Checks completed on 2026-10-22

Frontend ESLint and production build passed; changed backend modules passed Node syntax checks. The signed-in browser showed Live on Home and in a room, with room online presence visible. No new messages, requests, memberships or rooms were created or deleted during this check. Two-account delivery, permission-change and network-interruption scenarios remain unverified.
