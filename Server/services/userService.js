import { clerkClient } from "@clerk/express";
import { upsertUser } from "../repositories/userRepository.js";

export const syncClerkUser = async (userId) => {
  const clerkUser = await clerkClient.users.getUser(userId);

  const fullName = [
    clerkUser.firstName,
    clerkUser.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const displayName = fullName || clerkUser.username || null;

  const user = await upsertUser({
    id: userId,
    displayName,
  });

  return user;
};
