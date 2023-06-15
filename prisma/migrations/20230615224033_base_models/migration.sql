-- CreateEnum
CREATE TYPE "ContractCastType" AS ENUM ('BEPRO_NETWORK_V2', 'BEPRO_FACTORY', 'BEPRO_REGISTRY', 'BEPRO_POP', 'ERC20', 'ERC721', 'ERC1155');

-- CreateTable
CREATE TABLE "ContractCast" (
    "id" VARCHAR(30) NOT NULL,
    "type" "ContractCastType" NOT NULL,
    "address" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "blockNumber" INTEGER NOT NULL DEFAULT 0,
    "program" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractCast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractCast_chainId_address_key" ON "ContractCast"("chainId", "address");
