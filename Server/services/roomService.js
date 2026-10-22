import prisma from "../config/db.js";
import { deleteAvatar } from "../config/localAvatarStore.js";
import { deleteVoice } from "../config/localVoiceStore.js";
import { generateInviteCode } from "../utils/inviteCode.js";
import { transaction } from "../utils/transaction.js";
import { roomAvatarUrl } from "../utils/avatarAccess.js";
import AppError from "../utils/AppError.js";
import { findUserById } from "../repositories/userRepository.js";
import { syncClerkUser } from "./userService.js";
import {
  createRoomWithOwner,
  findRoomsByMember,
  findRoomById,
  findRoomInvite,
  setRoomCode,
  updateRoom,
} from "../repositories/roomRepository.js";
import {
  findMembership,
  deleteMembership,
  findMembersByRoom,
} from "../repositories/membershipRepository.js";

function validateRoomId(roomId) {
  if (
    typeof roomId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      roomId,
    )
  ) {
    throw new AppError(400, "Invalid room ID.");
  }
}

async function ensureLocalUser(userId) {
  if (!(await findUserById(userId))) await syncClerkUser(userId);
}

function roomSummary(room, role, userId, pinned = false) {
  return {
    id: room.id,
    name: room.name,
    createdById: room.createdById,
    createdAt: room.createdAt,
    role,
    pinned,
    latestMessage: room.messages?.[0] || null,
    memberCount: room._count.members,
    updatedAt: room.updatedAt,
    avatarUrl: room.avatarKey
      ? roomAvatarUrl(room.id, userId, room.avatarKey)
      : null,
    ...(role === "OWNER"
      ? { pendingRequestCount: room._count.joinRequests || 0 }
      : {}),
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
  if (
    typeof name !== "string" ||
    name.trim().length < 3 ||
    name.trim().length > 80
  ) {
    throw new AppError(400, "Room names must contain 3 to 80 characters.");
  }
  await ensureLocalUser(userId);
  // Retry the exceptionally unlikely unique invite-token collision.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const room = await createRoomWithOwner({
        name: name.trim(),
        userId,
        inviteCode: generateInviteCode(),
      });
      return roomSummary(room, "OWNER", userId);
    } catch (error) {
      if (error.code !== "P2002") throw error;
    }
  }
  throw new AppError(503, "Couldn't create an invitation. Please try again.");
};

export const getRoomsForUser = async (userId) => {
  const rooms = await findRoomsByMember(userId);
  return rooms.map((room) =>
    roomSummary(room, room.members[0].role, userId, room.members[0].pinned),
  );
};

export const getRoomForMember = async (userId, roomId) => {
  const { room, membership } = await requireRoomMembership(userId, roomId);
  return roomSummary(room, membership.role, userId, membership.pinned);
};

export const joinRoomByInvite = async () => {
  throw new AppError(
    410,
    "Direct joining is no longer available. Open a room invitation and request access.",
  );
};

export const leaveRoomForUser = async (userId, roomId) => {
  await transaction(async (tx) => {
    const { membership } = await requireRoomMembership(userId, roomId, tx);
    if (membership.role === "OWNER")
      throw new AppError(
        409,
        "Transfer ownership to another member before leaving the room.",
      );
    await deleteMembership(roomId, userId, tx);
  });
};

export const getMembersForRoom = async (userId, roomId) => {
  await requireRoomMembership(userId, roomId);
  return findMembersByRoom(roomId);
};

export const requireRoomOwner = async (userId, roomId, db = prisma) => {
  const access = await requireRoomMembership(userId, roomId, db);
  if (access.membership.role !== "OWNER")
    throw new AppError(403, "Only the room owner can do this.");
  return access;
};

export const getInviteForOwner = async (userId, roomId, reset = false) =>
  transaction(async (tx) => {
    await requireRoomOwner(userId, roomId, tx);
    const current = await findRoomInvite(roomId, tx);
    let code = current.inviteCode;
    if (!code || reset) {
      do {
        code = generateInviteCode();
      } while (code === current.inviteCode);
      await setRoomCode(roomId, code, tx);
    }
    return { code, path: `/join/${code}` };
  });

export const renameRoomForOwner = async (userId, roomId, name) => {
  if (
    typeof name !== "string" ||
    name.trim().length < 3 ||
    name.trim().length > 80
  )
    throw new AppError(400, "Room names must contain 3 to 80 characters.");
  return transaction(async (tx) => {
    await requireRoomOwner(userId, roomId, tx);
    return roomSummary(
      await updateRoom(roomId, { name: name.trim() }, tx),
      "OWNER",
      userId,
    );
  });
};

export const removeMemberForOwner = async (userId, roomId, targetId) => {
  if (typeof targetId !== "string" || !targetId || targetId.length > 200)
    throw new AppError(400, "Invalid member.");
  return transaction(async (tx) => {
    await requireRoomOwner(userId, roomId, tx);
    const target = await findMembership(roomId, targetId, tx);
    if (target?.role === "OWNER" || targetId === userId)
      throw new AppError(409, "The room owner cannot be removed.");
    await deleteMembership(roomId, targetId, tx);
  });
};

// createdById remains the historical creator; the membership role grants ownership.
export const transferRoomOwnership = (userId, roomId, targetId) => {
  if (typeof targetId !== "string" || !targetId || targetId.length > 200)
    throw new AppError(400, "Choose a room member.");
  if (targetId === userId)
    throw new AppError(409, "You already own this room.");
  return transaction(async (tx) => {
    await requireRoomOwner(userId, roomId, tx);
    const target = await findMembership(roomId, targetId, tx);
    if (!target)
      throw new AppError(404, "This person is no longer a room member.");
    if (target.role !== "MEMBER")
      throw new AppError(409, "Choose a regular room member.");
    await tx.roomMember.update({
      where: { roomId_userId: { roomId, userId } },
      data: { role: "MEMBER" },
    });
    await tx.roomMember.update({
      where: { roomId_userId: { roomId, userId: targetId } },
      data: { role: "OWNER" },
    });
    await tx.room.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });
    return { ownerId: targetId };
  });
};

export const deleteRoomForOwner = async (userId, roomId) => {
  const assets = await transaction(async (tx) => {
    const { room } = await requireRoomOwner(userId, roomId, tx);
    const recordings = await tx.message.findMany({
      where: { roomId, voiceKey: { not: null } },
      select: { voiceKey: true },
    });
    const recipients = await tx.roomMember.findMany({
      where: { roomId },
      select: { userId: true },
    });
    const applicants = await tx.roomJoinRequest.findMany({
      where: { roomId, status: "PENDING" },
      select: { userId: true },
    });
    // Foreign keys cascade membership, requests, messages, reactions and saves.
    await tx.room.delete({ where: { id: roomId } });
    return {
      avatarKey: room.avatarKey,
      recordings,
      recipients: [...recipients, ...applicants].map((row) => row.userId),
    };
  });
  // Storage failures must not report a committed room deletion as a failure.
  for (const recording of assets.recordings) {
    try {
      await deleteVoice(recording.voiceKey);
    } catch {
      console.error(
        "Could not remove a deleted room recording from local storage.",
      );
    }
  }
  try {
    await deleteAvatar(assets.avatarKey);
  } catch {
    console.error(
      "Could not remove a deleted room picture from local storage.",
    );
  }
  return assets.recipients;
};
