import prisma from "../config/db.js";
import { messageFields } from "./messageRepository.js";
export const fieldsFor = userId => ({ ...messageFields, savedBy: { where: { userId }, select: { userId: true } } });
export const findScopedMessage = (roomId,id,userId,db=prisma) => db.message.findFirst({ where:{roomId,id}, select:fieldsFor(userId) });
export const findReplies = (roomId,parentId,userId,before,limit,db=prisma) => db.message.findMany({ where:{ roomId,parentId,...(before?{OR:[{createdAt:{lt:before.createdAt}},{createdAt:before.createdAt,id:{lt:before.id}}]}:{}) },orderBy:[{createdAt:"desc"},{id:"desc"}],take:limit+1,select:fieldsFor(userId) });
export const insertReply = (roomId,parentId,userId,body,db=prisma) => db.message.create({data:{roomId,parentId,authorId:userId,body},select:fieldsFor(userId)});
export const findNewMessages = (roomId,userId,after,limit,db=prisma) => db.message.findMany({where:{roomId,parentId:null,...(after?{OR:[{createdAt:{gt:after.createdAt}},{createdAt:after.createdAt,id:{gt:after.id}}]}:{})},orderBy:[{createdAt:"asc"},{id:"asc"}],take:limit+1,select:fieldsFor(userId)});
export const setReaction = async (messageId,userId,emoji,active,db=prisma) => {
  if(active) return db.messageReaction.upsert({where:{messageId_userId_emoji:{messageId,userId,emoji}},create:{messageId,userId,emoji},update:{}});
  return db.messageReaction.deleteMany({where:{messageId,userId,emoji}});
};
export const setSaved = async (messageId,userId,active,db=prisma) => {
  if(active) return db.savedMessage.upsert({where:{messageId_userId:{messageId,userId}},create:{messageId,userId},update:{}});
  return db.savedMessage.deleteMany({where:{messageId,userId}});
};
export const readRoomThrough = (roomId,userId,date,db=prisma) => db.roomMember.updateMany({where:{roomId,userId,lastReadAt:{lt:date}},data:{lastReadAt:date}});
export const membershipsFor = (userId,db=prisma) => db.roomMember.findMany({where:{userId},select:{roomId:true,lastReadAt:true,room:{select:{id:true,name:true}}}});
export const unreadWhere = (userId,memberships) => ({authorId:{not:userId},OR:memberships.map(member=>({roomId:member.roomId,createdAt:{gt:member.lastReadAt}}))});
export async function getActivity(userId,kind,before,limit,db=prisma) {
  const membership = {room:{members:{some:{userId}}}};
  const cursor = before ? {OR:[{createdAt:{lt:before.createdAt}},{createdAt:before.createdAt,id:{lt:before.id}}]} : {};
  let where=membership;
  if(kind==="inbox") {
    const members=await membershipsFor(userId,db);
    if(!members.length)return [];
    where={AND:[membership,unreadWhere(userId,members)]};
  }
  if(kind==="saved") where={...membership,savedBy:{some:{userId}}};
  if(kind==="threads") where={...membership,parentId:null,replies:{some:{}}};
  return db.message.findMany({where:{AND:[where,cursor]},orderBy:[{createdAt:"desc"},{id:"desc"}],take:limit+1,select:{...fieldsFor(userId),room:{select:{id:true,name:true}}}});
}
export const getUnreadCounts = async (userId,db=prisma) => {
  const members=await membershipsFor(userId,db);
  if(!members.length)return [];
  return db.message.groupBy({by:["roomId"],where:unreadWhere(userId,members),_count:{_all:true}});
};
export const markAllRead = (userId,date,db=prisma) => db.roomMember.updateMany({where:{userId,lastReadAt:{lt:date}},data:{lastReadAt:date}});

export const pinMembership=(roomId,userId,pinned,db=prisma)=>db.roomMember.update({where:{roomId_userId:{roomId,userId}},data:{pinned}});
