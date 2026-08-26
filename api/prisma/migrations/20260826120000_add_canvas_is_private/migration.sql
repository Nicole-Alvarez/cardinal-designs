-- CreateTable
CREATE TABLE "Canvas" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "content" JSONB,
    "html" TEXT,
    "react" TEXT,
    "angular" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Canvas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Canvas_templateId_title_key" ON "Canvas"("templateId", "title");

-- CreateIndex
CREATE INDEX "Canvas_templateId_idx" ON "Canvas"("templateId");

-- AddForeignKey
ALTER TABLE "Canvas" ADD CONSTRAINT "Canvas_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddColumn
ALTER TABLE "Template" ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT true;

-- MigrateData: copy existing template content into a canvas row
INSERT INTO "Canvas" ("id", "templateId", "title", "position", "content", "html", "react", "angular", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "id",
    "title",
    0,
    "content",
    "html",
    "react",
    "angular",
    "createdAt",
    "updatedAt"
FROM "Template";

-- DropColumns
ALTER TABLE "Template" DROP COLUMN "content";
ALTER TABLE "Template" DROP COLUMN "html";
ALTER TABLE "Template" DROP COLUMN "react";
ALTER TABLE "Template" DROP COLUMN "angular";
