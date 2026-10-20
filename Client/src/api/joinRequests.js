import { apiRequest } from "./http";
export const getJoinRequests = (token, roomId, cursor) => apiRequest(token, `/rooms/${encodeURIComponent(roomId)}/join-requests${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`);
export const decideJoinRequest = (token, roomId, requestId, decision) => apiRequest(token, `/rooms/${encodeURIComponent(roomId)}/join-requests/${encodeURIComponent(requestId)}`, { method: "PATCH", body: { decision } });
