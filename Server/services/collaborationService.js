import prisma from "../config/db.js";
import AppError from "../utils/AppError.js";
import { transaction } from "../utils/transaction.js";
import { requireRoomMembership } from "./roomService.js";
import { decodeMessageCursor,encodeMessageCursor } from "../utils/messageCursor.js";
import * as repository from "../repositories/collaborationRepository.js";
import { readPresence,updatePresence } from "../utils/roomPresence.js";
export const reactionChoices=["👍","🔥","👀","❤️","😂","🎉"];
const checkId=id=>{if(typeof id!=="string"||!/^[0-9a-f-]{36}$/i.test(id))throw new AppError(400,"Invalid message ID.");};
const inRoom=(userId,roomId,operation)=>transaction(async tx=>{await requireRoomMembership(userId,roomId,tx);return operation(tx);});
async function requireMessage(roomId,messageId,userId,db) {checkId(messageId);const message=await repository.findScopedMessage(roomId,messageId,userId,db);if(!message)throw new AppError(404,"Message not found in this room.");return message;}
export const changeReaction=(userId,roomId,messageId,body)=>{
  if(!reactionChoices.includes(body?.emoji)||typeof body?.active!=="boolean")throw new AppError(400,"Choose a supported reaction and its active state.");
  return inRoom(userId,roomId,async tx=>{await requireMessage(roomId,messageId,userId,tx);await repository.setReaction(messageId,userId,body.emoji,body.active,tx);return repository.findScopedMessage(roomId,messageId,userId,tx);});
};
export const changeSaved=(userId,roomId,messageId,active)=>{
  if(typeof active!=="boolean")throw new AppError(400,"Specify whether to save this message.");
  return inRoom(userId,roomId,async tx=>{await requireMessage(roomId,messageId,userId,tx);await repository.setSaved(messageId,userId,active,tx);return repository.findScopedMessage(roomId,messageId,userId,tx);});
};
export const getThread=(userId,roomId,messageId,before)=>inRoom(userId,roomId,async tx=>{
  let parent=await requireMessage(roomId,messageId,userId,tx);
  if(parent.parentId)parent=await requireMessage(roomId,parent.parentId,userId,tx);
  const cursor=decodeMessageCursor(before,roomId);
  const rows=await repository.findReplies(roomId,parent.id,userId,cursor,30,tx);
  const hasMore=rows.length>30,page=rows.slice(0,30);
  return {parent,replies:page.reverse(),pagination:{hasMore,nextCursor:hasMore?encodeMessageCursor(roomId,page[0]):null}};
});
export const replyToThread=(userId,roomId,messageId,body)=>{
  if(typeof body!=="string"||!body.trim()||body.trim().length>4000)throw new AppError(400,"Replies must contain 1 to 4,000 characters.");
  return inRoom(userId,roomId,async tx=>{const parent=await requireMessage(roomId,messageId,userId,tx);if(parent.parentId)throw new AppError(400,"Reply to the original message in this thread.");return repository.insertReply(roomId,messageId,userId,body.trim(),tx);});
};
export const getChanges=(userId,roomId,after)=>inRoom(userId,roomId,async tx=>{
  const cursor=decodeMessageCursor(after,roomId);
  if(!cursor)throw new AppError(400,"A synchronization cursor is required.");
  const rows=await repository.findNewMessages(roomId,userId,cursor,100,tx),hasMore=rows.length>100,messages=rows.slice(0,100);
  return {messages,hasMore,syncCursor:messages.length?encodeMessageCursor(roomId,messages.at(-1)):after};
});
export const markRoomRead=(userId,roomId,messageId)=>inRoom(userId,roomId,async tx=>{
  if(!messageId)return;
  const message=await requireMessage(roomId,messageId,userId,tx);
  await repository.readRoomThrough(roomId,userId,message.createdAt,tx);
});
export const presenceFor=async(userId,roomId,body)=>{
  await requireRoomMembership(userId,roomId);
  if(body!==undefined) {if(typeof body.active!=="boolean"||typeof body.typing!=="boolean")throw new AppError(400,"Invalid presence state.");updatePresence(roomId,userId,body);}
  const current=readPresence(roomId);
  // Filter against current membership so a removed person disappears immediately.
  const valid=await prisma.roomMember.findMany({where:{roomId,userId:{in:current.online}},select:{userId:true}});
  const ids=new Set(valid.map(row=>row.userId));
  return {online:current.online.filter(id=>ids.has(id)),typing:current.typing.filter(id=>ids.has(id)&&id!==userId)};
};
export async function activityFor(userId,kind,before) {
  if(!["inbox","threads","saved"].includes(kind))throw new AppError(404,"Unknown activity view.");
  const cursor=decodeMessageCursor(before,"activity");
  const rows=await repository.getActivity(userId,kind,cursor,30),hasMore=rows.length>30,messages=rows.slice(0,30);
  return {messages,pagination:{hasMore,nextCursor:hasMore?encodeMessageCursor("activity",messages.at(-1)):null}};
}
export const unreadFor=async userId=>{const rows=await repository.getUnreadCounts(userId);return {rooms:rows.map(row=>({roomId:row.roomId,count:row._count._all})),total:rows.reduce((sum,row)=>sum+row._count._all,0)};};
export const readAllFor=userId=>repository.markAllRead(userId,new Date());

export const pinRoom=(userId,roomId,pinned)=>{if(typeof pinned!=="boolean")throw new AppError(400,"Specify a pin state.");return inRoom(userId,roomId,async tx=>{await repository.pinMembership(roomId,userId,pinned,tx);});};
