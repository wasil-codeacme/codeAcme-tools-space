-- CreateEnum
CREATE TYPE "ToolAccessLevel" AS ENUM ('VIEW', 'EDIT');

-- CreateTable
CREATE TABLE "UserToolAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolId" VARCHAR(64) NOT NULL,
    "level" "ToolAccessLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserToolAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserToolAccess_userId_toolId_key" ON "UserToolAccess"("userId", "toolId");

-- AddForeignKey
ALTER TABLE "UserToolAccess" ADD CONSTRAINT "UserToolAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing members keep the access they had before per-tool permissions: full access to every tool.
INSERT INTO "UserToolAccess" ("id", "userId", "toolId", "level", "updatedAt")
SELECT gen_random_uuid()::text, "User"."id", tool."id", 'EDIT', now()
FROM "User"
CROSS JOIN (VALUES ('time-tracking'), ('accounts'), ('work-timer')) AS tool("id")
WHERE "User"."role" = 'MEMBER';
