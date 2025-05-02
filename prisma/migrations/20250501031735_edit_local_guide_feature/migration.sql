/*
  Warnings:

  - You are about to drop the column `paymentIntentId` on the `GuideBooking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `GuideBooking` table. All the data in the column will be lost.
  - You are about to drop the column `bookingId` on the `GuideReview` table. All the data in the column will be lost.
  - You are about to drop the column `availability` on the `LocalGuide` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `LocalGuide` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerHour` on the `LocalGuide` table. All the data in the column will be lost.
  - Added the required column `pricePerDay` to the `LocalGuide` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "GuideBooking_paymentIntentId_key";

-- DropIndex
DROP INDEX "GuideReview_bookingId_key";

-- AlterTable
ALTER TABLE "GuideBooking" DROP COLUMN "paymentIntentId",
DROP COLUMN "paymentStatus";

-- AlterTable
ALTER TABLE "GuideReview" DROP COLUMN "bookingId";

-- AlterTable
ALTER TABLE "LocalGuide" DROP COLUMN "availability",
DROP COLUMN "isVerified",
DROP COLUMN "pricePerHour",
ADD COLUMN     "pricePerDay" DOUBLE PRECISION NOT NULL;
