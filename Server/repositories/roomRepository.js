import prisma from "../config/db.js";

// Invite tokens are deliberately excluded from all ordinary room responses.
const roomFields = {
  id: true,
  name: true,
  createdById: true,
  createdAt: true,
  _count: { select: { members: true } },
};

export const createRoomWithOwner = async ({ name, userId, inviteToken }) => {
  return prisma.room.create({
    data: {
      name,
      createdById: userId,
      inviteToken,
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
      members: { where: { userId }, select: { role: true } },
    },
  });
};

export const findRoomById = async (roomId, db = prisma) => {
  return db.room.findUnique({ where: { id: roomId }, select: roomFields });
};

export const findRoomByInviteToken = async (inviteToken) => {
  return prisma.room.findUnique({ where: { inviteToken }, select: { id: true } });
};

export const findRoomInvite = async (roomId) => {
  return prisma.room.findUnique({ where: { id: roomId }, select: { inviteToken: true } });
};
