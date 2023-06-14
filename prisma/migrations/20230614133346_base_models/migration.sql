-- CreateEnum
CREATE TYPE "ChainCastType" AS ENUM ('BEPRO_NETWORK_V2', 'BEPRO_FACTORY', 'BEPRO_REGISTRY', 'BEPRO_POP');

-- CreateTable
CREATE TABLE "ChainCast" (
    "id" VARCHAR(30) NOT NULL,
    "type" "ChainCastType" NOT NULL,
    "address" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "blockNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChainCast_pkey" PRIMARY KEY ("id")
);
