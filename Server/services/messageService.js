import prisma from "../config/db.js";
import AppError from "../utils/AppError.js";
import { decodeMessageCursor, encodeMessageCursor } from "../utils/messageCursor.js";
import { requireRoomMembership } from "./roomService.js";
import { createMessage, findMessagePage } from "../repositories/messageRepository.js";

async function withMembershipTransaction(operation) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: "Serializable", maxWait: 5000, timeout: 10000,
      });
    } catch (error) {
      if (error.code !== "P2034") throw error;
      // Prisma rolled back the failed attempt, so retrying does not duplicate a send.
    }
  }
  throw new AppError(409, "Room activity changed. Please try again.");
}

export const sendMessageForMember = async (userId, roomId, body) => {
  if (typeof body !== "string" || body.trim().length === 0 || body.trim().length > 4000) {
    throw new AppError(400, "Messages must contain 1 to 4,000 characters.");
  }
  return withMembershipTransaction(async tx => {
    await requireRoomMembership(userId, roomId, tx);
    return createMessage({ roomId, authorId: userId, body: body.trim() }, tx);
  });
};

export const getMessagesForMember = async (userId, roomId, options = {}) => {
  const rawLimit = options.limit;
  if (rawLimit !== undefined && (typeof rawLimit !== "string" || !/^[1-9]\d{0,2}$/.test(rawLimit) || Number(rawLimit) > 100)) {
    throw new AppError(400, "Message limit must be a whole number from 1 to 100.");
  }
  const limit = rawLimit === undefined ? 30 : Number(rawLimit);
  const before = decodeMessageCursor(options.before, roomId);

  return withMembershipTransaction(async tx => {
    await requireRoomMembership(userId, roomId, tx);
    const records = await findMessagePage(roomId, { before, limit }, tx);
    const hasMore = records.length > limit;
    const page = records.slice(0, limit);
    const nextCursor = hasMore ? encodeMessageCursor(roomId, page[page.length - 1]) : null;
    return {
      messages: page.reverse(),
      pagination: { hasMore, nextCursor },
    };
  });
};
