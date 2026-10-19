import AppError from "./AppError.js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function encodeMessageCursor(roomId, message) {
  return Buffer.from(JSON.stringify({
    v: 1,
    roomId,
    createdAt: message.createdAt.toISOString(),
    id: message.id,
  })).toString("base64url");
}

export function decodeMessageCursor(value, roomId) {
  if (value === undefined) return null;
  try {
    if (typeof value !== "string" || value.length > 1024 || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error();
    const bytes = Buffer.from(value, "base64url");
    if (bytes.toString("base64url") !== value) throw new Error();
    const cursor = JSON.parse(bytes.toString("utf8"));
    if (!cursor || cursor.v !== 1 || cursor.roomId !== roomId || typeof cursor.id !== "string" || !uuid.test(cursor.id)) throw new Error();
    if (typeof cursor.createdAt !== "string" || new Date(cursor.createdAt).toISOString() !== cursor.createdAt) throw new Error();
    return { id: cursor.id, createdAt: new Date(cursor.createdAt) };
  } catch {
    throw new AppError(400, "Invalid message cursor. Refresh the conversation and try again.");
  }
}
