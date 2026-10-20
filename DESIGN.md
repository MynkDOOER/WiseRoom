# WiseRoom design system

This is the current visual direction for the whole project. The public homepage is the reference for workspace, chat, authentication, dialogs, member controls, and upcoming room-scoped RAG features.

## Palette

Warm charcoal surfaces, ivory text, restrained orange actions, thin warm dividers, rounded panels, and subtle depth.

| Role | Token/value |
| --- | --- |
| Canvas | `--canvas: #0F0C11` |
| Sidebar | `--sidebar: #151118` |
| Elevated surface | `--paper: #1A161D` |
| Main text | `--ink: #F4EDE6` |
| Secondary text | `--muted: #B9AFA8` |
| Primary action | `--accent: #FF5A1F` |
| Hover | `--accent-hover: #FF7A3D` |
| Divider | `--line: rgba(255, 240, 230, 0.08)` |
| Border | `--edge: rgba(255, 240, 230, 0.14)` |
| Selection | `--highlight: #FF5A1F1A` |
| Focus | `--focus: #FF956A` |

Use orange for actions, active navigation, room emphasis, and future AI accents. Pastel avatars distinguish people; body text remains neutral.

## Typography and branding

- **Bricolage Grotesque:** display headings, including the landing, workspace, and dialogs.
- **Hanken Grotesk:** interface copy, messages, controls, and inline conversation names/times.
- **JetBrains Mono:** wordmark, code, compact section labels, and technical metadata.

Reuse `Client/src/components/WiseRoomLogo.jsx`. Its original SVG paths, colors, and proportions match `Client/public/favicon.svg`. The homepage header/footer, sidebar, and authentication share the component. Its short entrance and hover/focus animation settles to a static mark when reduced motion is requested.

## Layout and behavior

- **Public `/`:** pill navigation, editorial hero, outlined word/orange emphasis, subtle grid/glow, illustrative room preview, pipeline, feature grid, real account entry, and outlined footer wordmark.
- **Workspace `/workspace`:** personal greeting, real unread/request state, creation/invitation actions, compact room directory, and activity column.
- **Navigation:** remembered desktop sidebar sizing (200–320px), collapse, mobile drawer, and actual-room switching.
- **Chat:** framed dark surface, left-aligned chronological groups, small pastel avatars, inline author/time rows, code cards, voice controls, reactions, and threads.
- **History:** slim timeline ruler with previews, pointer/keyboard navigation, current progress, and saved markers derived from loaded messages. Preserve pagination, reader position, and latest-message anchoring.
- **Composer:** compact single-row expression/code/voice controls, expandable input, and Send. Enter sends; Shift+Enter inserts a newline. Recording preview/errors appear only when relevant.
- **Room context:** actual desktop member/details panel; narrow layouts retain member/settings access in the header. Invite stays owner-only and visible on mobile.
- **Authentication:** shared Clerk appearance, padded fields, full-width social buttons, orange Continue, readable labels, visible focus. Landing resets exclude Clerk descendants.
- **Dialogs/activity:** the same palette, fonts, borders, and primary actions; preserve native dialog focus containment/return and real loading/error/empty states.

## Stylesheet ownership

`Client/src/main.jsx` imports `index.css` (base tokens/primitives/layout), then `composer.css`, `reference.css`, `brand.css`, `landing.css`, `conversation-theme.css`, `auth.css`, and **`interior.css` last**. The final shared visual treatment is in `interior.css`. `authAppearance.js` supplies Clerk appearance hooks.

Reuse these shared components/tokens rather than creating separate page themes. Font imports live in `Client/index.html`.

## RAG and real data

Apply this same system to future document ingestion, retrieval, citations, and `@wise` answers. Those RAG milestones remain to implement. The homepage AI/document conversation is labeled as a preview; live workspace content comes from actual records.

## Related documentation

- [UI component kit](Client/UI-KIT.md)
- [Product vision, setup, progress, and roadmap](README.md)
- [Implementation and historical verification](IMPLEMENTATION.md)
- [Interior implementation](REPORT-INTERIOR-CONSISTENCY.md)
