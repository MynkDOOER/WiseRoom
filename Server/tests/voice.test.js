import test, { after, before, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import AppError from "../utils/AppError.js";
import { validateVoiceUpload, MAX_VOICE_BYTES } from "../utils/voiceUpload.js";

const room = "11111111-1111-4111-8111-111111111111";
const otherRoom = "22222222-2222-4222-8222-222222222222";
const recording = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(96)]);
let records, files, member, fail, conflict, server, base;
beforeEach(() => { records = []; files = new Map(); member = true; fail = false; conflict = false; });
const db = {
  async $transaction(operation) { if (conflict) throw Object.assign(Error("Conflict"), { code: "P2034" }); return operation(db); },
  message: {
    async create({ data, select }) {
      if (fail) throw Error("private database information");
      const row = { ...data, id: "voice-1", createdAt: new Date(), author: { id: "alice", displayName: "Alice" } };
      records.push(row);
      return Object.fromEntries(Object.keys(select).filter(key => select[key]).map(key => [key, row[key]]));
    },
    async findFirst({ where }) { return records.find(row => row.id === where.id && row.roomId === where.roomId) || null; },
  },
};
mock.module("@clerk/express", { exports: { getAuth: req => ({ userId: req.headers["x-test-user"] }), clerkClient: {} } });
mock.module(new URL("../config/db.js", import.meta.url).href, { exports: { default: db } });
mock.module(new URL("../services/roomService.js", import.meta.url).href, { exports: {
  requireRoomMembership: async () => { if (!member) throw new AppError(403, "Join this room to access it."); return {}; },
} });
mock.module(new URL("../config/localVoiceStore.js", import.meta.url).href, { exports: {
  storeVoice: async (key, data) => files.set(key, data),
  loadVoice: async key => { if (!files.has(key)) throw Object.assign(Error("Missing"), { code: "ENOENT" }); return files.get(key); },
  deleteVoice: async key => files.delete(key),
} });
const { default: routes } = await import("../routes/messageRoutes.js");
const { default: errors } = await import("../middlewares/errorMiddleware.js");
before(async () => {
  const app = express(); app.use(express.json()); app.use("/api/rooms/:roomId/messages", routes); app.use(errors);
  server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api/rooms`;
});
after(() => server.close());
const send = (options = {}) => fetch(`${base}/${room}/messages/voice?durationMs=${options.duration || "1500"}`, {
  method: "POST", headers: { ...(options.anonymous ? {} : { "x-test-user": "alice" }), "Content-Type": options.mime || "audio/webm;codecs=opus" }, body: options.data || recording,
});
const load = (id = "voice-1", roomId = room) => fetch(`${base}/${roomId}/messages/${id}/voice`, { headers: { "x-test-user": "alice" } });

test("voice upload requires authentication", async () => { assert.equal((await send({ anonymous: true })).status, 401); assert.equal(files.size, 0); });
test("non-members cannot upload or read audio", async () => { member = false; assert.equal((await send()).status, 403); assert.equal((await load()).status, 403); assert.equal(files.size, 0); });
test("valid upload inserts a message without exposing its storage key", async () => {
  const response = await send(); assert.equal(response.status, 201);
  const { message } = await response.json(); assert.equal(message.voiceMime, "audio/webm"); assert.equal(message.voiceDurationMs, 1500); assert.equal(message.body, ""); assert.equal(message.voiceKey, undefined); assert.equal(files.size, 1);
});
test("playback is authenticated, private and scoped to the room", async () => {
  await send(); const response = await load(); assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "audio/webm"); assert.equal(response.headers.get("cache-control"), "no-store"); assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), recording); assert.equal((await load("voice-1", otherRoom)).status, 404);
});
test("membership removal blocks subsequent playback", async () => { await send(); member = false; assert.equal((await load()).status, 403); });
test("database insert failure removes the stored audio", async () => { fail = true; assert.equal((await send()).status, 500); assert.equal(files.size, 0); });
test("transaction conflict removes audio and returns retryable error", async () => { conflict = true; assert.equal((await send()).status, 409); assert.equal(files.size, 0); });
test("missing local audio returns a useful 404", async () => { await send(); files.clear(); assert.equal((await load()).status, 404); });
test("declared format must match its container signature", async () => { assert.equal((await send({ mime: "audio/mp4" })).status, 415); });
test("empty and malformed recordings are rejected", async () => { assert.equal((await send({ data: Buffer.alloc(0) })).status, 400); assert.equal((await send({ data: Buffer.alloc(100) })).status, 415); });
test("duration metadata is bounded", async () => { for (const duration of ["299", "120001", "nope"]) assert.equal((await send({ duration })).status, 400); });
test("upload size is independently bounded", () => { assert.throws(() => validateVoiceUpload(Buffer.alloc(MAX_VOICE_BYTES + 1), "audio/webm", "1000"), error => error.statusCode === 413); });
test("Ogg and MP4 recorder containers are accepted", () => {
  const ogg = Buffer.alloc(100); ogg.write("OggS"); const mp4 = Buffer.alloc(100); mp4.write("ftyp", 4);
  assert.equal(validateVoiceUpload(ogg, "audio/ogg;codecs=opus", "1000").extension, "ogg"); assert.equal(validateVoiceUpload(mp4, "audio/mp4", "1000").extension, "mp4");
});
