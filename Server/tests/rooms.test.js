import test, { after, before, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";

let state;
let server;
let baseUrl;

beforeEach(() => {
  state = {
    users: new Map(["owner", "alice", "outsider"].map(id => [id, { id }])),
    rooms: new Map(), memberships: new Map(), clerkCalls: 0,
    failDatabase: false, raceJoin: false, createCalls: [],
  };
});

const key = (roomId, userId) => `${roomId}:${userId}`;
function selectRoom(room, select) {
  if (!room) return null;
  const result = {};
  for (const field of ["id", "name", "createdById", "createdAt", "inviteToken"]) {
    if (select[field]) result[field] = room[field];
  }
  const members = [...state.memberships.values()].filter(member => member.roomId === room.id);
  if (select._count) result._count = { members: members.length };
  if (select.members) result.members = members.filter(member => member.userId === select.members.where.userId).map(member => ({ role: member.role }));
  return result;
}
const database = {
  user: {
    async findUnique({ where }) { return state.users.get(where.id) || null; },
    async upsert({ where, create, update }) {
      const user = state.users.get(where.id);
      const result = user ? { ...user, ...update } : create;
      state.users.set(where.id, result);
      return result;
    },
  },
  room: {
    async create(args) {
      if (state.failDatabase) throw new Error("private-database-details");
      state.createCalls.push(args);
      const { members, ...fields } = args.data;
      const room = { ...fields, id: randomUUID(), createdAt: new Date() };
      state.rooms.set(room.id, room);
      state.memberships.set(key(room.id, members.create.userId), { ...members.create, roomId: room.id, joinedAt: new Date() });
      return selectRoom(room, args.select);
    },
    async findUnique({ where, select }) {
      const room = where.id ? state.rooms.get(where.id) : [...state.rooms.values()].find(item => item.inviteToken === where.inviteToken);
      return selectRoom(room, select);
    },
    async findMany({ where, select }) {
      const userId = where.members.some.userId;
      return [...state.rooms.values()].filter(room => state.memberships.has(key(room.id, userId))).map(room => selectRoom(room, select));
    },
  },
  roomMember: {
    async findUnique({ where }) {
      const { roomId, userId } = where.roomId_userId;
      return state.memberships.get(key(roomId, userId)) || null;
    },
    async upsert({ where, create, update }) {
      const { roomId, userId } = where.roomId_userId;
      const existing = state.memberships.get(key(roomId, userId));
      const result = existing ? { ...existing, ...update } : { ...create, joinedAt: new Date() };
      state.memberships.set(key(roomId, userId), result);
      if (state.raceJoin) {
        state.raceJoin = false;
        throw Object.assign(new Error("Simulated concurrent insert"), { code: "P2002" });
      }
      return result;
    },
    async deleteMany({ where }) {
      const existing = state.memberships.get(key(where.roomId, where.userId));
      if (!existing || existing.role !== where.role) return { count: 0 };
      state.memberships.delete(key(where.roomId, where.userId));
      return { count: 1 };
    },
    async findMany({ where }) {
      return [...state.memberships.values()].filter(member => member.roomId === where.roomId).map(member => ({
        userId: member.userId, role: member.role, joinedAt: member.joinedAt,
        user: { id: member.userId, displayName: state.users.get(member.userId)?.displayName || null },
      }));
    },
  },
};

mock.module("@clerk/express", { exports: {
  getAuth: req => ({ userId: req.headers["x-test-user"] || null }),
  clerkClient: { users: { async getUser() {
    state.clerkCalls += 1;
    return { firstName: "New", lastName: "Member" };
  } } },
} });
mock.module(new URL("../config/db.js", import.meta.url).href, { exports: { default: database } });
const { default: roomRoutes } = await import("../routes/roomRoutes.js");
const { default: errorHandler } = await import("../middlewares/errorMiddleware.js");

before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/rooms", roomRoutes);
  app.use(errorHandler);
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/rooms`;
});
after(() => new Promise(resolve => server.close(resolve)));

async function request(path = "", { method = "GET", as = "owner", body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { ...(as ? { "x-test-user": as } : {}), ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(5000),
  });
  const data = response.status === 204 ? null : await response.json();
  return { status: response.status, headers: response.headers, data };
}
async function makeRoom() {
  const result = await request("", { method: "POST", body: { name: "Study group", userId: "outsider", role: "MEMBER" } });
  assert.equal(result.status, 201);
  const room = result.data.room;
  return { ...room, token: state.rooms.get(room.id).inviteToken };
}

test("every room endpoint rejects signed-out callers", async () => {
  const roomId = randomUUID();
  for (const [method, path] of [["POST", ""], ["GET", ""], ["POST", "/join"], ["GET", `/${roomId}`], ["GET", `/${roomId}/members`], ["DELETE", `/${roomId}/members/me`], ["GET", `/${roomId}/invite`]]) {
    const res = await request(path, { method, as: null });
    assert.equal(res.status, 401);
    assert.equal(res.headers.get("cache-control"), "no-store");
  }
  assert.equal(state.rooms.size, 0);
});

test("creation uses verified owner and a nested membership write", async () => {
  const room = await makeRoom();
  assert.equal(room.createdById, "owner");
  assert.equal(room.role, "OWNER");
  assert.equal(room.memberCount, 1);
  assert.match(room.token, /^[0-9a-f]{64}$/);
  assert.equal(state.createCalls[0].data.members.create.role, "OWNER");
  assert.equal(state.createCalls[0].data.members.create.userId, "owner");
});

test("invalid names and malformed IDs fail before writes", async () => {
  for (const name of [undefined, null, 42, "  ", "ab", "x".repeat(81)]) {
    assert.equal((await request("", { method: "POST", body: { name } })).status, 400);
  }
  assert.equal((await request("/not-a-uuid")).status, 400);
  assert.equal(state.rooms.size, 0);
});

test("creation trims names and syncs a missing local Clerk user", async () => {
  const res = await request("", { method: "POST", as: "new-user", body: { name: "  New group  " } });
  assert.equal(res.status, 201);
  assert.equal(res.data.room.name, "New group");
  assert.equal(res.data.room.createdById, "new-user");
  assert.equal(state.clerkCalls, 1);
});

test("room listing is membership-filtered and hides invite tokens", async () => {
  const room = await makeRoom();
  const owner = await request();
  assert.equal(owner.data.rooms.length, 1);
  assert.equal(owner.data.rooms[0].role, "OWNER");
  assert.equal(JSON.stringify(owner.data).includes(room.token), false);
  assert.equal((await request("", { as: "outsider" })).data.rooms.length, 0);
});

test("valid invite joins as MEMBER; repeat/concurrent joins do not duplicate", async () => {
  const room = await makeRoom();
  const results = await Promise.all(Array.from({ length: 3 }, () => request("/join", {
    method: "POST", as: "alice", body: { inviteToken: room.token, role: "OWNER", userId: "outsider" },
  })));
  results.forEach(result => { assert.equal(result.status, 200); assert.equal(result.data.room.role, "MEMBER"); });
  assert.equal(state.memberships.size, 2);
  assert.equal(state.memberships.get(key(room.id, "alice")).role, "MEMBER");
});

test("concurrent unique-key conflict returns the existing membership", async () => {
  const room = await makeRoom();
  state.raceJoin = true;
  const res = await request("/join", { method: "POST", as: "alice", body: { inviteToken: room.token } });
  assert.equal(res.status, 200);
  assert.equal(state.memberships.size, 2);
});

test("joining the owner's own invitation preserves OWNER", async () => {
  const room = await makeRoom();
  const res = await request("/join", { method: "POST", body: { inviteToken: room.token } });
  assert.equal(res.data.room.role, "OWNER");
  assert.equal(state.memberships.size, 1);
});

test("invalid and unknown invite tokens cannot create membership", async () => {
  await makeRoom();
  assert.equal((await request("/join", { method: "POST", as: "alice", body: { inviteToken: "bad" } })).status, 400);
  assert.equal((await request("/join", { method: "POST", as: "alice", body: { inviteToken: "0".repeat(64) } })).status, 404);
  assert.equal(state.memberships.size, 1);
});

test("nonmembers cannot read details, members, invites or leave", async () => {
  const room = await makeRoom();
  for (const [method, suffix] of [["GET", ""], ["GET", "/members"], ["GET", "/invite"], ["DELETE", "/members/me"]]) {
    const res = await request(`/${room.id}${suffix}`, { method, as: "outsider" });
    assert.equal(res.status, 403);
    assert.equal(JSON.stringify(res.data).includes(room.token), false);
  }
});

test("only owners retrieve invites, while members can read room/member summaries", async () => {
  const room = await makeRoom();
  await request("/join", { method: "POST", as: "alice", body: { inviteToken: room.token } });
  assert.equal((await request(`/${room.id}/invite`)).data.inviteToken, room.token);
  assert.equal((await request(`/${room.id}/invite`, { as: "alice" })).status, 403);
  const details = await request(`/${room.id}`, { as: "alice" });
  assert.equal(details.status, 200);
  assert.equal(details.data.room.inviteToken, undefined);
  const members = await request(`/${room.id}/members`, { as: "alice" });
  assert.equal(members.data.members.length, 2);
});

test("owner cannot leave; member can leave, loses access, and can rejoin", async () => {
  const room = await makeRoom();
  assert.equal((await request(`/${room.id}/members/me`, { method: "DELETE" })).status, 409);
  await request("/join", { method: "POST", as: "alice", body: { inviteToken: room.token } });
  assert.equal((await request(`/${room.id}/members/me`, { method: "DELETE", as: "alice" })).status, 204);
  assert.equal((await request(`/${room.id}`, { as: "alice" })).status, 403);
  assert.equal((await request("", { as: "alice" })).data.rooms.length, 0);
  assert.equal((await request("/join", { method: "POST", as: "alice", body: { inviteToken: room.token } })).status, 200);
  assert.equal(state.memberships.get(key(room.id, "owner")).role, "OWNER");
});

test("missing room is 404 and unexpected errors do not expose details", async () => {
  assert.equal((await request(`/${randomUUID()}`)).status, 404);
  state.failDatabase = true;
  const res = await request("", { method: "POST", body: { name: "Study group" } });
  assert.equal(res.status, 500);
  assert.equal(JSON.stringify(res.data).includes("private-database-details"), false);
});

test("malformed JSON produces a safe 400 response", async () => {
  const res = await fetch(baseUrl, { method: "POST", headers: { "Content-Type": "application/json", "x-test-user": "owner" }, body: "{broken", signal: AbortSignal.timeout(5000) });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).success, false);
});
