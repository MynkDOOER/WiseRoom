import prisma from "../config/db.js";

// Invite tokens are deliberately excluded from all ordinary room responses.
const roomFields = {
  id: true,
  name: true,
  createdById: true,
  createdAt: true,
  avatarKey: true,
  avatarUpdatedAt: true,
  updatedAt: true,
  _count: {
    select: { members: true, joinRequests: { where: { status: "PENDING" } } },
  },
};

export const createRoomWithOwner = async ({
  name,
  userId,
  inviteToken,
  inviteCode,
}) => {
  return prisma.room.create({
    data: {
      name,
      createdById: userId,
      inviteToken,
      inviteCode,
      members: { create: { userId, role: "OWNER" } },
    },
    select: roomFields,
  });
};

export const findRoomsByMember = async (userId) => {
  return prisma.room.findMany({
    where: { members: { some: { userId } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      ...roomFields,
      members: { where: { userId }, select: { role: true, pinned: true } },
      messages: {
        where: { parentId: null },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 1,
        select: {
          body: true,
          deletedAt: true,
          createdAt: true,
          voiceMime: true,
          author: { select: { displayName: true, id: true } },
        },
      },
    },
  });
};

export const findRoomById = async (roomId, db = prisma) => {
  return db.room.findUnique({ where: { id: roomId }, select: roomFields });
};

export const findRoomByInviteToken = async (inviteToken) => {
  return prisma.room.findUnique({
    where: { inviteToken },
    select: { id: true },
  });
};

export const findRoomInvite = async (roomId, db = prisma) => {
  return db.room.findUnique({
    where: { id: roomId },
    select: { inviteCode: true },
  });
};

export const findRoomByCode = (inviteCode, db = prisma) =>
  db.room.findUnique({
    where: { inviteCode },
    select: { id: true, name: true },
  });
export const updateRoom = (roomId, data, db = prisma) =>
  db.room.update({ where: { id: roomId }, data, select: roomFields });
export const setRoomCode = (roomId, inviteCode, db = prisma) =>
  db.room.update({
    where: { id: roomId },
    data: { inviteCode, inviteToken: null },
    select: { inviteCode: true },
  });
