ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS "UserConfiguration" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "templateLimit" INTEGER NOT NULL DEFAULT 5,
  "canvasLimitPerTemplate" INTEGER NOT NULL DEFAULT 2,
  "canUseGenerateAI" BOOLEAN NOT NULL DEFAULT false,
  "metadataEnabled" BOOLEAN NOT NULL DEFAULT true,
  "canDownloadAssets" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserConfiguration_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserConfiguration_templateLimit_check" CHECK ("templateLimit" >= 0 AND "templateLimit" <= 1000),
  CONSTRAINT "UserConfiguration_canvasLimitPerTemplate_check" CHECK ("canvasLimitPerTemplate" >= 0 AND "canvasLimitPerTemplate" <= 100)
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserConfiguration_userId_key" ON "UserConfiguration"("userId");
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserConfiguration_templateLimit_check') THEN
    ALTER TABLE "UserConfiguration" ADD CONSTRAINT "UserConfiguration_templateLimit_check" CHECK ("templateLimit" >= 0 AND "templateLimit" <= 1000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserConfiguration_canvasLimitPerTemplate_check') THEN
    ALTER TABLE "UserConfiguration" ADD CONSTRAINT "UserConfiguration_canvasLimitPerTemplate_check" CHECK ("canvasLimitPerTemplate" >= 0 AND "canvasLimitPerTemplate" <= 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserConfiguration_userId_fkey') THEN
    ALTER TABLE "UserConfiguration" ADD CONSTRAINT "UserConfiguration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
INSERT INTO "UserConfiguration" ("id", "userId", "updatedAt")
SELECT CONCAT('cfg_', "id"), "id", CURRENT_TIMESTAMP FROM "User"
ON CONFLICT ("userId") DO NOTHING;
