import test from "node:test";
import assert from "node:assert/strict";
import { generateInviteCode, normalizeInviteCode } from "../utils/inviteCode.js";
import { roomAvatarUrl, verifyAvatarAccess } from "../utils/avatarAccess.js";
import inviteRateLimit from "../middlewares/inviteRateLimit.js";
test("invitation codes are six uppercase alphanumeric characters",()=>{for(let i=0;i<100;i++)assert.match(generateInviteCode(),/^[A-Z0-9]{6}$/);assert.equal(normalizeInviteCode(" ab12cd "),"AB12CD");for(const invalid of [null,[],"abcde","abcdefg","ab!123"])assert.throws(()=>normalizeInviteCode(invalid));});
test("picture capability binds room, user and expiry and rejects tampering",()=>{const path=roomAvatarUrl("room-a","member-a","key.webp");const token=new URL(path,"http://localhost").searchParams.get("access");const claims=verifyAvatarAccess(token,"room-a");assert.equal(claims.userId,"member-a");assert.throws(()=>verifyAvatarAccess(token,"room-b"));assert.throws(()=>verifyAvatarAccess(token.slice(0,-2)+"xx","room-a"));assert.throws(()=>verifyAvatarAccess("bad","room-a"));});
test("invitation attempts are bounded per authenticated user/IP",()=>{const req={userId:"rate-test-user",ip:"rate-test-ip"};const headers={};const res={set:(key,value)=>headers[key]=value};for(let i=0;i<30;i++)inviteRateLimit(req,res,error=>assert.equal(error,undefined));inviteRateLimit(req,res,error=>assert.equal(error.statusCode,429));assert.equal(headers["Retry-After"],"60");inviteRateLimit({userId:"another-user",ip:req.ip},res,error=>assert.equal(error.statusCode,429));});
