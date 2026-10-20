import { renameRoomForOwner, removeMemberForOwner, getInviteForOwner } from "../services/roomService.js";
import { saveRoomAvatar, resetRoomAvatar, readRoomAvatar } from "../services/roomAvatarService.js";
export const renameRoom = async (req, res, next) => { try { res.json({ success: true, room: await renameRoomForOwner(req.userId, req.params.roomId, req.body?.name) }); } catch (error) { next(error); } };
export const removeMember = async (req, res, next) => { try { await removeMemberForOwner(req.userId, req.params.roomId, req.params.userId); res.status(204).end(); } catch (error) { next(error); } };
export const resetInvite = async (req, res, next) => { try { res.json({ success: true, invite: await getInviteForOwner(req.userId, req.params.roomId, true) }); } catch (error) { next(error); } };
export const saveAvatar = async (req, res, next) => { try { res.json({ success: true, ...await saveRoomAvatar(req.userId, req.params.roomId, req.body) }); } catch (error) { next(error); } };
export const resetAvatar = async (req, res, next) => { try { await resetRoomAvatar(req.userId, req.params.roomId); res.status(204).end(); } catch (error) { next(error); } };
export const showAvatar = async (req, res, next) => { try { const data = await readRoomAvatar(req.params.roomId, req.query.access); res.set({ "Cache-Control": "private, max-age=60", "X-Content-Type-Options": "nosniff", "Content-Type": "image/webp" }); res.send(data); } catch (error) { next(error); } };
