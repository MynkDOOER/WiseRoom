import test, { before, after, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";

const roomId = "11111111-1111-4111-8111-111111111111";
const otherRoom = "22222222-2222-4222-8222-222222222222";
let state;
let server;
let baseUrl;

beforeEach(() => {
  state = {
    messages: [],
    members: new Set(["owner", "alice"]),
    transactions: 0,
    conflicts: 0,
    failDatabase: false,
    inTransaction: false,
  };
});

const database = {
  async $transaction(operation, options) {
    state.transactions += 1;
    assert.equal(options.isolationLevel, "Serializable");
    if (state.conflicts > 0) {
      state.conflicts -= 1;
      throw Object.assign(new Error("Simulated transaction conflict"), { code: "P2034" });
    }
    state.inTransaction = true;
    try { return await operation(database); }
    finally { state.inTransaction = false; }
  },
  room: {
    async findUnique({ where }) {
      assert.ok(state.inTransaction);
      return [roomId, otherRoom].includes(where.id)
        ? { id: where.id, name: "Test room", createdById: "owner", _count: { members: state.members.size } }
        : null;
    },
  },
  roomMember: {
    async findUnique({ where }) {
      assert.ok(state.inTransaction);
      const { roomId: room, userId } = where.roomId_userId;
      return state.members.has(userId) ? { roomId: room, userId, role: userId === "owner" ? "OWNER" : "MEMBER" } : null;
    },
  },
  message: {
    async create({ data }) {
      assert.ok(state.inTransaction);
      if (state.failDatabase) throw new Error("private-database-details");
      const message = { ...data, id: randomUUID(), createdAt: new Date(), author: { id: data.authorId, displayName: "Test author" } };
      state.messages.push(message);
      return message;
    },
    async findMany({ where, take, orderBy }) {
      assert.ok(state.inTransaction);
      assert.deepEqual(orderBy, [{ createdAt: "desc" }, { id: "desc" }]);
      if (state.failDatabase) throw new Error("private-database-details");
      let messages = state.messages.filter(message => message.roomId === where.roomId);
      if (where.OR) {
        const time = where.OR[0].createdAt.lt.getTime();
        const id = where.OR[1].id.lt;
        messages = messages.filter(message => message.createdAt.getTime() < time
          || (message.createdAt.getTime() === time && message.id < id));
      }
      return messages.sort((a, b) => b.createdAt - a.createdAt || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0)).slice(0, take);
    },
  },
};

mock.module("@clerk/express", { exports: {
  getAuth: req => ({ userId: req.headers["x-test-user"] || null }),
  clerkClient: {},
} });
mock.module(new URL("../config/db.js", import.meta.url).href, { exports: { default: database } });
const { default: messageRoutes } = await import("../routes/messageRoutes.js");
const { default: errorHandler } = await import("../middlewares/errorMiddleware.js");

