-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PAID', 'FAILED');

-- CreateTable
CREATE TABLE "PriceAlert" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "targetPrice" INTEGER NOT NULL,
    "priceAtSignup" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggeredAt" TIMESTAMP(3),

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProPayment" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "amountPaise" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "ProPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceAlert_token_key" ON "PriceAlert"("token");

-- CreateIndex
CREATE INDEX "PriceAlert_triggeredAt_idx" ON "PriceAlert"("triggeredAt");

-- CreateIndex
CREATE UNIQUE INDEX "PriceAlert_email_deviceId_key" ON "PriceAlert"("email", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProPayment_razorpayOrderId_key" ON "ProPayment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "ProPayment_razorpayPaymentId_key" ON "ProPayment"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "ProPayment_email_status_idx" ON "ProPayment"("email", "status");

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
