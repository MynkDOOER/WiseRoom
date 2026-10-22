import { randomUUID } from "node:crypto";
import prisma from "../config/db.js";

let transport;
export function bindRealtime(value) {
  transport = value;
}

// Events contain identifiers only. The HTTP API remains the authorization and data boundary.
export function publishUsers(userIds, type, details = {}) {
  if (!transport) return;
  const event = { ...details, type, eventId: randomUUID() };
  for (const id of new Set(userIds)) transport.sendUser(id, event);
}

export async function publishRoom(roomId, type, details = {}) {
  if (!transport) return;
  try {
    const members = await prisma.roomMember.findMany({
      where: { roomId },
      select: { userId: true },
    });
    publishUsers(
      members.map((member) => member.userId),
      type,
      { roomId, ...details },
    );
    transport.refreshPresence(roomId);
  } catch {
    console.error(
      "Realtime notification failed; clients will reconcile through the API.",
    );
  }
}

export function revokeRoomAccess(roomId, userId) {
  transport?.revoke(roomId, userId);
  publishUsers([userId], "room:removed", { roomId });
}

export function closeRoom(roomId, userIds) {
  transport?.closeRoom(roomId);
  publishUsers(userIds, "room:deleted", { roomId });
}
