-- CreateEnum
CREATE TYPE "AccountKind" AS ENUM ('LOGIN', 'API_KEY', 'EMAIL', 'HOSTING', 'DATABASE', 'DOMAIN', 'OTHER');

-- CreateEnum
CREATE TYPE "AccountAuditAction" AS ENUM ('CREATED', 'UPDATED', 'SECRET_CHANGED', 'REVEALED', 'COPIED', 'ARCHIVED', 'RESTORED');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "kind" "AccountKind" NOT NULL DEFAULT 'LOGIN',
    "url" VARCHAR(2048),
    "username" VARCHAR(255),
    "twoFactor" VARCHAR(255),
    "notes" TEXT,
    "secretCiphertext" TEXT,
    "secureNotesCiphertext" TEXT,
    "secretUpdatedAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountAuditEvent" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AccountAuditAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_clientId_idx" ON "Account"("clientId");

-- CreateIndex
CREATE INDEX "Account_isArchived_idx" ON "Account"("isArchived");

-- CreateIndex
CREATE INDEX "AccountAuditEvent_accountId_createdAt_idx" ON "AccountAuditEvent"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "AccountAuditEvent_createdAt_idx" ON "AccountAuditEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountAuditEvent" ADD CONSTRAINT "AccountAuditEvent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountAuditEvent" ADD CONSTRAINT "AccountAuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
