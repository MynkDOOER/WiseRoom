import prisma from "../config/db.js";

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
