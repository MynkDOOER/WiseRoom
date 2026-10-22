import { publishRoom, publishUsers } from "../realtime/events.js";
import * as service from "../services/collaborationService.js";

const handle = (operation) => async (req, res, next) => {
  try {
    const data = await operation(req);
    if (data === undefined) return res.status(204).end();
    return res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

export const reactToMessage = handle(async (req) => {
  const message = await service.changeReaction(
    req.userId,
    req.params.roomId,
    req.params.messageId,
    req.body,
  );
  await publishRoom(req.params.roomId, "message:updated", {
    messageId: message.id,
    parentId: message.parentId,
  });
  return { message };
});
export const saveMessage = handle(async (req) => {
  const message = await service.changeSaved(
    req.userId,
    req.params.roomId,
    req.params.messageId,
    req.body?.active,
  );
  publishUsers([req.userId], "saved:changed", {
    roomId: req.params.roomId,
    messageId: message.id,
  });
  return { message };
});

export const thread = handle((req) =>
  service.getThread(
    req.userId,
    req.params.roomId,
    req.params.messageId,
    req.query.before,
  ),
);

export const reply = handle(async (req) => {
  const message = await service.replyToThread(
    req.userId,
    req.params.roomId,
    req.params.messageId,
    req.body?.body,
  );
  await publishRoom(req.params.roomId, "thread:changed", {
    messageId: message.id,
    parentId: message.parentId,
  });
  return { message };
});

export const changes = handle((req) =>
  service.getChanges(req.userId, req.params.roomId, req.query.after),
);

export const read = handle(async (req) => {
  await service.markRoomRead(
    req.userId,
    req.params.roomId,
    req.body?.messageId,
  );
  publishUsers([req.userId], "read:changed", { roomId: req.params.roomId });
});

export const presence = handle((req) =>
  service.presenceFor(
    req.userId,
    req.params.roomId,
    req.method === "POST" ? req.body : undefined,
  ),
);

export const activity = handle((req) =>
  service.activityFor(req.userId, req.params.kind, req.query.before),
);

export const unread = handle((req) => service.unreadFor(req.userId));

export const readAll = handle(async (req) => {
  await service.readAllFor(req.userId);
  publishUsers([req.userId], "read:changed");
});

export const pin = handle(async (req) => {
  await service.pinRoom(req.userId, req.params.roomId, req.body?.pinned);
  publishUsers([req.userId], "rooms:changed", { roomId: req.params.roomId });
});
