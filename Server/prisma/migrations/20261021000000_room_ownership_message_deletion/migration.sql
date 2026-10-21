-- Preserve message identity, order and thread relationships after content deletion.
ALTER TABLE "Message" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Transfers demote the previous owner before promoting the next inside one transaction.
CREATE UNIQUE INDEX "RoomMember_one_owner_per_room"
ON "RoomMember" ("roomId") WHERE "role" = 'OWNER';
