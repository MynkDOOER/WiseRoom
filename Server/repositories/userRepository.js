import prisma from "../config/db.js";

export const findUserById = async (id) => {
  return prisma.user.findUnique({ where: { id }, select: { id: true } });
};

export const upsertUser = async ({ id, displayName }) => {
  return prisma.user.upsert({
    where: {
      id,
    },
    create: {
      id,
      displayName,
    },
    update: {
      displayName,
    },
  });
};
