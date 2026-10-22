import {
  publishRoom,
  publishUsers,
  revokeRoomAccess,
  closeRoom,
} from "../realtime/events.js";
import {
  transferRoomOwnership,
  deleteRoomForOwner,
  renameRoomForOwner,
  removeMemberForOwner,
  getInviteForOwner,
} from "../services/roomService.js";
import {
  saveRoomAvatar,
  resetRoomAvatar,
  readRoomAvatar,
} from "../services/roomAvatarService.js";
export const renameRoom = async (req, res, next) => {
  try {
    const room = await renameRoomForOwner(
      req.userId,
      req.params.roomId,
      req.body?.name,
    );
    await publishRoom(req.params.roomId, "room:changed");
    res.json({ success: true, room });
  } catch (error) {
    next(error);
  }
};
export const removeMember = async (req, res, next) => {
  try {
    await removeMemberForOwner(
      req.userId,
      req.params.roomId,
      req.params.userId,
    );
    revokeRoomAccess(req.params.roomId, req.params.userId);
    await publishRoom(req.params.roomId, "members:changed");
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
export const resetInvite = async (req, res, next) => {
  try {
    const invite = await getInviteForOwner(req.userId, req.params.roomId, true);
    publishUsers([req.userId], "invitation:changed", {
      roomId: req.params.roomId,
    });
    res.json({ success: true, invite });
  } catch (error) {
    next(error);
  }
};
export const saveAvatar = async (req, res, next) => {
  try {
    const avatar = await saveRoomAvatar(
      req.userId,
      req.params.roomId,
      req.body,
    );
    await publishRoom(req.params.roomId, "room:changed");
    res.json({ success: true, ...avatar });
  } catch (error) {
    next(error);
  }
};
export const resetAvatar = async (req, res, next) => {
  try {
    await resetRoomAvatar(req.userId, req.params.roomId);
    await publishRoom(req.params.roomId, "room:changed");
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
export const showAvatar = async (req, res, next) => {
  try {
    const data = await readRoomAvatar(req.params.roomId, req.query.access);
    res.set({
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
      "Content-Type": "image/webp",
    });
    res.send(data);
  } catch (error) {
    next(error);
  }
};

export const transferOwnership = async (req, res, next) => {
  try {
    const result = await transferRoomOwnership(
      req.userId,
      req.params.roomId,
      req.body?.userId,
    );
    await publishRoom(req.params.roomId, "ownership:changed");
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
export const deleteRoom = async (req, res, next) => {
  try {
    const recipients = await deleteRoomForOwner(req.userId, req.params.roomId);
    closeRoom(req.params.roomId, recipients);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
