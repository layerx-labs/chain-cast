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

-- CreateTable
CREATE TABLE "ChainCastEvent" (
    "id" VARCHAR(30) NOT NULL,
    "streamId" VARCHAR(30) NOT NULL,
    "event" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "blockHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "transactionIndex" INTEGER,
    "args" JSONB NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChainCastEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChainCastEvent" ADD CONSTRAINT "ChainCastEvent_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "ChainCast"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
