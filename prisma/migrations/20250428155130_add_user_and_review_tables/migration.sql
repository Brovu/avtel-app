/*
  Warnings:

  - You are about to drop the column `TV` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `airCondition` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `balcony` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `bathroomCount` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `bedCount` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `breakFastPrice` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `cityView` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `forestView` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `freeWiFi` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `guestCount` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `kingBed` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `mountainView` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `oceanView` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `queenBen` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `roomPrice` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `roomService` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `soundProofed` on the `Room` table. All the data in the column will be lost.
  - Added the required column `price` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Made the column `hotelId` on table `Room` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'HOTEL_OWNER', 'CUSTOMER');

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_hotelId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_roomId_fkey";

-- DropIndex
DROP INDEX "Booking_hotelId_idx";

-- DropIndex
DROP INDEX "Booking_roomId_idx";

-- DropIndex
DROP INDEX "Room_hotelId_idx";

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "breakFastIncluded" SET DEFAULT false,
ALTER COLUMN "totalPrice" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "TV",
DROP COLUMN "airCondition",
DROP COLUMN "balcony",
DROP COLUMN "bathroomCount",
DROP COLUMN "bedCount",
DROP COLUMN "breakFastPrice",
DROP COLUMN "cityView",
DROP COLUMN "forestView",
DROP COLUMN "freeWiFi",
DROP COLUMN "guestCount",
DROP COLUMN "kingBed",
DROP COLUMN "mountainView",
DROP COLUMN "oceanView",
DROP COLUMN "queenBen",
DROP COLUMN "roomPrice",
DROP COLUMN "roomService",
DROP COLUMN "soundProofed",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "hotelId" SET NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Hotel" ADD CONSTRAINT "Hotel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
