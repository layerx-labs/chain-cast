/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `ContractCast` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ContractCast" ADD COLUMN     "name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ContractCast_name_key" ON "ContractCast"("name");
