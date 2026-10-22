import { Server } from "socket.io";
import { clerkClient } from "@clerk/express";
import prisma from "../config/db.js";
import { bindRealtime } from "./events.js";

const roomName = (id) => `room:${id}`;
const userName = (id) => `user:${id}`;
const validId = (id) =>
  typeof id === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );

export function createRealtime(httpServer, origin) {
  const io = new Server(httpServer, {
    cors: { origin, credentials: true },
    allowRequest: (req, done) =>
      done(null, !req.headers.origin || req.headers.origin === origin),
    maxHttpBufferSize: 16 * 1024,
    // Recovery uses current API permissions, rather than replaying private packets to revoked members.
  });
  const presenceTimers = new Map();
  let closing = false;

  function authorized(socket) {
    return socket.connected && socket.data.expiresAt > Date.now();
  }
  function sendUser(userId, event) {
    for (const id of io.sockets.adapter.rooms.get(userName(userId)) || []) {
      const socket = io.sockets.sockets.get(id);
      if (socket && authorized(socket)) socket.emit("workspace:event", event);
    }
  }
  async function publishPresence(roomId) {
    if (closing) return;
    try {
      const members = await prisma.roomMember.findMany({
        where: { roomId },
        select: { userId: true },
      });
      const online = [],
        typing = [];
      for (const { userId } of members) {
        const sockets = [
          ...(io.sockets.adapter.rooms.get(userName(userId)) || []),
        ]
          .map((id) => io.sockets.sockets.get(id))
          .filter(
            (socket) => socket && authorized(socket) && socket.data.active,
          );
        if (sockets.length) online.push(userId);
        if (
          sockets.some(
            (socket) =>
              socket.data.watching === roomId &&
              socket.data.typingUntil > Date.now(),
          )
        )
          typing.push(userId);
      }
      const audience = new Set(members.map((member) => member.userId));
      for (const id of io.sockets.adapter.rooms.get(roomName(roomId)) || []) {
        const socket = io.sockets.sockets.get(id);
        if (socket && authorized(socket) && audience.has(socket.data.userId))
          socket.emit("presence:changed", { roomId, online, typing });
      }
    } catch {
      /* Presence is ephemeral; subsequent changes refresh it. */
    }
  }
  function refreshPresence(roomId) {
    if (closing || presenceTimers.has(roomId)) return;
    presenceTimers.set(
      roomId,
      setTimeout(() => {
        presenceTimers.delete(roomId);
        void publishPresence(roomId);
      }, 80),
    );
  }
  async function refreshUserRooms(userId) {
    try {
      const memberships = await prisma.roomMember.findMany({
        where: { userId },
        select: { roomId: true },
      });
      for (const { roomId } of memberships) refreshPresence(roomId);
    } catch {
      /* Best-effort ephemeral state. */
    }
  }
  function unwatch(socket) {
    const previous = socket.data.watching;
    socket.data.watchVersion = (socket.data.watchVersion || 0) + 1;
    socket.data.watching = null;
    socket.data.typingUntil = 0;
    clearTimeout(socket.data.typingTimer);
    if (previous) {
      socket.leave(roomName(previous));
      refreshPresence(previous);
    }
  }
  async function authenticate(token) {
    if (typeof token !== "string" || !token || token.length > 12000)
      throw Error("AUTH_REQUIRED");
    const request = new Request(`${origin}/socket.io/`, {
      headers: { authorization: `Bearer ${token}`, origin },
    });
    const state = await clerkClient.authenticateRequest(request, {
      authorizedParties: [origin],
      acceptsToken: "session_token",
    });
    const auth = state.toAuth();
    if (!state.isSignedIn || !auth?.userId || !auth.sessionClaims?.exp)
      throw Error("AUTH_REQUIRED");
    return {
      userId: auth.userId,
      sessionId: auth.sessionId,
      expiresAt: auth.sessionClaims.exp * 1000,
    };
  }
  function armExpiry(socket) {
    clearTimeout(socket.data.expiryTimer);
    clearTimeout(socket.data.refreshTimer);
    const remaining = socket.data.expiresAt - Date.now();
    socket.data.refreshTimer = setTimeout(
      () => socket.emit("auth:required"),
      Math.max(1000, remaining - 15000),
    );
    socket.data.expiryTimer = setTimeout(
      () => socket.disconnect(true),
      Math.max(0, remaining),
    );
  }
  function limited(socket, kind, max = 80) {
    const now = Date.now();
    let bucket = socket.data.rates[kind];
    if (!bucket || now - bucket.start > 60000)
      bucket = socket.data.rates[kind] = { start: now, count: 0 };
    return ++bucket.count > max;
  }
  io.use(async (socket, next) => {
    try {
      Object.assign(
        socket.data,
        await authenticate(socket.handshake.auth?.token),
      );
      next();
    } catch {
      const error = new Error("Please sign in to connect.");
      error.data = { code: "AUTH_REQUIRED" };
      next(error);
    } finally {
      if (socket.handshake.auth) delete socket.handshake.auth.token;
    }
  });
  io.on("connection", (socket) => {
    socket.data.active = socket.handshake.auth?.active !== false;
    socket.data.rates = {};
    socket.data.watchVersion = 0;
    socket.join(userName(socket.data.userId));
    armExpiry(socket);
    void refreshUserRooms(socket.data.userId);
    socket.on("auth:refresh", async (payload, ack) => {
      if (limited(socket, "auth", 12)) return;
      try {
        const auth = await authenticate(payload?.token);
        if (
          !socket.connected ||
          auth.userId !== socket.data.userId ||
          auth.sessionId !== socket.data.sessionId
        )
          throw Error();
        Object.assign(socket.data, auth);
        armExpiry(socket);
        if (typeof ack === "function") ack({ ok: true });
      } catch {
        if (typeof ack === "function")
          ack({ ok: false, code: "AUTH_REQUIRED" });
        socket.disconnect(true);
      }
    });
    socket.on("room:watch", async (payload, ack) => {
      const respond = (result) => {
        if (typeof ack === "function") ack(result);
      };
      if (!authorized(socket))
        return respond({ ok: false, code: "AUTH_REQUIRED" });
      if (limited(socket, "watch", 40) || !validId(payload?.roomId))
        return respond({ ok: false, code: "INVALID_ROOM" });
      const version = ++socket.data.watchVersion;
      socket.data.pendingRoom = payload.roomId;
      try {
        const member = await prisma.roomMember.findUnique({
          where: {
            roomId_userId: {
              roomId: payload.roomId,
              userId: socket.data.userId,
            },
          },
          select: { role: true },
        });
        if (!authorized(socket) || socket.data.watchVersion !== version)
          return respond({ ok: false, code: "SUPERSEDED" });
        if (!member) return respond({ ok: false, code: "ACCESS_DENIED" });
        unwatch(socket);
        socket.data.pendingRoom = null;
        socket.data.watching = payload.roomId;
        socket.join(roomName(payload.roomId));
        respond({ ok: true });
        refreshPresence(payload.roomId);
      } catch {
        respond({ ok: false, code: "UNAVAILABLE" });
      }
    });
    socket.on("room:unwatch", (payload) => {
      if (socket.data.watching === payload?.roomId) unwatch(socket);
      else socket.data.watchVersion++;
    });
    socket.on("presence:active", (payload) => {
      if (
        !authorized(socket) ||
        typeof payload?.active !== "boolean" ||
        limited(socket, "presence", 60)
      )
        return;
      socket.data.active = payload.active;
      if (!payload.active) socket.data.typingUntil = 0;
      void refreshUserRooms(socket.data.userId);
    });
    socket.on("typing:set", (payload) => {
      const roomId = socket.data.watching;
      if (
        !authorized(socket) ||
        !roomId ||
        payload?.roomId !== roomId ||
        typeof payload.typing !== "boolean" ||
        limited(socket, "typing", 120)
      )
        return;
      socket.data.typingUntil =
        payload.typing && socket.data.active ? Date.now() + 4000 : 0;
      clearTimeout(socket.data.typingTimer);
      socket.data.typingTimer = setTimeout(() => refreshPresence(roomId), 4100);
      refreshPresence(roomId);
    });
    socket.on("disconnect", () => {
      clearTimeout(socket.data.expiryTimer);
      clearTimeout(socket.data.refreshTimer);
      unwatch(socket);
      void refreshUserRooms(socket.data.userId);
    });
  });
  bindRealtime({
    sendUser,
    refreshPresence,
    revoke(roomId, userId) {
      for (const id of io.sockets.adapter.rooms.get(userName(userId)) || []) {
        const socket = io.sockets.sockets.get(id);
        if (socket) {
          if (socket.data.pendingRoom === roomId) socket.data.watchVersion++;
          if (socket.data.watching === roomId) unwatch(socket);
        }
      }
      refreshPresence(roomId);
    },
    closeRoom(roomId) {
      for (const socket of io.sockets.sockets.values()) {
        if (socket.data.pendingRoom === roomId) socket.data.watchVersion++;
        if (socket.data.watching === roomId) unwatch(socket);
      }
      clearTimeout(presenceTimers.get(roomId));
      presenceTimers.delete(roomId);
    },
  });
  httpServer.on("close", () => {
    closing = true;
    for (const timer of presenceTimers.values()) clearTimeout(timer);
    presenceTimers.clear();
    bindRealtime(null);
  });
  return io;
}
