# WiseRoom — reference landing redesign

Current design: [design.md](../design.md). Later logo/interior work: [interior-consistency.md](interior-consistency.md).

## Reference

The user's WiseRoom Genspark landing page and seven screenshots supplied on October 20, 2026. The public reference HTML/CSS were inspected to reproduce the actual typefaces, palette, dimensions, illustration geometry and animation timing. Designer injection scripts were excluded.

## Implemented

- Public `/` landing: floating pill navigation, grid and warm glow, outlined hero word, orange conversation headline, the original animated artwork shared through `WiseRoomLogo.jsx`, two hero actions, three-column illustrative room preview, marquee, four animated onboarding stages, feature grid, account entry, and oversized outlined footer wordmark.
- Fonts: Bricolage Grotesque display, Hanken Grotesk interface/body, JetBrains Mono labels/code. Main colors: `#0F0C11`, `#151118`, `#1A161D`, `#F4EDE6`, `#B9AFA8`, `#FF5A1F`.
- Preview room buttons change the illustrative chat conversation. A member panel shows example participants. The preview is isolated from real rooms and labeled as illustrative; it does not write database records.
- The account section mounts actual Clerk SignIn with shared padded fields, full-width social buttons, an orange Continue action, and isolated styles for signed-out users. Signed-in users see an action into their real workspace.
- Signed-in dashboard is now `/workspace`. Sidebar Home, room error/back links, leave-room redirect, and default auth return paths point there. Six-character invite return paths remain allowed. Existing room/inbox/thread/saved/join URLs stay unchanged.
- Workspace, dialogs, composer, sidebar branding, and authentication screens share the new warm orange/ivory language. Existing data and backend behavior are retained; Socket.IO was not introduced.
- Small screens have a compact navigation bar, scaled hero, single-column preview/walkthrough/features, and stacked account section. Scroll reveal effects clean up on unmount. Reduced-motion preferences settle content without entrance animation; the marquee has a pause control.

## Main implementation files

- `Client/src/Pages/LandingPage.jsx`
- `Client/src/components/landing/LandingSections.jsx`
- `Client/src/styles/landing.css`
- `Client/src/styles/conversation-theme.css`, `auth.css`, `authAppearance.js`, and the final `interior.css` treatment
- `Client/src/components/WiseRoomLogo.jsx`
- `Client/src/styles/reference.css`, `composer.css`, `brand.css`
- `Client/src/components/AuthLayout.jsx`
- `Client/src/App.jsx`, `main.jsx`, `Client/index.html`
- Navigation links in WorkspaceLayout, ChatPanel, RoomPage, JoinRoomPage, UIKitPage; `utils/authReturn.js`
- `docs/ui/ui-kit.md` and the UI kit page reflect current colors and typography.
- Existing navigation assertion updated to expect `/workspace` as the safe fallback.

## Landing verification (historical milestone results)

- ESLint and production build.
- Desktop browser comparison with the live source at 1280px: exact font families, hero font sizing/spacing, background, navbar, walkthrough layout, and feature layout.
- Preview room switching and corresponding illustrative conversation.
- Mobile browser at 390 × 844: hero, preview, no horizontal overflow, account entry into `/workspace`, real navigation drawer, and existing Design studio room/history/composer.
- Existing real authentication was used to reach the workspace; no new sign-in credentials were entered and no new messages or rooms were created for this change.
- Automated tests were not run for this visual update.

## Deliberate differences from the static reference

- Clerk remains a real component, so enabled providers, account state, and error/verification steps depend on the configured Clerk application. The static reference's painted sign-in form was not retained.
- Signed-in visitors receive a workspace-entry card in the account section.
- The landing preview shows illustrative multi-room chat conversations. Actual room participation starts through the authenticated workspace.
- Footer links use the actual repository/commit history/issue page instead of `#` placeholders. Security navigation targets the privacy feature card.
- Mobile and accessibility adaptations include reduced motion, visible focus states, and a marquee pause button.
