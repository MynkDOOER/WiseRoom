import { previewInvitation, submitJoinRequest, cancelJoinRequest, cancelOwnRequest, getJoinRequests, decideJoinRequest, getMyJoinRequests } from "../services/joinRequestService.js";
export const previewInvite = async (req, res, next) => { try { res.json({ success: true, ...await previewInvitation(req.userId, req.params.code) }); } catch (error) { next(error); } };
export const requestAccess = async (req, res, next) => { try { res.status(200).json({ success: true, ...await submitJoinRequest(req.userId, req.params.code) }); } catch (error) { next(error); } };
export const cancelAccess = async (req, res, next) => { try { await cancelJoinRequest(req.userId, req.params.code); res.status(204).end(); } catch (error) { next(error); } };
export const listRequests = async (req, res, next) => { try { res.json({ success: true, ...await getJoinRequests(req.userId, req.params.roomId, req.query.cursor) }); } catch (error) { next(error); } };
export const decideRequest = async (req, res, next) => { try { res.json({ success: true, request: await decideJoinRequest(req.userId, req.params.roomId, req.params.requestId, req.body?.decision) }); } catch (error) { next(error); } };
export const myRequests = async (req, res, next) => { try { res.json({ success: true, requests: await getMyJoinRequests(req.userId) }); } catch (error) { next(error); } };
export const cancelMyRequest = async (req, res, next) => { try { await cancelOwnRequest(req.userId, req.params.requestId); res.status(204).end(); } catch (error) { next(error); } };
