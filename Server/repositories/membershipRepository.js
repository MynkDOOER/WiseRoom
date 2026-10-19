import prisma from "../config/db.js";

export const findMembership = async (roomId, userId, db = prisma) => {
  return db.roomMember.findUnique({ where: { roomId_userId: { roomId, userId } } });
};

export const ensureMembership = async (roomId, userId) => {
  try {
    return await prisma.roomMember.upsert({
      where: { roomId_userId: { roomId, userId } },
      create: { roomId, userId, role: "MEMBER" },
      // Rejoining as the owner must never downgrade the existing role.
      update: {},
    });
  } catch (error) {
    // Some upserts can race; the compound primary key still prevents duplicates.
    if (error.code !== "P2002") throw error;
    const existing = await findMembership(roomId, userId);
    if (!existing) throw error;
    return existing;
  }
};

export const deleteMembership = async (roomId, userId) => {
  // Guard against deleting an owner even if a caller bypassed a service check.
  return prisma.roomMember.deleteMany({ where: { roomId, userId, role: "MEMBER" } });
};

export const findMembersByRoom = async (roomId) => {
  return prisma.roomMember.findMany({
    where: { roomId },
    orderBy: [{ joinedAt: "asc" }, { userId: "asc" }],
    select: {
      userId: true,
      role: true,
      joinedAt: true,
      user: { select: { id: true, displayName: true } },
    },
  });
};
