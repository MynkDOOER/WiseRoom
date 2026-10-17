import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createUserRepository } from "../repositories/userRepository.js";
import { createUserService } from "../services/userService.js";
import { createUserController } from "../controllers/userController.js";
import { createUserRouter } from "../routes/userRoutes.js";

async function setup(t) {
  const state = {
    userId: null,
    profile: { firstName: "Mayan", lastName: "Singh", username: "mayan" },
    profileCalls: [],
    writes: [],
    rows: new Map(),
    failProfile: false,
    failDatabase: false,
  };
  const sql = async (strings, id, displayName) => {
    if (state.failDatabase) throw new Error("private-database-details");
    state.writes.push({ text: strings.join("?"), id, displayName });
    const user = {
      id, displayName,
      createdAt: state.rows.get(id)?.createdAt || "2026-10-17T00:00:00.000Z",
    };
    state.rows.set(id, user);
    return [user];
  };
  const clerkClient = { users: { async getUser(id) {
    state.profileCalls.push(id);
    if (state.failProfile) throw new Error("private-clerk-details");
    return state.profile;
  } } };
  const userRepository = createUserRepository(sql);
  const userService = createUserService({ clerkClient, userRepository });
  const userController = createUserController({
    getAuth: () => ({ userId: state.userId }), userService,
  });
  const app = express();
  app.use(express.json());
  app.use("/api/users", createUserRouter(userController));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/api/users/sync`;
  return {
    state,
    post: (body = {}) => fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    }),
  };
}

test("signed-out requests cannot create users, even with a forged body", async t => {
  const { state, post } = await setup(t);
  const response = await post({ userId: "victim", displayName: "forged" });
  assert.equal(response.status, 401);
  assert.equal(state.profileCalls.length, 0);
  assert.equal(state.writes.length, 0);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("only verified identity and Clerk profile reach the repository", async t => {
  const { state, post } = await setup(t);
  state.userId = "user_verified";
  state.profile = { firstName: "O'Brien", lastName: "Singh" };
  const response = await post({ userId: "victim", displayName: "forged" });
  assert.equal(response.status, 200);
  const { user } = await response.json();
  assert.equal(user.id, "user_verified");
  assert.equal(user.displayName, "O'Brien Singh");
  assert.deepEqual(state.profileCalls, ["user_verified"]);
  assert.equal(state.writes[0].id, "user_verified");
  assert.equal(state.writes[0].displayName, "O'Brien Singh");
  assert.ok(!state.writes[0].text.includes("O'Brien"));
});

test("return visits update the name and preserve the original creation date", async t => {
  const { state, post } = await setup(t);
  state.userId = "user_verified";
  const first = await (await post()).json();
  state.profile = { username: "updated-name" };
  const second = await (await post()).json();
  assert.equal(second.user.displayName, "updated-name");
  assert.equal(second.user.createdAt, first.user.createdAt);
  assert.equal(state.rows.size, 1);
  assert.match(state.writes[1].text, /ON CONFLICT \("id"\) DO UPDATE/);
});

test("users without a name or username can still sync", async t => {
  const { state, post } = await setup(t);
  state.userId = "user_verified";
  state.profile = {};
  const response = await post();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.displayName, null);
});

for (const dependency of ["Profile", "Database"]) {
  test(`${dependency} failure returns a retryable response without private details`, async t => {
    const { state, post } = await setup(t);
    state.userId = "user_verified";
    state[`fail${dependency}`] = true;
    const response = await post();
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /private-/);
    if (dependency === "Profile") assert.equal(state.writes.length, 0);
  });
}
