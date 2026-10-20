import { randomUUID } from "node:crypto";
import sharp from "sharp";
import AppError from "../utils/AppError.js";
import { transaction } from "../utils/transaction.js";
import { roomAvatarUrl, verifyAvatarAccess } from "../utils/avatarAccess.js";
import { requireRoomMembership } from "./roomService.js";
import { updateRoom } from "../repositories/roomRepository.js";
import {
  storeAvatar,
  loadAvatar,
  deleteAvatar,
} from "../config/localAvatarStore.js";

async function processAvatar(body) {
  if (!Buffer.isBuffer(body) || !body.length || body.length > 2 * 1024 * 1024)
    throw new AppError(400, "Upload a JPEG, PNG, or WebP image up to 2 MB.");
  try {
    const image = sharp(body, {
      limitInputPixels: 20000000,
      failOn: "warning",
    });
    const metadata = await image.metadata();
    if (
      !["jpeg", "png", "webp"].includes(metadata.format) ||
      (metadata.pages || 1) > 1
    )
      throw Error();
    return await image
      .rotate()
      .resize(512, 512, { fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new AppError(
      400,
      "This image couldn’t be processed. Use a non-animated JPEG, PNG, or WebP.",
    );
  }
}
export async function saveRoomAvatar(userId, roomId, body) {
  await requireRoomMembership(userId, roomId);
  const data = await processAvatar(body);
  const key = `${randomUUID()}.webp`;
  await storeAvatar(key, data);
  let previousKey;
  try {
    await transaction(async (tx) => {
      const { room } = await requireRoomMembership(userId, roomId, tx);
      previousKey = room.avatarKey;
      await updateRoom(
        roomId,
        { avatarKey: key, avatarUpdatedAt: new Date() },
        tx,
      );
    });
  } catch (error) {
    await deleteAvatar(key).catch(() => {});
    throw error;
  }
  // Unique immutable keys make concurrent replacements safe: never delete the new key.
  if (previousKey && previousKey !== key)
    await deleteAvatar(previousKey).catch(() => {});
  return { avatarUrl: roomAvatarUrl(roomId, userId, key) };
}
export async function resetRoomAvatar(userId, roomId) {
  const previousKey = await transaction(async (tx) => {
    const { room } = await requireRoomMembership(userId, roomId, tx);
    await updateRoom(
      roomId,
      { avatarKey: null, avatarUpdatedAt: new Date() },
      tx,
    );
    return room.avatarKey;
  });
  await deleteAvatar(previousKey).catch(() => {});
}
export async function readRoomAvatar(roomId, access) {
  const claims = verifyAvatarAccess(access, roomId);
  const { room } = await requireRoomMembership(claims.userId, roomId);
  if (room.avatarKey !== claims.key)
    throw new AppError(404, "Picture changed. Refresh the room.");
  try {
    return await loadAvatar(claims.key);
  } catch {
    throw new AppError(404, "Room picture is unavailable.");
  }
}
