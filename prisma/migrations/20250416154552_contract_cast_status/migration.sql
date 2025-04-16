-- CreateEnum
CREATE TYPE "ContractCastStatus" AS ENUM ('IDLE', 'RECOVERING', 'LISTENING', 'TERMINATED');

-- AlterTable
ALTER TABLE "ContractCast" ADD COLUMN     "status" "ContractCastStatus" NOT NULL DEFAULT 'IDLE';
