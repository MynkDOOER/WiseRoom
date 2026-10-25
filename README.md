<p align="center">
  <img src="Client/public/favicon.svg" alt="WiseRoom orange and ivory conversation logo" width="76" height="76" />
</p>

<h1 align="center">WiseRoom — Real-Time Multi-Room Chat</h1>

<p align="center"><strong>A shared space. A clearer mind.</strong></p>

<p align="center">
  Private chat rooms for teams, study groups, and communities.<br />
  Real-time messaging with React, Socket.IO, Node.js, Neon PostgreSQL, Prisma, and Clerk.
</p>

<p align="center">
  <a href="#project-progress">Progress</a> ·
  <a href="#screenshots">Screenshots</a> ·
  <a href="#features">Features</a> ·
  <a href="#getting-started">Getting started</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#roadmap">Roadmap</a> ·
  <a href="docs/README.md">Documentation</a>
</p>

---

WiseRoom is a **real-time multi-room chat application** for teams, study groups, and communities. Create private rooms, invite your people, and keep each conversation in its own space.

Text, voice notes, code snippets, link previews, threaded replies, reactions, and saved messages make it easy to share ideas and return to the details later. Room owners control invitations, approve requests, manage members, transfer ownership, and delete rooms.

**Development status:** Active development. Authentication, persistent messaging, room management, collaboration tools, and Socket.IO live updates are implemented. Hosted deployment and multi-instance scaling remain delivery work.

## How it works

1. **Create a room:** sign in and make a private space for your group.
2. **Invite your people:** share an invitation link or code and approve join requests.
3. **Chat together:** send text, voice notes, code, and links with live updates.
4. **Keep your place:** use threads, saved messages, pinned rooms, and unread activity.

Current room membership is the access boundary for reading messages and participating in conversations.

## Project progress

| Workstream | Status | Scope |
| --- | --- | --- |
| Authentication and user persistence | Implemented | Clerk identity and synchronized PostgreSQL users. |
| Rooms and membership | Implemented | Owners/members, invitations, join requests, approval, removal, and room settings. |
| Persistent messaging | Implemented | Member-only text/voice messages, cursor history, and code rendering. |
| Collaboration | Implemented | Threads, reactions, saved messages, pins, unread activity, presence, and typing with Socket.IO live updates. |
| Application experience | Implemented | Responsive workspace, authentication screens, shared design system, and message timeline. |

The shared interface keeps room navigation, conversations, member controls, and activity consistent across desktop and mobile.

## Features

The following capabilities are implemented in the multi-room chat application.

### Authentication and room access

- **Clerk sign-in and sign-up**, including configured social providers and email authentication.
- **Database user synchronization** using each authenticated user's Clerk ID.
- **Private chat rooms** with owner/member roles enforced by the backend.
- **Invitation links and six-character alphanumeric codes** for requesting access.
- **Owner-approved join requests**, request cancellation, and member removal.
- **Owner-only room renaming and invitation controls**, including invitation reset.
- **Room profile pictures** that members can upload, crop, and zoom before saving.

### Messaging and collaboration

- **Persistent PostgreSQL message history** with cursor pagination: the latest 30 messages load first, followed by older pages as you scroll.
- **Member-only reading and sending**, with backend membership checks.
- **Voice messages** with microphone recording, preview, cancellation, upload, and playback.
- **Code snippets** with syntax highlighting and a copy action.
- **Link previews** with YouTube thumbnails, Open Graph/Twitter page metadata, cached image delivery, and a readable fallback for unavailable images. [How previews work](docs/link-previews.md).
- **Emoji/expression insertion**, message reactions, and threaded replies.
- **Saved messages**, pinned rooms, unread counts, and an activity Inbox.
- **Online presence and typing indicators**, plus Socket.IO updates for messages, threads, reactions, room changes and invitations, with authenticated API catch-up.
- **Search within loaded messages**, a jump-to-latest action, and a draggable timeline with actual message previews.

### Interface

