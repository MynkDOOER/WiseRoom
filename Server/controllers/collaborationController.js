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

export const reactToMessage = handle(async (req) => ({
  message: await service.changeReaction(
    req.userId,
    req.params.roomId,
    req.params.messageId,
    req.body,
  ),
}));

export const saveMessage = handle(async (req) => ({
  message: await service.changeSaved(
    req.userId,
    req.params.roomId,
    req.params.messageId,
    req.body?.active,
  ),
}));

export const thread = handle((req) =>
  service.getThread(
    req.userId,
    req.params.roomId,
    req.params.messageId,
    req.query.before,
  ),
);

export const reply = handle(async (req) => ({
  message: await service.replyToThread(
    req.userId,
    req.params.roomId,
    req.params.messageId,
    req.body?.body,
  ),
}));

export const changes = handle((req) =>
  service.getChanges(req.userId, req.params.roomId, req.query.after),
);

export const read = handle(async (req) => {
  await service.markRoomRead(
    req.userId,
    req.params.roomId,
    req.body?.messageId,
  );
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
});

export const pin = handle(async (req) => {
  await service.pinRoom(req.userId, req.params.roomId, req.body?.pinned);
});
