-- CreateEnum
CREATE TYPE "BeproChainCastType" AS ENUM ('BEPRO_NETWORK_V2', 'BEPRO_FACTORY', 'BEPRO_REGISTRY', 'BEPRO_POP');

-- CreateTable
CREATE TABLE "BeproChainCast" (
    "id" VARCHAR(30) NOT NULL,
    "type" "BeproChainCastType" NOT NULL,
    "address" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "blockNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeproChainCast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeproCastEvent" (
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

    CONSTRAINT "BeproCastEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BeproCastEvent" ADD CONSTRAINT "BeproCastEvent_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "BeproChainCast"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
