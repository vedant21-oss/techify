-- CreateEnum
CREATE TYPE "Category" AS ENUM ('LAPTOP', 'PHONE');

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "brand" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "releaseYear" INTEGER NOT NULL,
    "cpuName" TEXT NOT NULL,
    "gpuName" TEXT,
    "displayName" TEXT NOT NULL,
    "cameraName" TEXT,
    "cpuScore" INTEGER NOT NULL,
    "gpuScore" INTEGER,
    "cameraScore" INTEGER,
    "displayScore" INTEGER NOT NULL,
    "ramGb" INTEGER NOT NULL,
    "storageGb" INTEGER NOT NULL,
    "batteryCapacity" INTEGER NOT NULL,
    "chargingWatts" INTEGER,
    "weightGrams" INTEGER NOT NULL,
    "searchQuery" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_slug_key" ON "Device"("slug");

-- CreateIndex
CREATE INDEX "Device_category_price_idx" ON "Device"("category", "price");
