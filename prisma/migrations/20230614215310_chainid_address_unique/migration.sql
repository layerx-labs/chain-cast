/*
  Warnings:

  - A unique constraint covering the columns `[chainId,address]` on the table `ChainCast` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ChainCast_chainId_address_key" ON "ChainCast"("chainId", "address");
