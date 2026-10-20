import prisma from "../config/db.js";
export const findRequest = (roomId, userId, db = prisma) => db.roomJoinRequest.findUnique({ where: { roomId_userId: { roomId, userId } } });
export const findRequestById = (id, db = prisma) => db.roomJoinRequest.findUnique({ where: { id } });
export const queueRequest = (roomId, userId, db = prisma) => db.roomJoinRequest.upsert({ where: { roomId_userId: { roomId, userId } }, create: { roomId, userId }, update: { status: "PENDING", createdAt: new Date(), decidedAt: null, decidedById: null } });
export const updateRequest = (id, data, db = prisma) => db.roomJoinRequest.update({ where: { id }, data });
export const listPendingRequests = (roomId, after, db = prisma) => db.roomJoinRequest.findMany({ where: { roomId, status: "PENDING", ...(after ? { OR: [{ createdAt: { gt: after.createdAt } }, { createdAt: after.createdAt, id: { gt: after.id } }] } : {}) }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: 51, select: { id: true, roomId: true, userId: true, status: true, createdAt: true, user: { select: { id: true, displayName: true } } } });
export const listUserRequests = async (userId, db = prisma) => {
  const records = await db.roomJoinRequest.findMany({ where: { userId, status: { in: ["PENDING", "APPROVED", "REJECTED"] } }, orderBy: { updatedAt: "desc" }, take: 50, select: { id: true, roomId: true, status: true, updatedAt: true, room: { select: { name: true, inviteCode: true, members: { where: { userId }, select: { userId: true } } } } } });
  return records.filter(item => item.status !== "APPROVED" || item.room.members.length > 0).map(({ room, ...item }) => ({ ...item, roomId: item.status === "APPROVED" ? item.roomId : undefined, room: { name: room.name } }));
};
