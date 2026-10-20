const rooms=new Map();
const TTL=60000;
export function updatePresence(roomId,userId,{active=true,typing=false}={},now=Date.now()) {
  let members=rooms.get(roomId);
  if(!active) { members?.delete(userId); if(!members?.size)rooms.delete(roomId); return; }
  if(!members) { members=new Map(); rooms.set(roomId,members); }
  members.set(userId,{seenAt:now,typingUntil:typing ? now+5000 : 0});
  // Bound memory to recently active rooms; no persistent credentials are stored.
  for(const [id,people] of rooms) { for(const [uid,state] of people)if(now-state.seenAt>TTL)people.delete(uid); if(!people.size)rooms.delete(id); }
}
export function readPresence(roomId,now=Date.now()) {
  const members=rooms.get(roomId);
  if(!members)return {online:[],typing:[]};
  const online=[],typing=[];
  for(const [userId,state] of members) {
    if(now-state.seenAt>TTL) { members.delete(userId);continue; }
    online.push(userId); if(state.typingUntil>now)typing.push(userId);
  }
  return {online,typing};
}
