import prisma from "../config/db.js";

const messageFields = {
  id: true,
  roomId: true,
  body: true,
  createdAt: true,
  author: { select: { id: true, displayName: true } },
};

export const createMessage = async ({ roomId, authorId, body }, db = prisma) => {
  return db.message.create({ data: { roomId, authorId, body }, select: messageFields });
};

export const findMessagePage = async (roomId, { before, limit }, db = prisma) => {
  return db.message.findMany({
    where: {
      roomId,
      ...(before ? {
        OR: [
          { createdAt: { lt: before.createdAt } },
          { createdAt: before.createdAt, id: { lt: before.id } },
        ],
      } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: messageFields,
  });
};
