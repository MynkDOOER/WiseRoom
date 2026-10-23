import { Parser } from "htmlparser2";
import sharp from "sharp";
import AppError from "../utils/AppError.js";
import { transaction } from "../utils/transaction.js";
import { requireRoomMembership } from "./roomService.js";
import { readPublicUrl } from "../utils/publicHttp.js";

const previews = new Map(),
  images = new Map(),
  pending = new Map(),
  rates = new Map();
let imageBytes = 0,
  active = 0;
const waiting = [];
const clean = (value, max = 300) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

function cached(cache, key) {
  const entry = cache.get(key);
  if (!entry || entry.expires < Date.now()) {
    if (entry && cache === images) imageBytes -= entry.value.length;
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}
function store(cache, key, value, ttl, limit) {
  if (cache.has(key) && cache === images)
    imageBytes -= cache.get(key).value.length;
  cache.delete(key);
  cache.set(key, { value, expires: Date.now() + ttl });
  if (cache === images) imageBytes += value.length;
  while (
    cache.size > limit ||
    (cache === images && imageBytes > 16 * 1024 * 1024)
  ) {
    const oldest = cache.keys().next().value;
    if (cache === images) imageBytes -= cache.get(oldest).value.length;
    cache.delete(oldest);
  }
}
async function work(key, operation) {
  if (pending.has(key)) return pending.get(key);
  if (pending.size >= 64)
    throw new AppError(503, "Link previews are busy. Try again shortly.");
  const promise = (async () => {
    if (active < 4) active++;
    else
      await new Promise((resolve, reject) => {
        const ticket = { resolve, timer: null };
        ticket.timer = setTimeout(() => {
          const index = waiting.indexOf(ticket);
          if (index !== -1) waiting.splice(index, 1);
          reject(
            new AppError(503, "Link previews are busy. Try again shortly."),
          );
        }, 7000);
        waiting.push(ticket);
      });
    try {
      return await operation();
    } finally {
      const next = waiting.shift();
      if (next) {
        clearTimeout(next.timer);
        next.resolve();
      } else active--;
    }
  })().finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}
export function limitPreviewRequests(userId) {
  const now = Date.now();
  for (const [key, entry] of rates) if (entry.until <= now) rates.delete(key);
  let entry = rates.get(userId);
  if (!entry) {
    if (rates.size >= 10000) throw new AppError(503, "Link previews are busy.");
    entry = { count: 0, until: now + 60000 };
    rates.set(userId, entry);
  }
  if (++entry.count > 120)
    throw new AppError(429, "Too many link previews. Please wait a minute.");
}

// Keep extraction aligned with Client/src/utils/messageLinks.js (code fences excluded).
function messageUrls(body) {
  const urls = [];
  for (const match of body
    .replace(/```[\s\S]*?```/g, "")
    .matchAll(/https?:\/\/[^\s<>"']+/g)) {
    try {
      const url = new URL(match[0].replace(/[.,!?;:]+$/, ""));
      if (
        !["https:", "http:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        urls.includes(url.href)
      )
        continue;
      urls.push(url.href);
      if (urls.length === 2) break;
    } catch {
      /* Invalid links remain ordinary message text. */
    }
  }
  return urls;
}
export async function authorizedLink(userId, roomId, messageId, index) {
  if (!/^[a-f\d-]{36}$/i.test(messageId || "") || !["0", "1"].includes(index))
    throw new AppError(400, "Invalid link preview.");
  return transaction(async (db) => {
    await requireRoomMembership(userId, roomId, db);
    const message = await db.message.findFirst({
      where: { id: messageId, roomId, deletedAt: null },
      select: { body: true },
    });
    const url = message && messageUrls(message.body || "")[Number(index)];
    if (!url) throw new AppError(404, "Link not found.");
    return url;
  });
}
function youtubeId(input) {
  const url = new URL(input);
  const host = url.hostname.toLowerCase();
  let id;
  if (host === "youtu.be") id = url.pathname.split("/")[1];
  else if (
    [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "music.youtube.com",
      "youtube-nocookie.com",
      "www.youtube-nocookie.com",
    ].includes(host)
  ) {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else if (/^\/(shorts|embed|live)\//.test(url.pathname))
      id = url.pathname.split("/")[2];
  }
  return /^[\w-]{11}$/.test(id || "") ? id : null;
}
function parsePage(html, base) {
  const meta = new Map();
  let title = "",
    inTitle = false,
    imageLink = "";
  const parser = new Parser(
    {
      onopentag(name, attrs) {
        if (name === "title") inTitle = true;
        if (name === "meta") {
          const key = (attrs.property || attrs.name || "").toLowerCase();
          if (!meta.has(key) && attrs.content) meta.set(key, attrs.content);
        }
        if (name === "link" && attrs.rel?.toLowerCase() === "image_src")
          imageLink ||= attrs.href;
      },
      ontext(text) {
        if (inTitle && title.length < 500) title += text;
      },
      onclosetag(name) {
        if (name === "title") inTitle = false;
      },
    },
    { decodeEntities: true },
  );
  parser.end(html);
  const source =
    meta.get("og:image") ||
    meta.get("og:image:url") ||
    meta.get("twitter:image") ||
    meta.get("twitter:image:src") ||
    imageLink;
  let imageUrl = null;
  try {
    if (source) {
      const url = new URL(source, base);
      if (["http:", "https:"].includes(url.protocol)) imageUrl = url.href;
    }
  } catch {
    /* No valid image. */
  }
  return {
    title: clean(meta.get("og:title") || meta.get("twitter:title") || title),
    description: clean(
      meta.get("og:description") ||
        meta.get("twitter:description") ||
        meta.get("description"),
      500,
    ),
    imageUrl,
  };
}
export async function getLinkPreview(url) {
  const hit = cached(previews, url);
  if (hit) return hit;
  return work(`page:${url}`, async () => {
    let preview = { title: "", description: "", imageUrl: null };
    let success = false;
    const id = youtubeId(url);
    if (id) {
      preview.imageUrl = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      preview.title = "YouTube video";
      try {
        const result = await readPublicUrl(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`,
          { maxBytes: 32768, accept: "application/json", timeout: 4000 },
        );
        const data = JSON.parse(result.body.toString("utf8"));
        preview.title = clean(data.title) || preview.title;
        preview.description = clean(data.author_name);
      } catch {
        /* The thumbnail does not depend on oEmbed availability. */
      }
      success = true;
    } else {
      try {
        const result = await readPublicUrl(url, {
          maxBytes: 512 * 1024,
          accept: "text/html,application/xhtml+xml",
        });
        if (!["text/html", "application/xhtml+xml"].includes(result.type))
          throw new Error("Not a webpage");
        preview = parsePage(result.body.toString("utf8"), result.url);
        success = true;
      } catch {
        /* Blocked or metadata-free sites retain the ordinary URL card. */
      }
    }
    store(previews, url, preview, success ? 15 * 60000 : 60000, 256);
    return preview;
  });
}
export async function getLinkImage(url) {
  const preview = await getLinkPreview(url);
  if (!preview.imageUrl) return null;
  const hit = cached(images, preview.imageUrl);
  if (hit !== undefined) return hit.length ? hit : null;
  return work(`image:${preview.imageUrl}`, async () => {
    let image = Buffer.alloc(0);
    try {
      const result = await readPublicUrl(preview.imageUrl, {
        maxBytes: 3 * 1024 * 1024,
        accept: "image/jpeg,image/png,image/webp,image/gif,image/avif",
      });
      if (
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "image/avif",
        ].includes(result.type)
      )
        throw new Error("Not a supported image");
      const decoder = sharp(result.body, {
        limitInputPixels: 20000000,
        animated: false,
      });
      const metadata = await decoder.metadata();
      if (
        !["jpeg", "png", "webp", "gif", "avif", "heif"].includes(
          metadata.format,
        )
      )
        throw new Error("Unsupported image format");
      image = await decoder
        .rotate()
        .resize({
          width: 640,
          height: 360,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 78 })
        .toBuffer();
    } catch {
      /* Bad images must not break messages. SVG and HTML are never served. */
    }
    store(
      images,
      preview.imageUrl,
      image,
      image.length ? 10 * 60000 : 60000,
      64,
    );
    return image.length ? image : null;
  });
}
