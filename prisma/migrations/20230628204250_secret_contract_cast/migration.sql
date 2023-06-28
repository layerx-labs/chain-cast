/*
  Warnings:

  - Added the required column `contractCastId` to the `Secret` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Secret" ADD COLUMN     "contractCastId" TEXT NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Secret" ADD CONSTRAINT "Secret_contractCastId_fkey" FOREIGN KEY ("contractCastId") REFERENCES "ContractCast"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