- Consistent warm charcoal, ivory, and orange styling across the homepage, workspace, chat, dialogs, and authentication.
- Bricolage Grotesque display headings, Hanken Grotesk interface text, and JetBrains Mono code/metadata.
- Original animated WiseRoom logo with a reduced-motion fallback.
- Responsive navigation drawer on mobile; collapsible and resizable sidebar on desktop.
- Visible keyboard focus, loading/error states, grouped messages, and long-message wrapping.
- Development UI kit at `/ui-kit` for shared components and visual foundations.

## Screenshots

### Public homepage

The orange-and-ivory brand, animated original logo, editorial typography, and interactive product preview.

![WiseRoom homepage with an orange conversation headline, dark grid background, and floating navigation](docs/images/wiseroom-homepage.png)

### Your workspace

A personal room directory with unread activity, quick room creation, invitation entry, and a collapsible, resizable sidebar.

![WiseRoom team workspace showing private rooms, unread activity, and room navigation](docs/images/wiseroom-workspace.png)

### Room conversations

Real message history, syntax-highlighted code, threaded replies, a compact emoji/code/voice composer, and a contextual member panel.

![WiseRoom group chat with code snippets, a voice-enabled message composer, and owner member controls](docs/images/wiseroom-chat.png)

<details>
<summary><strong>Message timeline and mobile layout</strong></summary>

Hover or focus the timeline to preview a loaded message. Drag to scroll, or use the arrow, Home, End, and Page keys to navigate.

![WiseRoom message timeline with a hover preview and a draggable scroll-position indicator](docs/images/wiseroom-message-timeline.png)

The mobile room view retains chat history, the timeline, owner invitation controls, and the compact composer.

<img src="docs/images/wiseroom-mobile-chat.png" alt="WiseRoom responsive mobile chat with message navigation and compact composer" width="320" />

</details>

Workspace screenshots use development rooms. The public landing preview shows illustrative chat conversations.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7 |
| Styling | Shared CSS tokens, responsive layouts, SVG/CSS animation |
| Authentication | Clerk React and Clerk Express |
| Backend | Node.js, Express 5, JavaScript ES modules |
| Database | Neon PostgreSQL |
| ORM and migrations | Prisma 6 |
| Code rendering | highlight.js |
| Image processing | Sharp |
| Media storage | Local filesystem for room pictures and voice recordings |
| Tests | Node.js test runner; ESLint for frontend linting |

**Live update implementation:** Socket.IO 4 sends authenticated, scoped notifications for messages, collaboration, room management and invitations. HTTP APIs persist data and reconcile missed updates after reconnect/focus, with a shared 60-second fallback. Presence is process-local; persistent records remain in PostgreSQL. See [the realtime walkthrough](docs/realtime.md).

## Getting started

### Prerequisites

