ALTER TABLE "Template"
  ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "userId" TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Template") AND NOT EXISTS (SELECT 1 FROM "User") THEN
    RAISE EXCEPTION 'Cannot assign existing templates because no user exists';
  END IF;
END $$;

UPDATE "Template"
SET "userId" = (
  SELECT "id"
  FROM "User"
  ORDER BY CASE WHEN "role" = 'admin' THEN 0 ELSE 1 END, "createdAt" ASC, "id" ASC
  LIMIT 1
)
WHERE "userId" IS NULL;

ALTER TABLE "Template" ALTER COLUMN "userId" SET NOT NULL;
DROP INDEX "Template_title_key";
CREATE UNIQUE INDEX "Template_userId_title_key" ON "Template"("userId", "title");
CREATE INDEX "Template_userId_idx" ON "Template"("userId");
ALTER TABLE "Template"
  ADD CONSTRAINT "Template_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
