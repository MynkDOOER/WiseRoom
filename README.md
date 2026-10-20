<p align="center">
  <img src="Client/public/favicon.svg" alt="WiseRoom orange and ivory conversation logo" width="76" height="76" />
</p>

<h1 align="center">WiseRoom — AI Collaboration Workspace with Room-Scoped RAG</h1>

<p align="center"><strong>A shared space. A clearer mind.</strong></p>

<p align="center">
  Multiplayer conversations and document-grounded AI, organized around your team's rooms.<br />
  Building a retrieval-augmented generation pipeline on a React, Node.js, Neon PostgreSQL, Prisma, and Clerk foundation.
</p>

<p align="center">
  <a href="#rag-pipeline">RAG pipeline</a> ·
  <a href="#project-progress">Progress</a> ·
  <a href="#screenshots">Screenshots</a> ·
  <a href="#features">Features</a> ·
  <a href="#getting-started">Getting started</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#roadmap">Roadmap</a>
</p>

---

WiseRoom is being built as an **AI-powered collaboration platform with room-scoped retrieval-augmented generation (RAG)**. Each room brings together a team's people, conversations, and documents. The goal is to let members ask `@wise` a question and receive an answer grounded in that room's uploaded knowledge, with citations back to the source.

The working foundation already supports authentication, private rooms, owner-approved access, persistent messaging, voice notes, and collaboration tools. The remaining milestones build the document ingestion, embeddings, retrieval, and grounded-answer pipeline on top of that foundation.

**Development status:** Active development. The collaboration foundation is implemented; document ingestion and RAG question answering are remaining milestones. The landing page demonstrates the intended AI experience.

## The product vision

For project teams, study groups, research collaborators, and communities, useful knowledge is spread across discussions and documents. WiseRoom's intended workflow keeps that context inside a shared room:

1. **Bring your people:** create a private room and approve who joins.
2. **Build shared context:** discuss ideas and upload the room's source documents.
3. **Ask together:** mention `@wise` in the conversation with a question.
4. **Retrieve relevant evidence:** find passages from documents belonging to that room.
5. **Answer with sources:** generate a contextual response that the room can check against its documents.

Room membership is the access boundary for conversations today and will also govern document access and retrieval in the RAG milestones.

## RAG pipeline

**Target architecture for the remaining milestones.** The pipeline has two connected paths: preparing room knowledge and answering a member's question.

```mermaid
flowchart TB
  subgraph Ingestion[Document ingestion and indexing]
    A[Authorized room document upload] --> B[Extract text and source metadata]
    B --> C[Split into retrievable chunks]
    C --> D[Generate embeddings]
    D --> E[Room-scoped vector index]
  end
  subgraph Answering[Grounded question answering]
    F[Member asks @wise] --> G[Verify current room membership]
    G --> H[Embed question and retrieve room passages]
    H --> I[Assemble question, context, and source references]
    I --> J[Generate answer with an LLM]
    J --> K[Return answer and document citations to the room]
  end
  E --> H
```

| Pipeline stage | Intended responsibility |
| --- | --- |
| Document ingestion | Accept authorized room uploads and track processing state. |
| Text extraction | Read document content while retaining source/page/section metadata where available. |
| Chunking | Split content into useful passages that can be retrieved with their surrounding meaning. |
| Embeddings and indexing | Generate vectors and associate each indexed chunk with its room and source document. |
| Retrieval | Search the current room's indexed knowledge for passages relevant to the question. |
| Context assembly | Build bounded model context from retrieved evidence and the question. |
| Answer generation | Produce a grounded response and handle missing or insufficient supporting evidence. |
| Citations | Link the answer back to the source passages so members can inspect the evidence. |

The remaining implementation must carry room permissions through upload, indexing, retrieval, and citation access. Processing failures, document changes/removal, and retrieval quality also belong to these milestones. The current repository does not yet configure an embedding model, vector store, or LLM provider.

## Project progress

