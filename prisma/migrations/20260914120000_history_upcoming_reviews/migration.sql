-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "PricePoint" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT '',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpcomingDevice" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "brand" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expectedPrice" INTEGER,
    "expectedLaunch" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "launchedSlug" TEXT,
    "launchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpcomingDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpcomingSubscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "upcomingId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "UpcomingSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "usedFor" TEXT NOT NULL,
    "ownedMonths" INTEGER NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PricePoint_deviceId_recordedAt_idx" ON "PricePoint"("deviceId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UpcomingDevice_slug_key" ON "UpcomingDevice"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UpcomingSubscription_token_key" ON "UpcomingSubscription"("token");

-- CreateIndex
CREATE UNIQUE INDEX "UpcomingSubscription_email_upcomingId_key" ON "UpcomingSubscription"("email", "upcomingId");

-- CreateIndex
CREATE INDEX "Review_deviceId_status_idx" ON "Review"("deviceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Review_email_deviceId_key" ON "Review"("email", "deviceId");

-- AddForeignKey
ALTER TABLE "PricePoint" ADD CONSTRAINT "PricePoint_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpcomingSubscription" ADD CONSTRAINT "UpcomingSubscription_upcomingId_fkey" FOREIGN KEY ("upcomingId") REFERENCES "UpcomingDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
