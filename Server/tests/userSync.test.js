import test, { beforeEach, mock } from "node:test";
import assert from "node:assert/strict";

let state;

beforeEach(() => {
  state = {
    userId: null,
    profile: { firstName: "Test", lastName: "User" },
    profileCalls: [],
    writes: [],
    rows: new Map(),
    failClerk: false,
    failDatabase: false,
  };
});

mock.module("@clerk/express", {
  exports: {
    getAuth: () => ({ userId: state.userId }),
    clerkClient: {
      users: {
        async getUser(id) {
          state.profileCalls.push(id);

          if (state.failClerk) {
            throw new Error("private-clerk-details");
          }

          return state.profile;
        },
      },
    },
  },
});

mock.module(new URL("../config/db.js", import.meta.url).href, {
  exports: {
    default: {
      user: {
        async upsert(args) {
          state.writes.push(args);

          if (state.failDatabase) {
            throw new Error("private-database-details");
          }

          const existing = state.rows.get(args.where.id);
          const user = existing
            ? { ...existing, ...args.update }
            : { ...args.create, createdAt: "original-date" };

          state.rows.set(user.id, user);
          return user;
        },
      },
    },
  },
});

const { default: userRoutes } =
  await import("../routes/userRoutes.js");

const handler = userRoutes.stack.find(
  layer => layer.route?.path === "/sync"
    && layer.route.methods.post
).route.stack[0].handle;

async function request(body = {}) {
  const res = {
    statusCode: 200,
    headers: {},
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  };

  await handler({ body }, res);
  return res;
}

test("rejects signed-out users", async () => {
  const res = await request({ userId: "forged-id" });

  assert.equal(res.statusCode, 401);
  assert.equal(state.profileCalls.length, 0);
  assert.equal(state.writes.length, 0);
});

test("uses verified identity instead of request-body values", async () => {
  state.userId = "verified-id";

  const res = await request({
    userId: "forged-id",
    displayName: "forged-name",
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["Cache-Control"], "no-store");
  assert.equal(res.body.user.id, "verified-id");
  assert.equal(res.body.user.displayName, "Test User");
  assert.deepEqual(state.profileCalls, ["verified-id"]);
  assert.deepEqual(state.writes[0], {
    where: { id: "verified-id" },
    create: { id: "verified-id", displayName: "Test User" },
    update: { displayName: "Test User" },
  });
});

test("repeat visits update the name and preserve createdAt", async () => {
  state.userId = "verified-id";
  const first = await request();

  state.profile = { username: "updated-name" };
  const second = await request();

  assert.equal(second.body.user.displayName, "updated-name");
  assert.equal(second.body.user.createdAt, first.body.user.createdAt);
  assert.equal(state.rows.size, 1);
});

test("allows users without a display name", async () => {
  state.userId = "verified-id";
  state.profile = {};

  const res = await request();

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.displayName, null);
});

for (const failure of ["failClerk", "failDatabase"]) {
  test(`${failure} returns a safe error`, async () => {
    state.userId = "verified-id";
    state[failure] = true;

    const res = await request();

    assert.equal(res.statusCode, 503);
    assert.doesNotMatch(JSON.stringify(res.body), /private-/);

    if (failure === "failClerk") {
      assert.equal(state.writes.length, 0);
    }
  });
}