before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/rooms/:roomId/messages", messageRoutes);
  app.use(errorHandler);
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/rooms`;
});
after(() => new Promise(resolve => server.close(resolve)));

async function request({ room = roomId, method = "GET", as = "owner", body, query = "" } = {}) {
  const response = await fetch(`${baseUrl}/${room}/messages${query}`, {
    method,
    headers: { ...(as ? { "x-test-user": as } : {}), ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(5000),
  });
  return { status: response.status, headers: response.headers, data: await response.json() };
}

function seed(count, { room = roomId, sameTime = false } = {}) {
  for (let i = 1; i <= count; i += 1) {
    state.messages.push({
      id: `${room.slice(0, 8)}-0000-4000-8000-${String(i).padStart(12, "0")}`,
      roomId: room, body: `Message ${i}`,
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, sameTime ? 0 : i)),
      author: { id: "owner", displayName: "Test author" },
    });
  }
}

test("signed-out users cannot read or send messages", async () => {
  assert.equal((await request({ as: null })).status, 401);
  assert.equal((await request({ as: null, method: "POST", body: { body: "Hello" } })).status, 401);
  assert.equal(state.transactions, 0);
});

test("owner and member can send; author and room come from trusted request context", async () => {
  for (const as of ["owner", "alice"]) {
    const result = await request({ method: "POST", as, body: { body: "  Hello\nthere  ", authorId: "outsider", roomId: otherRoom } });
    assert.equal(result.status, 201);
    assert.equal(result.data.message.author.id, as);
    assert.equal(result.data.message.roomId, roomId);
    assert.equal(result.data.message.body, "Hello\nthere");
    assert.equal(result.headers.get("cache-control"), "no-store");
  }
});

test("nonmembers cannot read or send", async () => {
  assert.equal((await request({ as: "outsider" })).status, 403);
  assert.equal((await request({ as: "outsider", method: "POST", body: { body: "Hello" } })).status, 403);
  assert.equal(state.messages.length, 0);
});

test("invalid message bodies are rejected before database activity", async () => {
  for (const body of [undefined, null, 12, [], "", " \n\t ", "a".repeat(4001)]) {
    assert.equal((await request({ method: "POST", body: { body } })).status, 400);
  }
  assert.equal(state.transactions, 0);
  assert.equal((await request({ method: "POST", body: { body: "a".repeat(4000) } })).status, 201);
});

test("invalid room IDs and missing rooms have useful errors", async () => {
  assert.equal((await request({ room: "bad-id" })).status, 400);
  assert.equal((await request({ room: randomUUID() })).status, 404);
});

test("empty history has no next cursor", async () => {
  const result = await request();
  assert.equal(result.status, 200);
  assert.deepEqual(result.data.messages, []);
  assert.deepEqual(result.data.pagination, { hasMore: false, nextCursor: null });
});

test("default history returns the latest 30 in chronological order", async () => {
  seed(65);
  const result = await request();
  assert.equal(result.data.messages.length, 30);
  assert.equal(result.data.messages[0].body, "Message 36");
  assert.equal(result.data.messages[29].body, "Message 65");
  assert.equal(result.data.pagination.hasMore, true);
});

for (const sameTime of [false, true]) {
  test(`cursor pages contain every message once (same timestamp: ${sameTime})`, async () => {
    seed(9, { sameTime });
    let before;
    const seen = [];
    for (let page = 0; page < 3; page += 1) {
      const result = await request({ query: `?limit=3${before ? `&before=${before}` : ""}` });
      assert.equal(result.status, 200);
      assert.equal(result.data.messages.length, 3);
      seen.push(...result.data.messages.map(message => message.id));
      before = result.data.pagination.nextCursor;
      assert.equal(result.data.pagination.hasMore, page < 2);
    }
    assert.equal(new Set(seen).size, 9);
    assert.equal(before, null);
  });
}

test("history excludes other rooms", async () => {
  seed(3);
  seed(2, { room: otherRoom });
  const result = await request();
  assert.equal(result.data.messages.length, 3);
  assert.ok(result.data.messages.every(message => message.roomId === roomId));
});

test("new messages do not shift the older-page bookmark", async () => {
  seed(6);
  const first = await request({ query: "?limit=3" });
  await request({ method: "POST", body: { body: "New arrival" } });
  const second = await request({ query: `?limit=3&before=${first.data.pagination.nextCursor}` });
  assert.deepEqual(second.data.messages.map(message => message.body), ["Message 1", "Message 2", "Message 3"]);
  assert.equal((await request()).data.messages.at(-1).body, "New arrival");
});

test("bookmark remains usable even when its boundary message is missing", async () => {
  seed(6);
  const first = await request({ query: "?limit=3" });
  const boundary = first.data.messages[0].id;
  state.messages = state.messages.filter(message => message.id !== boundary);
  const second = await request({ query: `?limit=3&before=${first.data.pagination.nextCursor}` });
  assert.deepEqual(second.data.messages.map(message => message.body), ["Message 1", "Message 2", "Message 3"]);
});

test("page limits are bounded and duplicate query parameters are rejected", async () => {
  for (const limit of ["0", "101", "-2", "1.5", "abc", "", "01"]) {
    assert.equal((await request({ query: `?limit=${limit}` })).status, 400);
  }
  assert.equal((await request({ query: "?limit=3&limit=4" })).status, 400);
  assert.equal((await request({ query: "?limit=100" })).status, 200);
});

test("malformed, oversized and cross-room cursors are rejected", async () => {
  seed(4);
  const page = await request({ query: "?limit=2" });
  assert.equal((await request({ room: otherRoom, query: `?before=${page.data.pagination.nextCursor}` })).status, 400);
  for (const cursor of ["", "!!!", "a".repeat(1025), Buffer.from("not JSON").toString("base64url")]) {
    assert.equal((await request({ query: `?before=${encodeURIComponent(cursor)}` })).status, 400);
  }
  for (const fields of [{ v: 2 }, { createdAt: "bad date" }, { id: [randomUUID()] }, { id: "bad-id" }]) {
    const payload = { v: 1, roomId, id: randomUUID(), createdAt: new Date().toISOString(), ...fields };
    const cursor = Buffer.from(JSON.stringify(payload)).toString("base64url");
    assert.equal((await request({ query: `?before=${cursor}` })).status, 400);
  }
});

test("transaction conflicts retry without duplicating a send", async () => {
  state.conflicts = 1;
  const result = await request({ method: "POST", body: { body: "Hello" } });
  assert.equal(result.status, 201);
  assert.equal(state.transactions, 2);
  assert.equal(state.messages.length, 1);
});

test("transaction conflict retries are bounded", async () => {
  state.conflicts = 4;
  assert.equal((await request({ method: "POST", body: { body: "Hello" } })).status, 409);
  assert.equal(state.transactions, 3);
  assert.equal(state.messages.length, 0);
});

test("leaving removes access but preserves messages for remaining members", async () => {
  await request({ method: "POST", as: "alice", body: { body: "Saved message" } });
  state.members.delete("alice");
  assert.equal((await request({ as: "alice" })).status, 403);
  assert.equal((await request({ method: "POST", as: "alice", body: { body: "No access" } })).status, 403);
  assert.equal((await request()).data.messages.length, 1);
});

test("database failures do not expose internal details", async () => {
  state.failDatabase = true;
  for (const options of [{}, { method: "POST", body: { body: "Hello" } }]) {
    const result = await request(options);
    assert.equal(result.status, 500);
    assert.doesNotMatch(JSON.stringify(result.data), /private-database-details/);
  }
});
