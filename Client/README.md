# WiseRoom frontend

React 19, Vite 8, React Router, Clerk, and Socket.IO power WiseRoom's real-time multi-room chat interface.

- [Product overview, setup, architecture, progress, and roadmap](../README.md)
- [Current shared design direction](../docs/design.md)
- [UI component kit](../docs/ui/ui-kit.md)

## Current interface

The public homepage, workspace, conversations, authentication, dialogs, and member controls share warm charcoal surfaces, ivory text, and orange actions. Use Bricolage Grotesque for display headings, Hanken Grotesk for interface/messages, and JetBrains Mono for code/technical labels.

Reuse `WiseRoomLogo.jsx` for the original animated logo. Chat uses a framed conversation, compact single-row composer, actual member context, and a pointer/keyboard message timeline. Preserve focus states, reduced-motion support, permissions, and real data/loading/error states.

## Local development

Follow the root README to configure `Client/.env`, the API, Clerk, and Neon. From this directory:

```bash
npm ci
npm run dev
```

Frontend: `http://localhost:5173`. Default API: `http://localhost:3000`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview the build |
| `npm run lint` | ESLint |
| `npm test` | Frontend utility tests |

## Styles and routes

`src/main.jsx` loads the styles; `styles/interior.css` is last and defines the final shared visual treatment. `styles/auth.css` and `styles/authAppearance.js` style real Clerk forms. Landing styles are scoped and exclude Clerk descendants from their reset. See [design.md](../docs/design.md) for the complete cascade.

Public landing: `/`. Authentication: `/sign-in`, `/sign-up`. Signed-in views: `/workspace`, `/rooms/:roomId`, `/inbox`, `/threads`, `/saved`, `/join/:code`. The `/ui-kit` component reference is development-only.

The landing chat conversations are illustrative. Signed-in rooms, messages, members, and activity come from authenticated APIs and live updates.
