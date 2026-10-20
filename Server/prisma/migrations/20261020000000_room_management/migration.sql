-- Additive migration: existing users, memberships and messages are preserved.
CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
ALTER TABLE "Room" ADD COLUMN "inviteCode" TEXT,
  ADD COLUMN "avatarKey" TEXT,
  ADD COLUMN "avatarUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX "Room_inviteCode_key" ON "Room"("inviteCode");
CREATE TABLE "RoomJoinRequest" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  "decidedById" TEXT,
  CONSTRAINT "RoomJoinRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RoomJoinRequest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RoomJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RoomJoinRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RoomJoinRequest_roomId_userId_key" ON "RoomJoinRequest"("roomId", "userId");
CREATE INDEX "RoomJoinRequest_roomId_status_createdAt_id_idx" ON "RoomJoinRequest"("roomId", "status", "createdAt", "id");
CREATE INDEX "RoomJoinRequest_userId_status_idx" ON "RoomJoinRequest"("userId", "status");