- Node.js **22.12 or newer** and npm.
- A [Neon PostgreSQL](https://neon.com/) database.
- A [Clerk](https://clerk.com/) application with your chosen sign-in providers enabled.

### 1. Clone the repository

```bash
git clone https://github.com/MynkDOOER/WiseRoom.git
cd WiseRoom
```

### 2. Configure environment variables

Copy `Client/.env.example` to `Client/.env` and `Server/.env.example` to `Server/.env`. Replace the example comments with the values below, using your own credentials.

**`Client/.env`**

```dotenv
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
VITE_API_URL=http://localhost:3000
```

**`Server/.env`**

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
```

Use the same Clerk application for both parts of the project. Keep the Clerk secret key on the server. Environment files are excluded from Git.

### 3. Install dependencies and prepare the database

```bash
cd Server
npm ci
npx prisma generate
npx prisma migrate deploy
```

The checked-in migrations create the user/room/message models, room management, voice message metadata, and collaboration records. Prisma generates the server client into `Server/generated/prisma`.

### 4. Start the API

From `Server/`:

```bash
npm run dev
```

The API runs at **http://localhost:3000**.

### 5. Start the frontend

In a second terminal, from the repository root:

```bash
cd Client
npm ci
npm run dev
```

Open **http://localhost:5173**. Sign in, open your workspace, and create a room or request access with an invitation link/code.

The API currently allows the frontend origin `http://localhost:5173`. Keep that development URL unless you also update the server's CORS configuration.

## Application routes

| Route | Purpose |
| --- | --- |
| `/` | Public landing page and account entry |
| `/sign-in` · `/sign-up` | Clerk authentication |
| `/workspace` | Signed-in room directory and activity overview |
| `/rooms/:roomId` | Room conversation, members, and settings |
| `/join/:code` | Invitation preview and join request |
| `/inbox` | Activity Inbox |
| `/threads` | Thread activity |
| `/saved` | Saved messages |
| `/ui-kit` | Shared UI reference; development only |

## Architecture

```text
WiseRoom/
├── Client/
│   ├── src/
│   │   ├── Pages/          # Landing, workspace, rooms, authentication, activity
│   │   ├── components/     # Chat, timeline, composer, voice, members, shared UI
│   │   ├── api/            # Authenticated API clients
│   │   ├── hooks/          # Presence, recording, sidebar preferences
│   │   ├── styles/         # Design system, auth, landing, and interior styles
│   │   └── utils/          # Message windows/links and code rendering
│   ├── tests/
│   └── README.md          # Frontend development setup
├── Server/
│   ├── routes/             # Express API routes
│   ├── controllers/        # Request/response handling
│   ├── services/           # Permissions, validation, and business logic
│   ├── repositories/       # Prisma database queries
│   ├── middlewares/        # Authentication, errors, and invitation rate limits
│   ├── prisma/             # Schema and checked-in migrations
│   ├── data/               # Local media; excluded from Git
│   └── tests/
├── README.md               # Product overview, setup, progress and screenshots
└── docs/
    ├── README.md           # Documentation index
    ├── architecture.md     # System boundaries and data flow
    ├── implementation.md   # Implementation and milestone history
    ├── design.md           # Shared design direction
    ├── realtime.md         # Socket.IO flow and recovery
    ├── ui/                 # UI kit, frontend patterns and member controls
    ├── reports/            # Historical milestone reports
    └── images/             # Repository screenshots
```

The backend follows **route → controller → service → repository** boundaries. Prisma models include `User`, `Room`, `RoomMember`, `RoomJoinRequest`, `Message`, `MessageReaction`, and `SavedMessage`.

### Access rules

| Action | Owner | Member | Non-member |
| --- | :---: | :---: | :---: |
| Read/send room messages and replies | ✓ | ✓ | — |
| React to or save accessible messages | ✓ | ✓ | — |
| Change room profile picture | ✓ | ✓ | — |
| Rename room, manage invitations, approve requests | ✓ | — | — |
| Remove another member | ✓ | — | — |
| Leave room | — | ✓ | — |
| Request access through an invitation | Already a member | Already a member | ✓ |

Each room has exactly one owner. The current owner can transfer ownership to an existing member (becoming a regular member), or permanently delete the room. Owners must transfer ownership before leaving. Invitation actions require authentication, and existing members are directed into the room.

Messages from the signed-in account appear on the right; other members’ messages appear on the left. Authors can delete their own messages for everyone: text/recordings are removed and replaced by “This message was deleted”, while message order and existing thread replies remain. Deleted messages cannot be saved or reacted to. Deletion updates arrive through Socket.IO notifications and authenticated API reconciliation.

## API overview

The frontend sends a Clerk bearer token with authenticated requests. Representative endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/users/sync` | Create/update the authenticated user's database row |
| `GET` · `POST` | `/api/rooms` | List your rooms / create a room |
| `GET` · `PATCH` | `/api/rooms/:roomId` | Read room details / owner rename |
| `GET` | `/api/rooms/:roomId/members` | List room members |
| `DELETE` | `/api/rooms/:roomId/members/:userId` | Owner removal of a member |
| `DELETE` | `/api/rooms/:roomId/members/me` | Leave a room |
| `GET` | `/api/rooms/:roomId/invite` | Owner invitation details |
| `POST` | `/api/invites/:code/requests` | Submit a join request |
| `GET` | `/api/rooms/:roomId/join-requests` | List room join requests |
| `PATCH` | `/api/rooms/:roomId/join-requests/:requestId` | Approve/reject a join request |
| `GET` · `POST` | `/api/rooms/:roomId/messages` | Paginated history / send a message |
| `POST` | `/api/rooms/:roomId/messages/voice` | Upload a voice message |
| `GET` · `POST` | `/api/rooms/:roomId/messages/:messageId/thread` | Read / reply to a thread |
| `PUT` | `/api/rooms/:roomId/messages/:messageId/reaction` | Update a reaction |
| `PUT` | `/api/rooms/:roomId/messages/:messageId/saved` | Save/unsave a message |
| `GET` · `POST` | `/api/rooms/:roomId/presence` | Read/update presence and typing |

History requests accept `limit` and an optional `before` cursor. The default page size is 30; older messages are prepended while preserving scroll position. The cursor belongs to that room's history and should be passed back as returned by the API.

## Development commands

Run these from their respective directories:

| Directory | Command | Purpose |
| --- | --- | --- |
| `Client` | `npm run dev` | Vite development server |
| `Client` | `npm run build` | Production frontend build |
| `Client` | `npm run preview` | Preview the frontend build |
| `Client` | `npm run lint` | ESLint |
| `Client` | `npm test` | Frontend utility tests |
| `Server` | `npm run dev` | API with Node watch mode |
| `Server` | `npm test` | Backend test suite |
| `Server` | `npx prisma migrate deploy` | Apply checked-in database migrations |

## Current boundaries

- **Media is local:** room pictures and voice recordings live under `Server/data/avatars` and `Server/data/voice`. Their files are not stored in Neon or committed to Git. A hosted deployment needs durable media storage.
- **Realtime targets one backend instance:** multiple instances require a shared Socket.IO adapter and shared presence. Notifications are not a durable event log; API reconciliation recovers persisted state.
- **Search/timeline cover loaded history:** older pages become available through message pagination; this is not full-database message search.
- **Deployment needs environment-specific configuration:** use production Clerk configuration, the deployed API URL, and the appropriate frontend CORS origin.

## Roadmap

### Implemented chat features

- [x] Clerk authentication and database user synchronization
- [x] Rooms, memberships, invitation links, and owner-approved access
- [x] Persistent, paginated text messaging and author message deletion
- [x] Owner transfer and owner-only room deletion
- [x] Link previews with cached thumbnails
- [x] Room picture uploads and voice messages
- [x] Threads, reactions, saved messages, room pins, and unread activity
- [x] Responsive shared design system and interactive message timeline

### Delivery and scaling

- [ ] Connect durable hosted storage for uploads and media
- [ ] Finalize hosted frontend/API/Clerk/database configuration
- [x] Socket.IO live updates, scoped subscriptions, reconnect catch-up and expiring typing
- [ ] Shared presence and Socket.IO adapter for multiple backend instances

## Documentation

Start with the [documentation index](docs/README.md). Detailed guides cover [architecture](docs/architecture.md), [implementation history](docs/implementation.md), [design](docs/design.md), [Socket.IO](docs/realtime.md), and the [UI kit](docs/ui/ui-kit.md). Previous milestone reports are grouped under `docs/reports/`.

Frontend-specific commands remain in [Client/README.md](Client/README.md).

## Contributing

Issues and pull requests are welcome. Keep changes focused, preserve room membership checks, and follow the existing route/controller/service/repository structure. For interface work, follow [the shared design direction](docs/design.md) and [the WiseRoom UI kit](docs/ui/ui-kit.md). Reuse the original animated logo, warm charcoal/ivory/orange tokens, Bricolage Grotesque headings, Hanken Grotesk UI/messages, and JetBrains Mono code/metadata.

## License

[MIT](LICENSE) © 2026 Mayank Singh Kashyap.
