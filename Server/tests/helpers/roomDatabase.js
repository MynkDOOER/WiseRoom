import { randomUUID } from "node:crypto";

export function roomDatabase() {
  let state;
  let queue = Promise.resolve();
  const memberKey = (roomId, userId) => `${roomId}:${userId}`;
  const reset = () => {
    state = {
      users: new Map(
        ["owner", "alice", "outsider"].map((id) => [
          id,
          { id, displayName: id },
        ]),
      ),
      rooms: new Map(),
      members: new Map(),
      requests: new Map(),
      conflicts: 0,
      fail: false,
      createCalls: [],
    };
    queue = Promise.resolve();
    return state;
  };
  function selectRoom(room, select) {
    if (!room) return null;
    const result = {};
    for (const field of [
      "id",
      "name",
      "createdById",
      "inviteToken",
      "inviteCode",
      "avatarKey",
      "avatarUpdatedAt",
      "createdAt",
      "updatedAt",
    ])
      if (select[field]) result[field] = room[field];
    const members = [...state.members.values()].filter(
      (item) => item.roomId === room.id,
    );
    if (select._count)
      result._count = {
        members: members.length,
        joinRequests: [...state.requests.values()].filter(
          (item) => item.roomId === room.id && item.status === "PENDING",
        ).length,
      };
    if (select.members)
      result.members = members
        .filter((item) => item.userId === select.members.where.userId)
        .map((item) => ({ role: item.role }));
    return result;
  }
  const db = {
    async $transaction(operation, options) {
      if (options.isolationLevel !== "Serializable")
        throw Error("Expected serializable transaction");
      const run = queue.then(async () => {
        if (state.conflicts > 0) {
          state.conflicts--;
          throw Object.assign(Error("Conflict"), { code: "P2034" });
        }
        const backup = structuredClone({
          rooms: state.rooms,
          members: state.members,
          requests: state.requests,
        });
        try {
          return await operation(db);
        } catch (error) {
          Object.assign(state, backup);
          throw error;
        }
      });
      queue = run.catch(() => {});
      return run;
    },
    user: {
      async findUnique({ where }) {
        return state.users.get(where.id) || null;
      },
      async upsert({ where, create, update }) {
        const row = state.users.has(where.id)
          ? { ...state.users.get(where.id), ...update }
          : create;
        state.users.set(where.id, row);
        return row;
      },
    },
    room: {
      async create({ data, select }) {
        if (state.fail) throw Error("private-database-details");
        if (
          [...state.rooms.values()].some(
            (item) => item.inviteCode === data.inviteCode,
          )
        )
          throw Object.assign(Error("Duplicate"), { code: "P2002" });
        state.createCalls.push(data);
        const { members, ...fields } = data;
        const row = {
          ...fields,
          id: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          avatarKey: null,
        };
        state.rooms.set(row.id, row);
        state.members.set(memberKey(row.id, members.create.userId), {
          ...members.create,
          roomId: row.id,
          joinedAt: new Date(),
        });
        return selectRoom(row, select);
      },
      async findUnique({ where, select }) {
        const row = where.id
          ? state.rooms.get(where.id)
          : [...state.rooms.values()].find((item) =>
              where.inviteCode
                ? item.inviteCode === where.inviteCode
                : item.inviteToken === where.inviteToken,
            );
        return selectRoom(row, select);
      },
      async findMany({ where, select }) {
        return [...state.rooms.values()]
          .filter((item) =>
            state.members.has(memberKey(item.id, where.members.some.userId)),
          )
          .map((item) => selectRoom(item, select));
      },
      async update({ where, data, select }) {
        const row = state.rooms.get(where.id);
        if (!row) throw Object.assign(Error("Missing"), { code: "P2025" });
        if (
          data.inviteCode &&
          [...state.rooms.values()].some(
            (item) => item.id !== row.id && item.inviteCode === data.inviteCode,
          )
        )
          throw Object.assign(Error("Duplicate"), { code: "P2002" });
        Object.assign(row, data, { updatedAt: new Date() });
        return selectRoom(row, select);
      },
    },
    roomMember: {
      async findUnique({ where }) {
        const { roomId, userId } = where.roomId_userId;
        return state.members.get(memberKey(roomId, userId)) || null;
      },
      async upsert({ where, create, update }) {
        const { roomId, userId } = where.roomId_userId;
        const key = memberKey(roomId, userId);
        const row = state.members.has(key)
          ? { ...state.members.get(key), ...update }
          : { ...create, joinedAt: new Date() };
        state.members.set(key, row);
        return row;
      },
      async deleteMany({ where }) {
        const key = memberKey(where.roomId, where.userId);
        if (state.members.get(key)?.role !== where.role) return { count: 0 };
        state.members.delete(key);
        return { count: 1 };
      },
      async findMany({ where }) {
        return [...state.members.values()]
          .filter((item) => item.roomId === where.roomId)
          .map((item) => ({ ...item, user: state.users.get(item.userId) }));
      },
    },
    roomJoinRequest: {
      async findUnique({ where }) {
        return where.id
          ? state.requests.get(where.id) || null
          : [...state.requests.values()].find(
              (item) =>
                item.roomId === where.roomId_userId.roomId &&
                item.userId === where.roomId_userId.userId,
            ) || null;
      },
      async upsert({ where, create, update }) {
        let row = await db.roomJoinRequest.findUnique({ where });
        if (row) Object.assign(row, update, { updatedAt: new Date() });
        else {
          row = {
            id: randomUUID(),
            status: "PENDING",
            ...create,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          state.requests.set(row.id, row);
        }
        return row;
      },
      async update({ where, data }) {
        const row = state.requests.get(where.id);
        Object.assign(row, data, { updatedAt: new Date() });
        return row;
      },
      async findMany({ where, orderBy, take }) {
        let rows = [...state.requests.values()].filter(
          (row) =>
            (!where.roomId || row.roomId === where.roomId) &&
            (!where.userId || row.userId === where.userId) &&
            (typeof where.status === "string"
              ? row.status === where.status
              : where.status.in.includes(row.status)),
        );
        if (where.OR) {
          const boundary = where.OR[0].createdAt.gt;
          const id = where.OR[1].id.gt;
          rows = rows.filter(
            (row) =>
              row.createdAt > boundary ||
              (+row.createdAt === +boundary && row.id > id),
          );
        }
        rows.sort((a, b) =>
          Array.isArray(orderBy)
            ? +a.createdAt - +b.createdAt || a.id.localeCompare(b.id)
            : +b.updatedAt - +a.updatedAt,
        );
        return rows
          .slice(0, take)
          .map((row) => ({
            ...row,
            user: state.users.get(row.userId),
            room: {
              name: state.rooms.get(row.roomId)?.name,
              inviteCode: state.rooms.get(row.roomId)?.inviteCode,
              members: state.members.has(memberKey(row.roomId, row.userId))
                ? [{ userId: row.userId }]
                : [],
            },
          }));
      },
    },
  };
  reset();
  return { db, reset, getState: () => state, memberKey };
}
