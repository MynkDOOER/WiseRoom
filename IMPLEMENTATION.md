# WiseRoom implementation — 2026-10-20

## Scope completed

Applied to `C:\Users\mayan\Downloads\WORKSPACE\WiseRoom` following approval to build the full plan with neo-brutalist styling and Socket.IO excluded.

- Reusable UI kit and development reference at `/ui-kit`.
- Ivory/dark-outline/coral theme, Inter UI/messages and JetBrains Mono code.
- Quiet Home with compact room rows, no homepage logo illustration or oversized cards.
- Persistent resizable/collapsible sidebar, mobile drawer and anchored curved room picker.
- Owner room rename and member removal.
- Member-editable room picture: local file selection, crop, pan, zoom, 512×512 server-processed image, removal and initials fallback.
- Six-character uppercase alphanumeric invitation codes and shareable `/join/:code` URLs.
- Owner-approved admission: request, cancel, approve, decline, paginated owner queue and applicant request status on Home.
- Existing members follow the link directly into the room. Removed members require a new approved request.
- Safe sign-in/sign-up return paths preserve valid invitations.

No Socket.IO dependency, socket server/client, realtime events, fake AI controls or mock application data was added. Existing HTTP message persistence/pagination remains unchanged. Refresh controls are used for new messages and request decisions.

## Database / compatibility

Validated the schema, generated Prisma Client 6.19.3 and successfully applied additive migration `20261020000000_room_management` to the configured PostgreSQL database.

The migration adds room picture metadata, nullable unique `inviteCode`, `updatedAt`, a join-request status enum and `RoomJoinRequest` with requester/decider relations, a unique room/user pair and queue indexes. It does not drop users, rooms, memberships or messages.

Old direct `POST /api/rooms/join` admission now returns 410. Owners retrieve a new six-character invitation in settings; existing rooms receive a code lazily on first owner retrieval. Old token values are not used for admission. Resetting an invitation changes its code, preserves current membership/pending requests and does not reveal the replacement code through applicant history.

## Server organization

Routes delegate to controllers, services enforce permissions/transactions, repositories use Prisma. New modules include invitation/request controllers and repositories, room-management controllers, image processing/storage services, a cryptographic code helper, bounded Serializable transaction retry helper and invitation limiter.

| Endpoint | Behavior |
| --- | --- |
| PATCH /api/rooms/:id | Owner rename |
| DELETE /api/rooms/:id/members/:userId | Owner removes another MEMBER |
| GET /api/rooms/:id/invite | Owner receives code + join path |
| POST /api/rooms/:id/invite/reset | Owner rotates invitation |
| PUT /api/rooms/:id/avatar | Current member uploads a bounded cropped raster image |
| DELETE /api/rooms/:id/avatar | Current member removes picture |
| GET /api/rooms/:id/avatar?access=... | Signed, time-limited picture access with a current membership check |
| GET /api/rooms/:id/join-requests?cursor=... | Owner queue, 50 rows/page |
| PATCH /api/rooms/:id/join-requests/:requestId | Owner APPROVED / REJECTED decision |
| GET /api/invites/:code | Authenticated minimal preview + caller-specific state |
| POST /api/invites/:code/requests | Idempotent pending request |
| DELETE /api/invites/:code/requests/me | Cancel own pending request |
| GET /api/invites/requests/me | Own pending/recent decisions; no replacement codes |
| DELETE /api/invites/requests/:requestId/me | Cancel own pending request even after link rotation |

Clerk supplies authenticated identities. Caller-supplied user IDs/roles cannot create ownership or membership. The owner cannot remove themselves or another OWNER. Removing membership preserves prior messages. Approval/cancellation/removal/rename use Serializable transactions with bounded retries. Repeated declined requests have a one-minute cooldown. Invitation attempts are limited per authenticated user/IP.

## Local room pictures

The user selected local storage for now. Files live under `Server/data/avatars/`, are ignored by Git and use generated immutable UUID keys. Original uploads are not retained. Do not delete this directory without backing up pictures you want to keep.

The browser accepts JPEG/PNG/WebP up to 5MB/20MP and produces a bounded crop. The server independently decodes format/dimensions, rejects invalid or animated inputs, re-encodes WebP at 512×512 and strips original metadata. Failed DB updates clean up the new file; replaced objects are cleaned up after commit.

Photo URLs are short-lived signed capabilities bound to a user, room, image key and expiry. Every uncached read checks current membership and the current key. The local signing key rotates on backend restart; refresh room data to obtain fresh URLs. Previously downloaded/cached content cannot be recalled.

This local adapter is for a persistent development filesystem. Connect persistent hosted storage before deployment to an ephemeral/multi-instance host. The in-memory invitation limiter also needs a shared store before multi-instance deployment.

