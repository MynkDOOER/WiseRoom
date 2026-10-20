import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import AppError from "./AppError.js";
// Development-local capability key. Restarting the server invalidates old picture URLs.
const secret = randomBytes(32);
const signature = (text) =>
  createHmac("sha256", secret).update(text).digest("base64url");
export function roomAvatarUrl(roomId, userId, key) {
  const payload = Buffer.from(
    JSON.stringify({ roomId, userId, key, expires: Date.now() + 15 * 60000 }),
  ).toString("base64url");
  return `/api/rooms/${encodeURIComponent(roomId)}/avatar?access=${payload}.${signature(payload)}`;
}
export function verifyAvatarAccess(token, roomId) {
  try {
    if (typeof token !== "string" || token.length > 2000) throw Error();
    const [payload, supplied, extra] = token.split(".");
    if (!payload || !supplied || extra) throw Error();
    const expected = Buffer.from(signature(payload));
    const actual = Buffer.from(supplied);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
      throw Error();
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (
      claims.roomId !== roomId ||
      !claims.userId ||
      !claims.key ||
      !Number.isFinite(claims.expires) ||
      claims.expires <= Date.now()
    )
      throw Error();
    return claims;
  } catch {
    throw new AppError(403, "This picture link expired. Refresh the room.");
  }
}
