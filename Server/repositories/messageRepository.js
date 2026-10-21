import prisma from "../config/db.js";

export const messageFields = {
  deletedAt: true,
  parentId: true,
  reactions: { select: { userId: true, emoji: true } },
  _count: { select: { replies: true } },
  id: true,
  roomId: true,
  body: true,
  voiceMime: true,
  voiceDurationMs: true,
  createdAt: true,
  author: { select: { id: true, displayName: true } },
};

export const createMessage = async (
  { roomId, authorId, body, parentId },
  db = prisma,
) => {
  return db.message.create({
    data: { roomId, authorId, body, ...(parentId ? { parentId } : {}) },
    select: messageFields,
  });
};

export const findMessagePage = async (
  roomId,
  { before, limit, userId },
  db = prisma,
) => {
  return db.message.findMany({
    where: {
      roomId,
      parentId: null,
      ...(before
        ? {
            OR: [
              { createdAt: { lt: before.createdAt } },
              { createdAt: before.createdAt, id: { lt: before.id } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: {
      ...messageFields,
      ...(userId
        ? { savedBy: { where: { userId }, select: { userId: true } } }
        : {}),
    },
  });
};

export const createVoiceMessage = async (data, db = prisma) =>
  db.message.create({ data: { ...data, body: "" }, select: messageFields });
export const findVoiceMessage = async (roomId, id, db = prisma) =>
  db.message.findFirst({
    where: { id, roomId },
    select: { voiceKey: true, voiceMime: true },
  });
