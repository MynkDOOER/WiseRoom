import { apiRequest } from "./http";
const roomPath=roomId=>`/rooms/${encodeURIComponent(roomId)}`;
const messagePath=(roomId,id)=>`${roomPath(roomId)}/messages/${encodeURIComponent(id)}`;
export const reactToMessage=async(token,roomId,id,emoji,active)=>(await apiRequest(token,`${messagePath(roomId,id)}/reaction`,{method:"PUT",body:{emoji,active}})).message;
export const saveMessage=async(token,roomId,id,active)=>(await apiRequest(token,`${messagePath(roomId,id)}/saved`,{method:"PUT",body:{active}})).message;
export const getThread=(token,roomId,id,before,signal)=>apiRequest(token,`${messagePath(roomId,id)}/thread${before?`?before=${encodeURIComponent(before)}`:""}`,{signal});
export const replyToThread=async(token,roomId,id,body)=>(await apiRequest(token,`${messagePath(roomId,id)}/thread`,{method:"POST",body:{body}})).message;
export const getChanges=(token,roomId,after,signal)=>apiRequest(token,`${roomPath(roomId)}/messages/changes?after=${encodeURIComponent(after)}`,{signal});
export const markRoomRead=(token,roomId,messageId)=>apiRequest(token,`${roomPath(roomId)}/read`,{method:"POST",body:{messageId}});
export const getActivity=(token,kind,before,signal)=>apiRequest(token,`/activity/${kind}${before?`?before=${encodeURIComponent(before)}`:""}`,{signal});
export const getUnread=(token,signal)=>apiRequest(token,"/activity/unread",{signal});
export const markAllRead=token=>apiRequest(token,"/activity/read",{method:"POST"});
export const updatePresence=(token,roomId,state,signal)=>apiRequest(token,`${roomPath(roomId)}/presence`,{method:"POST",body:state,signal});
export const notifyActivity=()=>window.dispatchEvent(new Event("wiseroom:activity"));

export const pinRoom=(token,roomId,pinned)=>apiRequest(token,`${roomPath(roomId)}/pin`,{method:"PUT",body:{pinned}});
