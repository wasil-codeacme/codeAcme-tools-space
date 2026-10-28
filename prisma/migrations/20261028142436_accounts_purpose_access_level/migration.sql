/*
  Warnings:

  - You are about to drop the column `kind` on the `Account` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AccountAccessLevel" AS ENUM ('MASTER', 'ADMIN', 'USER');

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "kind",
ADD COLUMN     "accessLevel" "AccountAccessLevel",
ADD COLUMN     "purpose" VARCHAR(1000);

-- DropEnum
DROP TYPE "AccountKind";
