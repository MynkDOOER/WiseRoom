# Compact members UI — 2026-10-20

Applied to the main project at C:\Users\mayan\Downloads\WORKSPACE\WiseRoom.

## Current design

Follow [DESIGN.md](../DESIGN.md) and [UI-KIT.md](UI-KIT.md): warm charcoal, ivory, orange, Bricolage Grotesque headings, Hanken Grotesk copy, and JetBrains Mono labels. The elastic header stack opens the compact member card; the desktop RoomContextPanel complements it with actual members/details and existing settings/management actions. Narrow layouts retain header access.

## Member-card implementation record

- The header uses an elastic avatar stack and compact floating member card; mobile uses a bottom sheet. A desktop context panel now complements the card.
- Adapted the supplied VengeanceUI spring interaction to the existing React/plain CSS application. No new dependencies, demo identities, or external avatar services.
- Uses actual member names, roles, joined dates, and the signed-in Clerk user's existing photo. Other members use initials when the API has no photo.
- Member rows expand to show joined dates. Larger lists have search and avatar overflow controls.
- Preserved existing owner-only invitation loading/copying and member leave confirmation. Opening or refreshing members does not remount the chat.
- Added keyboard focus animation, tooltips, reduced-motion support, unique dialog heading IDs, and focus restoration.

## Files

- src/components/ElasticStack.jsx (new)
- src/components/MemberAvatar.jsx (new)
- src/components/MembersPopover.jsx (new)
- src/components/Modal.jsx
- src/Pages/RoomPage.jsx
- src/index.css

Backend, schema, APIs, dependencies, logo and credentials were not edited.

## Member-card checks (historical milestone results)

- Main frontend ESLint and production build passed (102 modules).
- All 38 existing backend tests passed. These use mocked dependencies, not a live multi-user integration test.
- git diff --check passed.
- Signed-in browser: opened actual rooms, member card, real joined date, row expansion/collapse, refresh and owner invitation retrieval.
- Unsent draft survived opening/refreshing/closing the member card. Chat width stayed unchanged.
- Escape closed the card and restored avatar focus. Keyboard focus showed the name/role tooltip and scale(1.2) animation.
- Checked desktop 1280x720 and mobile 390x844 / 320x740. No horizontal document overflow. The 320px sheet measured 296px wide with 12px margins.
- No browser console errors observed.

## Verification limits

- The available signed-in account owns two single-member rooms. Multi-avatar neighbor displacement, larger-list search/overflow, and a non-owner leave dialog were not exercised with live users. No memberships or messages were added for this check.
- Invitation retrieval succeeded, but the browser clipboard action timed out; copy completion was not confirmed. Existing manual token selection remains available.
- That milestone did not add live transport. The 2026-10-22 realtime milestone adds Socket.IO updates, expiring typing and authenticated API reconciliation; manual refresh remains available. See [REALTIME.md](../REALTIME.md).

Reference: https://github.com/Ashutoshx7/VengeanceUI (ElasticStack supplied by the user).