| Workstream | Status | Scope |
| --- | --- | --- |
| Authentication and user persistence | Implemented | Clerk identity and synchronized PostgreSQL users. |
| Rooms and membership | Implemented | Owners/members, invitations, join requests, approval, removal, and room settings. |
| Persistent messaging | Implemented | Member-only text/voice messages, cursor history, and code rendering. |
| Collaboration | Implemented | Threads, reactions, saved messages, pins, unread activity, presence, and typing via polling. |
| Application experience | Implemented | Responsive workspace, authentication screens, shared design system, and message timeline. |
| Document ingestion | Remaining | Authorized uploads, text extraction, metadata, and processing lifecycle. |
| RAG indexing and retrieval | Remaining | Chunking, embeddings, vector indexing, and room-scoped semantic retrieval. |
| Grounded AI conversations | Remaining | `@wise` question flow, context assembly, answer generation, and source citations. |
| RAG validation and deployment | Remaining | Permission/isolation checks, retrieval/answer evaluation, durable storage, and hosted configuration. |

The shared interface supports both collaborative conversations and the upcoming document-grounded AI workflow.

## Features

The following capabilities are implemented in the current collaboration foundation. The RAG capabilities above describe the remaining product milestones.

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
- **Emoji/expression insertion**, message reactions, and threaded replies.
- **Saved messages**, pinned rooms, unread counts, and an activity Inbox.
- **Online presence and typing indicators**, plus automatic message updates through authenticated polling.
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

Screenshots use development rooms. Example AI/document content appears only in the labeled landing-page preview.

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

The RAG layer will add document processing, embedding generation, vector retrieval, model integration, and source citation handling. Those integrations are not installed or wired into the current application yet.

**Live update implementation:** messages, presence, typing, and activity currently use polling. Socket.IO and WebSocket delivery are not part of the current implementation. Presence is held in server memory; messages and collaboration records are persisted in PostgreSQL.

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
│   └── UI-KIT.md
├── Server/
│   ├── routes/             # Express API routes
│   ├── controllers/        # Request/response handling
│   ├── services/           # Permissions, validation, and business logic
│   ├── repositories/       # Prisma database queries
│   ├── middlewares/        # Authentication, errors, and invitation rate limits
│   ├── prisma/             # Schema and checked-in migrations
│   ├── data/               # Local media; excluded from Git
│   └── tests/
└── docs/images/            # Repository screenshots
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

Owners retain their membership; ownership transfer is not currently implemented. Invitation actions require authentication, and existing members are directed into the room.

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
- **Live updates use polling:** presence is process-local, so it is not yet shared across multiple API instances.
- **Search/timeline cover loaded history:** older pages become available through message pagination; this is not full-database message search.
- **AI/document features are a preview:** no document indexing, embeddings, retrieval-augmented generation, or `@wise` answers are implemented yet.
- **Deployment needs environment-specific configuration:** use production Clerk configuration, the deployed API URL, and the appropriate frontend CORS origin.

## Roadmap

### Implemented foundation

- [x] Clerk authentication and database user synchronization
- [x] Rooms, memberships, invitation links, and owner-approved access
- [x] Persistent, paginated text messaging
- [x] Room picture uploads and voice messages
- [x] Threads, reactions, saved messages, room pins, and unread activity
- [x] Responsive shared design system and interactive message timeline

### Remaining RAG milestones

- [ ] Build room-authorized document upload and processing records
- [ ] Extract text and preserve source metadata for citations
- [ ] Implement chunking and embedding generation
- [ ] Store/index document vectors with room and document boundaries
- [ ] Retrieve relevant passages for a member's question
- [ ] Assemble evidence-backed context and integrate the answer model
- [ ] Connect `@wise` questions and cited answers to the room conversation
- [ ] Handle processing failures, document removal/re-indexing, and unsupported questions
- [ ] Evaluate retrieval relevance, grounded answers, citations, and cross-room isolation

### Delivery and scaling

- [ ] Connect durable hosted storage for uploads and media
- [ ] Finalize hosted frontend/API/Clerk/database configuration
- [ ] Evaluate push-based updates and shared presence infrastructure in a later milestone

## Contributing

Issues and pull requests are welcome. Keep changes focused, preserve room membership checks, and follow the existing route/controller/service/repository structure. For interface work, follow [the shared design direction](DESIGN.md) and [the WiseRoom UI kit](Client/UI-KIT.md). Reuse the original animated logo, warm charcoal/ivory/orange tokens, Bricolage Grotesque headings, Hanken Grotesk UI/messages, and JetBrains Mono code/metadata.

## License

[MIT](LICENSE) © 2026 Mayank Singh Kashyap.
