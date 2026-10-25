# Link previews

Chat, thread, saved-message and activity cards can show a website image alongside its title, description and original URL. Existing messages gain previews when loaded; no database migration or resend is needed.

## Flow

1. The browser extracts up to two distinct HTTP(S) URLs outside fenced code and waits until a card approaches the viewport.
2. It requests `GET /api/rooms/:roomId/messages/:messageId/link-preview?index=0` using the signed-in Clerk token. The server reads the URL from the stored, undeleted message after checking current membership; callers cannot supply arbitrary proxy URLs.
3. YouTube watch, short-link, Shorts, embed and live URLs use the video ID for the thumbnail. Public oEmbed supplies the title/author when available. Other sites supply Open Graph/Twitter metadata, with HTML title/description fallbacks. No page scripts execute.
4. If an image exists, the browser requests the corresponding `link-image?index=0` endpoint. The backend fetches, decodes, resizes and re-encodes it as WebP. The authenticated response becomes a temporary browser blob URL, revoked when the card unmounts.
5. Both endpoints recheck membership and message availability after remote work. Failed pages/images leave the original clickable URL card.

## Limits and privacy

- Only public HTTP(S) addresses on standard ports are allowed. DNS results are validated and pinned for each request; redirects repeat validation. Loopback, private, link-local and reserved addresses are rejected.
- Website requests carry no user token, cookies or authorization header. Browsers do not contact third-party preview image hosts directly.
- Bounded timeouts, redirects, response sizes, decoded image pixels, concurrency, queue size and authenticated request rates constrain remote work. SVG/HTML images and compressed HTTP bodies are rejected. Animated raster images use their first frame.
- Process-local caches hold up to 256 metadata entries (15 minutes) and 64 image entries (10 minutes, 16 MB total). Failures cache for one minute. Caches reset on server restart and are not shared between backend instances.
- Some sites block automated requests, omit metadata, require login, or publish unsupported images. Those links still work, but cannot be guaranteed a thumbnail. The image proxy only serves thumbnails for links in accessible messages.

Implementation: `Server/utils/publicHttp.js`, `Server/services/linkPreviewService.js`, `Server/controllers/linkPreviewController.js`, `Client/src/api/linkPreviews.js`, and `Client/src/components/MessageLinks.jsx`.
