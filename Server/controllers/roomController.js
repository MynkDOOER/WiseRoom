import {
  createRoomForUser, getRoomsForUser, getRoomForMember,
  joinRoomByInvite, leaveRoomForUser, getMembersForRoom, getInviteForOwner,
} from "../services/roomService.js";

export const createRoom = async (req, res, next) => {
  try {
    const room = await createRoomForUser(req.userId, req.body?.name);
    return res.status(201).json({ success: true, room });
  } catch (error) { next(error); }
};

export const listMyRooms = async (req, res, next) => {
  try {
    const rooms = await getRoomsForUser(req.userId);
    return res.json({ success: true, rooms });
  } catch (error) { next(error); }
};

export const getRoom = async (req, res, next) => {
  try {
    const room = await getRoomForMember(req.userId, req.params.roomId);
    return res.json({ success: true, room });
  } catch (error) { next(error); }
};

export const joinRoom = async (req, res, next) => {
  try {
    const room = await joinRoomByInvite(req.userId, req.body?.inviteToken);
    return res.json({ success: true, room });
  } catch (error) { next(error); }
};

export const leaveRoom = async (req, res, next) => {
  try {
    await leaveRoomForUser(req.userId, req.params.roomId);
    return res.status(204).end();
  } catch (error) { next(error); }
};

export const listMembers = async (req, res, next) => {
  try {
    const members = await getMembersForRoom(req.userId, req.params.roomId);
    return res.json({ success: true, members });
  } catch (error) { next(error); }
};

export const getRoomInvite = async (req, res, next) => {
  try {
    const invite = await getInviteForOwner(req.userId, req.params.roomId);
    return res.json({ success: true, invite });
  } catch (error) { next(error); }
};
