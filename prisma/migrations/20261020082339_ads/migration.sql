-- CreateEnum
CREATE TYPE "AdPlacement" AS ENUM ('HOME', 'RESULTS', 'DEVICE');

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "advertiser" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "placements" "AdPlacement"[],
    "category" "Category",
    "deviceId" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ad_active_idx" ON "Ad"("active");

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
