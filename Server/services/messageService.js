import prisma from "../config/db.js";
import { deleteVoice } from "../config/localVoiceStore.js";
import AppError from "../utils/AppError.js";
import {
  decodeMessageCursor,
  encodeMessageCursor,
} from "../utils/messageCursor.js";
import { requireRoomMembership } from "./roomService.js";
import {
  messageFields,
  createMessage,
  findMessagePage,
} from "../repositories/messageRepository.js";

async function withMembershipTransaction(operation) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: "Serializable",
        maxWait: 5000,
        timeout: 10000,
      });
    } catch (error) {
      if (error.code !== "P2034") throw error;
      // Prisma rolled back the failed attempt, so retrying does not duplicate a send.
    }
  }
  throw new AppError(409, "Room activity changed. Please try again.");
}

export const sendMessageForMember = async (userId, roomId, body) => {
  if (
    typeof body !== "string" ||
    body.trim().length === 0 ||
    body.trim().length > 4000
  ) {
    throw new AppError(400, "Messages must contain 1 to 4,000 characters.");
  }
  return withMembershipTransaction(async (tx) => {
    await requireRoomMembership(userId, roomId, tx);
    return createMessage({ roomId, authorId: userId, body: body.trim() }, tx);
  });
};

export const getMessagesForMember = async (userId, roomId, options = {}) => {
  const rawLimit = options.limit;
  if (
    rawLimit !== undefined &&
    (typeof rawLimit !== "string" ||
      !/^[1-9]\d{0,2}$/.test(rawLimit) ||
      Number(rawLimit) > 100)
  ) {
    throw new AppError(
      400,
      "Message limit must be a whole number from 1 to 100.",
    );
  }
  const limit = rawLimit === undefined ? 30 : Number(rawLimit);
  const before = decodeMessageCursor(options.before, roomId);

  return withMembershipTransaction(async (tx) => {
    await requireRoomMembership(userId, roomId, tx);
    const records = await findMessagePage(
      roomId,
      { before, limit, userId },
      tx,
    );
    const hasMore = records.length > limit;
    const page = records.slice(0, limit);
    const nextCursor = hasMore
      ? encodeMessageCursor(roomId, page[page.length - 1])
      : null;
    return {
      syncCursor: page.length
        ? encodeMessageCursor(roomId, page[0])
        : encodeMessageCursor(roomId, {
            id: "00000000-0000-4000-8000-000000000000",
            createdAt: new Date(),
          }),
      messages: page.reverse(),
      pagination: { hasMore, nextCursor },
    };
  });
};

// Keep the row as a tombstone so pagination, dates and thread links stay stable.
export const deleteMessageForAuthor = (userId, roomId, messageId) => {
  if (typeof messageId !== "string" || !/^[0-9a-f-]{36}$/i.test(messageId))
    throw new AppError(400, "Invalid message ID.");
  return withMembershipTransaction(async (tx) => {
    await requireRoomMembership(userId, roomId, tx);
    const message = await tx.message.findFirst({
      where: { id: messageId, roomId },
    });
    if (!message) throw new AppError(404, "Message not found in this room.");
    if (message.authorId !== userId)
      throw new AppError(403, "You can only delete your own messages.");
    const updated = await tx.message.update({
      where: { id: messageId },
      data: {
        deletedAt: message.deletedAt || new Date(),
        body: "",
        voiceKey: null,
        voiceMime: null,
        voiceDurationMs: null,
      },
      select: messageFields,
    });
    await tx.messageReaction.deleteMany({ where: { messageId } });
    await tx.savedMessage.deleteMany({ where: { messageId } });
    return {
      message: { ...updated, reactions: [], savedBy: [] },
      voiceKey: message.voiceKey,
    };
  }).then(async ({ message, voiceKey }) => {
    if (voiceKey) {
      try {
        await deleteVoice(voiceKey);
      } catch {
        console.error(
          "Could not remove a deleted voice message from local storage.",
        );
      }
    }
    return message;
  });
};

// Poll tombstones for loaded history too, including messages older than the latest page.
export const getDeletedMessagesForMember = (userId, roomId, ids) => {
  if (
    !Array.isArray(ids) ||
    ids.length > 100 ||
    ids.some((id) => typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id))
  )
    throw new AppError(400, "Supply up to 100 message IDs.");
  return withMembershipTransaction(async (tx) => {
    await requireRoomMembership(userId, roomId, tx);
    return tx.message.findMany({
      where: { roomId, id: { in: ids }, deletedAt: { not: null } },
      select: messageFields,
    });
  });
};

export const syncMessagesForMember = (userId, roomId, ids) => {
  if (
    !Array.isArray(ids) ||
    ids.length > 100 ||
    ids.some((id) => typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id))
  )
    throw new AppError(400, "Supply up to 100 message IDs.");
  return withMembershipTransaction(async (tx) => {
    await requireRoomMembership(userId, roomId, tx);
    return tx.message.findMany({
      where: { roomId, id: { in: ids } },
      select: {
        ...messageFields,
        savedBy: { where: { userId }, select: { userId: true } },
      },
    });
  });
};
