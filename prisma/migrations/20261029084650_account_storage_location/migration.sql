-- CreateEnum
CREATE TYPE "SecretLocation" AS ENUM ('TOOLS_VAULT', 'BITWARDEN', 'ONE_PASSWORD', 'CLIENT_HOLDS', 'OTHER');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "locationNote" VARCHAR(500),
ADD COLUMN     "storageLocation" "SecretLocation";
