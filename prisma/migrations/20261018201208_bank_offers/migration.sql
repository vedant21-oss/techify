-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('ANY', 'CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "OfferKind" AS ENUM ('FLAT', 'PERCENT');

-- CreateTable
CREATE TABLE "BankOffer" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "cardType" "CardType" NOT NULL DEFAULT 'ANY',
    "kind" "OfferKind" NOT NULL,
    "amount" INTEGER NOT NULL,
    "maxDiscount" INTEGER,
    "emiOnly" BOOLEAN NOT NULL DEFAULT false,
    "noCostEmiMonths" INTEGER,
    "store" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankOffer_deviceId_idx" ON "BankOffer"("deviceId");

-- AddForeignKey
ALTER TABLE "BankOffer" ADD CONSTRAINT "BankOffer_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