Only Sharp was added as a feature dependency, at the patched `^0.35.5` release. npm audit still reports existing Prisma/config/deepmerge-ts and proxy-addr advisories; those unrelated packages were not force-upgraded in this change. No Socket.IO was installed.

## Verification actually performed

- Main frontend `npm run lint`: passed.
- Main frontend `npm test`: 3 tests passed (safe auth returns and invitation parsing/origin checks).
- Main frontend `npm run build`: passed (117 modules).
- Main backend `npm test`: 52 tests passed. Existing user/message tests remain; obsolete automatic-join tests were replaced with approval-flow cases.
- Prisma validation/generation and migration deploy succeeded.
- `git diff --check`: checked; ordinary LF/CRLF conversion notices are informational.
- Signed-in live browser: actual rooms/messages load; no homepage illustration/big cards; keyboard sidebar resizing, collapse and persistence; room switcher uses real names/memberships; owner settings and request/member lists open.
- Renamed the owned Reading room, verified the result and restored its original name.
- Uploaded an isolated generated crop-check fixture, adjusted zoom/pan, saved it through the real API and confirmed the returned picture decoded to 512×512. Removed it again, restoring the room's original picture state.
- An unsent draft survived settings/photo dialogs. The draft was cleared without sending it.
- Opened the real invitation as an existing member and confirmed direct room navigation without an admission request.
- UI kit native dialog closed on Escape and returned focus to its opener.
- Inspected desktop and 390px/320px layouts, drawer, settings, switcher and composer. Measured no horizontal page overflow in the checked phone views.

## Verification limits / remaining deployment work

- The available browser session has one real signed-in account. Live two-account request/approval/decline/removal was not exercised; authorization/state changes are covered by isolated HTTP tests with mocked authentication/database. Do not describe those tests as live multi-user verification.
- Invitation copy uses the browser clipboard API with a visible selectable-link fallback. A previous browser automation clipboard attempt timed out; clipboard completion is not claimed here.
- No hosted-storage deployment, realtime messaging, email notifications, PDF/RAG features or ownership transfer is included.
- Cached chat does not automatically disappear from another browser when a member is removed. The server denies subsequent reads/writes; the UI refreshes when the user requests current state.
- Full screen-reader/a11y certification and long-list multi-user UX testing remain separate from the checks above.

No code was committed or pushed. Changes that existed before this work were preserved. Original overwritten files were backed up outside the repository in the task's `neo-build/before/` folder. No secret values were printed or copied into application source.

## 20 October: dark purple kit and voice composer

The current palette supersedes the earlier light kit: near-black, dark purple, bright white accents; JetBrains Mono throughout, Fira Code for small metadata. The composer is a single 56px row at rest (70px including bottom spacing); extra UI appears only for an error, near-limit text, or an unsent voice preview.

New frontend modules: `ComposerTools`, `VoicePill`, `VoiceMessage`, `useVoiceRecorder`, and `styles/composer.css`. ChatPanel preserves text sending, cursor history, chronological rendering, membership errors and drafts. Expression/code dialogs insert into the draft rather than sending immediately. Existing raw code messages are not retroactively rewritten; use the code tool for new formatted notes.

Voice backend layers:

- `POST /api/rooms/:roomId/messages/voice?durationMs=…`: authenticated binary upload, up to 5 MB. Validates a supported MIME/container signature and duration metadata (300–120000ms), checks membership before writing and again in a Serializable insert transaction. Failed inserts remove the written file.
- `GET /api/rooms/:roomId/messages/:messageId/voice`: checks current membership and message/room scope, returns private/no-store audio with nosniff. The client fetches an authenticated blob when the user chooses Load voice note, so no bearer token goes in a URL. Browser controls handle playback after loading.
- `voiceController.js`, `voiceService.js`, repository functions in `messageRepository.js`, `utils/voiceUpload.js`, and `config/localVoiceStore.js` keep the existing route/controller/service/repository structure.
- Additive migration `20261020120000_voice_messages` adds nullable `voiceKey`, `voiceMime`, `voiceDurationMs` columns. Existing messages/pagination are preserved. Storage keys are not included in message API responses.
- Local recordings are immutable generated files under ignored `Server/data/voice/`. Back up this directory with the database. Before deployment, provide durable shared storage and a retention/orphan cleanup policy; a process crash between writing a file and inserting its row can leave an orphan. There is no automatic transcoding. Container checks are not a full media decode; client duration is descriptive metadata, while file size is enforced independently.

Checks: frontend lint/build, 3 frontend tests, 65 backend tests (including 13 voice tests), and patch whitespace. Live UI checks include desktop/mobile composer, font mapping, expression insertion, code insertion and maximum-length validation. The user confirmed live recording/playback in their browser. No Socket.IO or realtime work was added. No secrets were printed or copied.
