-- Nullable columns preserve all existing text messages.
ALTER TABLE "Message" ADD COLUMN "voiceKey" TEXT,
                      ADD COLUMN "voiceMime" TEXT,
                      ADD COLUMN "voiceDurationMs" INTEGER;
