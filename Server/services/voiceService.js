import { randomUUID } from "node:crypto";
import prisma from "../config/db.js";
import AppError from "../utils/AppError.js";
import { validateVoiceUpload } from "../utils/voiceUpload.js";
import { storeVoice, loadVoice, deleteVoice } from "../config/localVoiceStore.js";
import { requireRoomMembership } from "./roomService.js";
import { createVoiceMessage, findVoiceMessage } from "../repositories/messageRepository.js";

export async function sendVoiceForMember(userId, roomId, data, contentType, duration) {
  const { mime, extension, durationMs } = validateVoiceUpload(data, contentType, duration);
  // Check before writing and again inside the insert transaction to cover membership changes.
  await requireRoomMembership(userId, roomId);
  const voiceKey = `${randomUUID()}.${extension}`;
  await storeVoice(voiceKey, data);
  try {
    return await prisma.$transaction(async tx => {
      await requireRoomMembership(userId, roomId, tx);
      return createVoiceMessage({ roomId, authorId: userId, voiceKey, voiceMime: mime, voiceDurationMs: durationMs }, tx);
    }, { isolationLevel: "Serializable", maxWait: 5000, timeout: 10000 });
  } catch (error) {
    await deleteVoice(voiceKey);
    if (error.code === "P2034") throw new AppError(409, "Room activity changed. Your recording is still available; try sending again.");
    throw error;
  }
}

export async function getVoiceForMember(userId, roomId, messageId) {
  const message = await prisma.$transaction(async tx => {
    await requireRoomMembership(userId, roomId, tx);
    return findVoiceMessage(roomId, messageId, tx);
  }, { isolationLevel: "Serializable" });
  if (!message?.voiceKey) throw new AppError(404, "Voice message not found.");
  try { return { data: await loadVoice(message.voiceKey), mime: message.voiceMime }; }
  catch (error) { if (error.code === "ENOENT") throw new AppError(404, "This recording is no longer available on this server."); throw error; }
}
