import { randomBytes } from "node:crypto";
import prisma from "../config/db.js";
import AppError from "../utils/AppError.js";
import { findUserById } from "../repositories/userRepository.js";
import { syncClerkUser } from "./userService.js";
import {
  createRoomWithOwner, findRoomsByMember, findRoomById,
  findRoomByInviteToken, findRoomInvite,
} from "../repositories/roomRepository.js";
import {
  findMembership, ensureMembership, deleteMembership, findMembersByRoom,
} from "../repositories/membershipRepository.js";

function validateRoomId(roomId) {
  if (typeof roomId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(roomId)) {
    throw new AppError(400, "Invalid room ID.");
  }
}

async function ensureLocalUser(userId) {
  if (!(await findUserById(userId))) await syncClerkUser(userId);
}

function roomSummary(room, role) {
  return {
    id: room.id,
    name: room.name,
    createdById: room.createdById,
    createdAt: room.createdAt,
    role,
    memberCount: room._count.members,
  };
}

export const requireRoomMembership = async (userId, roomId, db = prisma) => {
  validateRoomId(roomId);
  const room = await findRoomById(roomId, db);
  if (!room) throw new AppError(404, "Room not found.");
  const membership = await findMembership(roomId, userId, db);
  if (!membership) throw new AppError(403, "Join this room to access it.");
  return { room, membership };
};

export const createRoomForUser = async (userId, name) => {
  if (typeof name !== "string" || name.trim().length < 3 || name.trim().length > 80) {
    throw new AppError(400, "Room names must contain 3 to 80 characters.");
  }
  await ensureLocalUser(userId);
  // Retry the exceptionally unlikely unique invite-token collision.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const room = await createRoomWithOwner({
        name: name.trim(), userId, inviteToken: randomBytes(32).toString("hex"),
      });
      return roomSummary(room, "OWNER");
    } catch (error) {
      if (error.code !== "P2002") throw error;
    }
  }
  throw new AppError(503, "Couldn't create an invitation. Please try again.");
};

export const getRoomsForUser = async (userId) => {
  const rooms = await findRoomsByMember(userId);
  return rooms.map(room => roomSummary(room, room.members[0].role));
};

export const getRoomForMember = async (userId, roomId) => {
  const { room, membership } = await requireRoomMembership(userId, roomId);
  return roomSummary(room, membership.role);
};

export const joinRoomByInvite = async (userId, inviteToken) => {
  if (typeof inviteToken !== "string" || !/^[0-9a-f]{64}$/.test(inviteToken.trim())) {
    throw new AppError(400, "Paste a valid 64-character invite token.");
  }
  const room = await findRoomByInviteToken(inviteToken.trim());
  if (!room) throw new AppError(404, "This invitation is invalid or no longer available.");
  await ensureLocalUser(userId);
  await ensureMembership(room.id, userId);
  return getRoomForMember(userId, room.id);
};

export const leaveRoomForUser = async (userId, roomId) => {
  const { membership } = await requireRoomMembership(userId, roomId);
  if (membership.role === "OWNER") {
    throw new AppError(409, "Owners must keep their membership. Ownership transfer isn't available yet.");
  }
  await deleteMembership(roomId, userId);
};

export const getMembersForRoom = async (userId, roomId) => {
  await requireRoomMembership(userId, roomId);
  return findMembersByRoom(roomId);
};

export const getInviteForOwner = async (userId, roomId) => {
  const { membership } = await requireRoomMembership(userId, roomId);
  if (membership.role !== "OWNER") throw new AppError(403, "Only the owner can retrieve this invitation.");
  const room = await findRoomInvite(roomId);
  if (!room?.inviteToken) throw new AppError(404, "This room has no active invitation.");
  return room.inviteToken;
};
