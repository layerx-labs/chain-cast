-- CreateEnum
CREATE TYPE "ContractCastType" AS ENUM ('CUSTOM', 'ERC20', 'ERC721', 'ERC1155');

-- CreateTable
CREATE TABLE "ContractCast" (
    "id" VARCHAR(30) NOT NULL,
    "type" "ContractCastType" NOT NULL,
    "abi" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "blockNumber" INTEGER NOT NULL DEFAULT 0,
    "transactionIndex" INTEGER NOT NULL DEFAULT 0,
    "program" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractCast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Secret" (
    "id" VARCHAR(30) NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "contractCastId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Secret_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractCast_chainId_address_key" ON "ContractCast"("chainId", "address");

-- CreateIndex
CREATE UNIQUE INDEX "Secret_name_contractCastId_key" ON "Secret"("name", "contractCastId");

-- AddForeignKey
ALTER TABLE "Secret" ADD CONSTRAINT "Secret_contractCastId_fkey" FOREIGN KEY ("contractCastId") REFERENCES "ContractCast"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
