# WiseRoom UI kit

The kit is part of the application source, not a separate mockup. During development open `http://localhost:5173/ui-kit`. This reference route is excluded from production routing; the shared components/styles remain in production.

## Foundations

| Token | Value | Use |
| --- | --- | --- |
| `--canvas` | `#02060E` | Near-black workspace |
| `--paper` | `#141020` | Fields, panels and incoming messages |
| `--ink` | `#F7F5FF` | Primary text; separate edge and shadow tokens |
| `--sidebar` | `#0C0914` | Navigation surface |
| `--accent` | `#9303C5` | Violet primary actions, with white text |
| `--highlight` | `#351444` | Active room, owner badge, feedback |
| `--tint` | `#241130` | Outgoing messages and quiet interaction surfaces |
| `--muted` | `#B6AEC6` | Secondary text |

JetBrains Mono is the interface, message and code family. Fira Code is used for metadata, timestamps, small labels, counts and keyboard hints. Body messages use 15px/1.75, UI controls 13–14px and most metadata 11–12px. Headings are bold with restrained tracking. Avoid all-caps body copy or heavy shadows on every message.

Spacing tokens use 4/8/12/16/24/32px. Actions use 1.5px outlines, 6px radii and small solid offset shadows. Dialogs use 2px borders and a larger hard shadow. Inputs and message cards have quieter outlines. `--focus` is reserved for a clear keyboard ring, not decorative accents.

## Shared components

- `src/components/ui/Button.jsx`: primary, secondary, danger, danger-outline; explicit disabled/loading text supplied by the caller. Defaults to `type="button"`; use `type="submit"` in forms.
- `src/components/ui/TextField.jsx`: label/input/hint/error IDs, `aria-describedby`, `aria-invalid`, and React 19 ref support.
- `src/components/ui/Badge.jsx`: neutral/accent/danger states with text labels.
- `src/components/ui/RoomAvatar.jsx`: photo or stable room initials; failed URLs fall back to initials.
- `src/components/Modal.jsx`: native dialog focus containment, Escape/backdrop handling, unique headings and return focus.
- `src/styles/tokens.css`: shared palette, typography, spacing and geometry.
- `src/styles/ui.css`: primitive styling, disabled/focus/hover/pressed states and reduced-motion support.
- `src/index.css`: shell, chat, members, room management, responsive layouts and the reference page.

```jsx
import Button from "./components/ui/Button";
import TextField from "./components/ui/TextField";

<TextField label="Room name" value={name} onChange={event => setName(event.target.value)}
  hint="3–80 characters." error={error} />
<Button type="submit" variant="primary" disabled={busy}>
  {busy ? "Saving…" : "Save name"}
</Button>
```

## UX rules

- Home has no logo illustration, slogans or large room cards. Compact rows and the persistent sidebar show actual rooms.
- The sidebar remembers a 200–320px width and collapse state. Drag its divider, use Left/Right/Home/End while focused, or double-click to reset to 240px.
- The Workspace switcher is a small anchored arc with names, search, actual membership rooms and page controls for longer lists. Mobile uses a bottom sheet.
- Keep chat content-sized and chronological, with no repeated hard shadows. Preserve drafts/scroll while changing room settings or inspecting members.
- On narrow screens, invitations are available through member details and room settings; the separate header Invite button is hidden to keep the room name legible.
- Keep existing loading/error/retry behavior. Do not introduce controls for unimplemented AI, attachments, realtime delivery or online presence.
- Components respect reduced motion, visible focus and larger coarse-pointer targets. Browser checks do not constitute full accessibility certification.

## Checks performed

Frontend ESLint, production build and 3 navigation tests pass. Live browser checks covered the UI kit modal focus return, Home, sidebar resize/collapse persistence, switcher navigation/search, room settings, local image crop/zoom/save/reset and mobile layouts at 390px/320px. See `../IMPLEMENTATION.md` for backend verification and limits.

## Dark composer update

- Royal violet accents use `#9303C5`, on `#02060E` with dark purple surfaces. Bright white outlines highlight the composer, dialogs and primary actions. Structural borders stay quieter.
- `src/styles/composer.css` is imported after the app styles and contains the dark conversation/composer refinements.
- The composer is one 56px row at rest: expression picker, code tool, textarea and microphone. Send appears when text exists. There is no persistent toolbar/footer below it. The character counter appears at 3,500 characters; keyboard instructions remain available to assistive technology and via the textarea tooltip.
- Expressions include searchable emoji and kaomoji, inserted at the saved cursor position.
- Code notes have a language selector, formatting-preserving textarea and validation against the 4,000-character message limit including fences. Embedded triple fences are rejected with guidance. Text remains escaped by React.
- Voice uses an adapted React Bits VoicePill interaction (tap/hold/slide cancel), Hugeicons and a real microphone waveform. One stream feeds both MediaRecorder and the analyser. No simulated recording is shown. A preview requires explicit Send voice; cancelling, permission failure, leaving the page or hiding the tab releases the microphone.
- Preview audio stays local until sent. Browser recording requires HTTPS or localhost. Supported recording formats are WebM/Opus, Ogg/Opus and MP4, according to browser support. Limits: two minutes / 5 MB. Browser codec support can differ; playback errors are surfaced.
- See `licenses/react-bits-LICENSE.md` for upstream attribution and conditions.

Verification for this update: frontend lint/build and 3 existing tests pass; 65 backend checks pass. Desktop/mobile checks cover the compact row, expression search/insertion, C++ insertion, oversize validation and overflow. The user confirmed real microphone recording and playback. Socket.IO remains excluded.
