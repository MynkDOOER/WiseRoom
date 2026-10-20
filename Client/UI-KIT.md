# WiseRoom UI kit

## Consistency contract

The public landing page is the visual source of truth for the whole product. Use warm charcoal surfaces, ivory text, restrained orange actions, Bricolage Grotesque display headings, Hanken Grotesk UI/messages, and JetBrains Mono metadata/code. Do not reintroduce the previous purple theme, alternate W/R monogram, or unrelated branding.

- `WiseRoomLogo.jsx` contains the real favicon artwork with its original paths/proportions. Reuse it for the public header/footer, authentication, and sidebar; its entry/hover animation has a reduced-motion fallback.
- `styles/interior.css` is the final shared product treatment, imported after the other styles. It unifies room framing, surfaces, message typography, member cards, dialogs, navigation, and the compact single-row composer.
- `MessageRail.jsx` is a real message-history control: hover/focus previews, pointer dragging, Arrow/Home/End/Page navigation, current scroll progress, and saved markers derived from loaded messages. It does not claim to index history that has not been loaded.
- `RoomContextPanel.jsx` uses actual member records and roles; its settings/member actions open the existing controls. It collapses away on smaller screens, where header member/settings controls remain available.
- Chat preserves chronological pagination and reader position. At the bottom, content/composer resizing keeps the latest message anchored; browsing history does not force-scroll to the bottom.


The current kit follows the supplied WiseRoom Genspark landing reference: a warm charcoal canvas, orange actions, ivory text, editorial headings, and quiet mono labels. Open `/ui-kit` in development to inspect the shared primitives. That reference route is excluded from production routing.

## Foundations

| Token | Value | Use |
| --- | --- | --- |
| `--canvas` | `#0F0C11` | Conversation and workspace background |
| `--sidebar` | `#151118` | Persistent navigation |
| `--paper` | `#1A161D` | Panels and fields |
| `--ink` | `#F4EDE6` | Main text |
| `--muted` | `#B9AFA8` | Secondary text |
| `--line` | `#2C252B` | Quiet dividers |
| `--accent` | `#FF5A1F` | Primary actions |
| `--highlight` | `#392018` | Selected and active states |

Hanken Grotesk is used for interface text and messages. Bricolage Grotesque is used for display headings. JetBrains Mono is used for the wordmark, code, timestamps, and small technical labels. These are the exact font families in the linked landing reference.

`styles/tokens.css` supplies base tokens, `styles/ui.css` shared primitives, `index.css` the application layouts, `styles/composer.css` the recording/expression/crop foundations, and `styles/reference.css` the current screenshot theme and collaboration layouts. The scoped `styles/landing.css` reproduces the landing layout; `styles/conversation-theme.css` finishes the shared workspace treatment and is imported last. Clerk uses the same surface/accent/type treatment.

## Layout and behavior

- Sidebar: search with Ctrl/Cmd+K, Home, Inbox, Threads, Saved, personal pinned rooms, other rooms and account controls. Room names, previews, unread counts and pins come from actual records. The sidebar remains collapsible/resizable (200–320px) and remembers its preference; new installations default to 260px.
- Public Home (`/`): reference hero, interactive illustrative product preview, animated pipeline, feature grid, real Clerk sign-in and outlined footer wordmark. The AI preview is labeled; it does not write to the database.
- Workspace (`/workspace`): date, personal greeting, true unread summary, create-room action, inline invitation entry, compact room rows with latest message/time, list/grid toggle and a real activity column.
- Room header: clickable room avatar to switch rooms, room name, actual member/online counts, member stack, search, personal pin and settings controls. Invite is rendered only for `OWNER` and remains visible on narrow screens. Members can still change the room picture; owner-only rename/invitation/member controls remain enforced.
- Chat: one left-aligned chronological column, grouped consecutive messages, inline names/timestamps and quiet unboxed text. Hover or keyboard focus reveals actual reaction/thread/message actions. Touch exposes the actions menu.
- Composer: the reference's two-row textarea/action layout, with expression/code/voice controls and a persistent Send action that is disabled when empty. Enter sends; Shift+Enter inserts a newline. Recording preview and errors appear only when relevant.
- Code: supported language syntax coloring, safe escaping and Copy. Highlighting loads as a separate bundle. Unknown languages render as escaped text.
- Links: cards show actual URL/host/path. There is no remote metadata/image fetch or fabricated title/description.
- Voice: custom play/pause/seek controls, duration and a waveform decoded from the recording after loading. Unloaded audio uses flat neutral bars. Existing real recording/preview/cancel/upload behavior remains intact.
- Threads: a focused drawer with persisted replies, earlier-reply pagination and the same real reaction/save actions. Saved and Inbox are separate functional pages, not mock navigation.

## Interaction requirements

Keep native dialog focus containment and focus return. Preserve drafts and history pagination when opening contextual views. Use visible keyboard focus, named controls and reduced-motion support. Do not invent activity, typing, presence, message counts, avatars or recordings to fill a design.

## Verification

The final client passes lint, production build and 15 tests. Backend verification has 82 passing tests. Live checks covered Home, actual reactions/save/unsave, persisted thread reply, Threads navigation, sidebar pin/unpin, and desktop/mobile layouts at 390px/320px. The user confirmed owner-only invites and cross-account typing. Tests use isolated auth/database doubles; they are distinct from those live checks. See `../IMPLEMENTATION.md` for API/storage limits and the complete implementation report.
