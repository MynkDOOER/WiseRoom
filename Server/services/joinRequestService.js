import prisma from "../config/db.js";
import { publishUsers, publishRoom } from "../realtime/events.js";
import AppError from "../utils/AppError.js";
import { transaction } from "../utils/transaction.js";
import { normalizeInviteCode } from "../utils/inviteCode.js";
import { findRoomByCode } from "../repositories/roomRepository.js";
import { findMembership } from "../repositories/membershipRepository.js";
import {
  findRequest,
  findRequestById,
  queueRequest,
  updateRequest,
  listPendingRequests,
  listUserRequests,
} from "../repositories/joinRequestRepository.js";
import { syncClerkUser } from "./userService.js";
import { findUserById } from "../repositories/userRepository.js";
import { requireRoomOwner } from "./roomService.js";

async function resolveRoom(code, db) {
  const room = await findRoomByCode(normalizeInviteCode(code), db);
  if (!room)
    throw new AppError(
      404,
      "This invitation is invalid or no longer available.",
    );
  return room;
}
function requestSummary(request) {
  return request
    ? { id: request.id, status: request.status, updatedAt: request.updatedAt }
    : null;
}
export const previewInvitation = (userId, code) =>
  transaction(async (tx) => {
    const room = await resolveRoom(code, tx);
    const membership = await findMembership(room.id, userId, tx);
    const request = await findRequest(room.id, userId, tx);
    return {
      room: { name: room.name },
      memberRoomId: membership ? room.id : null,
      request: requestSummary(request),
    };
  });
export const submitJoinRequest = async (userId, code) => {
  const normalized = normalizeInviteCode(code);
  if (!(await findUserById(userId))) await syncClerkUser(userId);
  let notificationRoomId;
  return transaction(async (tx) => {
    const room = await resolveRoom(normalized, tx);
    notificationRoomId = room.id;
    if (await findMembership(room.id, userId, tx))
      return { memberRoomId: room.id, request: null };
    const previous = await findRequest(room.id, userId, tx);
    if (previous?.status === "PENDING")
      return { memberRoomId: null, request: requestSummary(previous) };
    if (
      previous?.status === "REJECTED" &&
      Date.now() - new Date(previous.updatedAt).getTime() < 60000
    )
      throw new AppError(429, "Please wait a minute before requesting again.");
    return {
      memberRoomId: null,
      request: requestSummary(await queueRequest(room.id, userId, tx)),
    };
  }).then(async (result) => {
    await notifyRequest(notificationRoomId, userId);
    return result;
  });
};
export const cancelJoinRequest = (userId, code) => {
  let notificationRoomId;
  return transaction(async (tx) => {
    const room = await resolveRoom(code, tx);
    notificationRoomId = room.id;
    const request = await findRequest(room.id, userId, tx);
    if (request?.status === "PENDING")
      await updateRequest(request.id, { status: "CANCELLED" }, tx);
  }).then(() => notifyRequest(notificationRoomId, userId));
};
export const cancelOwnRequest = (userId, requestId) => {
  let notificationRoomId;
  return transaction(async (tx) => {
    if (typeof requestId !== "string" || !/^[0-9a-f-]{36}$/i.test(requestId))
      throw new AppError(400, "Invalid join request.");
    const request = await findRequestById(requestId, tx);
    if (!request || request.userId !== userId)
      throw new AppError(404, "Join request not found.");
    notificationRoomId = request.roomId;
    if (request.status === "PENDING")
      await updateRequest(request.id, { status: "CANCELLED" }, tx);
  }).then(() => notifyRequest(notificationRoomId, userId));
};
export const getJoinRequests = async (userId, roomId, cursor) =>
  transaction(async (tx) => {
    await requireRoomOwner(userId, roomId, tx);
    let after;
    if (cursor !== undefined) {
      if (typeof cursor !== "string" || !/^[0-9a-f-]{36}$/i.test(cursor))
        throw new AppError(400, "Invalid request cursor.");
      after = await findRequestById(cursor, tx);
      if (!after || after.roomId !== roomId)
        throw new AppError(400, "Invalid request cursor.");
    }
    const records = await listPendingRequests(roomId, after, tx);
    const requests = records.slice(0, 50);
    return {
      requests,
      nextCursor: records.length > 50 ? requests[requests.length - 1].id : null,
    };
  });
export const getMyJoinRequests = (userId) => listUserRequests(userId);
export const decideJoinRequest = (userId, roomId, requestId, decision) => {
  if (!["APPROVED", "REJECTED"].includes(decision))
    throw new AppError(400, "Choose approve or decline.");
  if (typeof requestId !== "string" || !/^[0-9a-f-]{36}$/i.test(requestId))
    throw new AppError(400, "Invalid join request.");
  let applicantId;
  return transaction(async (tx) => {
    await requireRoomOwner(userId, roomId, tx);
    const request = await findRequestById(requestId, tx);
    if (!request || request.roomId !== roomId)
      throw new AppError(404, "Join request not found.");
    applicantId = request.userId;
    if (request.status === decision) return requestSummary(request);
    if (request.status !== "PENDING")
      throw new AppError(
        409,
        "This request was already changed. Refresh the list.",
      );
    if (decision === "APPROVED")
      await tx.roomMember.upsert({
        where: { roomId_userId: { roomId, userId: request.userId } },
        create: { roomId, userId: request.userId, role: "MEMBER" },
        update: {},
      });
    return requestSummary(
      await updateRequest(
        request.id,
        { status: decision, decidedAt: new Date(), decidedById: userId },
        tx,
      ),
    );
  }).then(async (result) => {
    await notifyRequest(roomId, applicantId);
    if (decision === "APPROVED") await publishRoom(roomId, "members:changed");
    return result;
  });
};

async function notifyRequest(roomId, userId) {
  try {
    const owners = await prisma.roomMember.findMany({
      where: { roomId, role: "OWNER" },
      select: { userId: true },
    });
    publishUsers(
      [userId, ...owners.map((owner) => owner.userId)],
      "requests:changed",
      { roomId },
    );
  } catch {
    console.error(
      "Join request notification deferred to client reconciliation.",
    );
  }
}
