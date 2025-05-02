/*
  Warnings:

  - You are about to drop the column `price` on the `Room` table. All the data in the column will be lost.
  - Added the required column `bathroomCount` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bedCount` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `breakFastPrice` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guestCount` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kingBed` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `queenBen` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomPrice` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Room" DROP COLUMN "price",
ADD COLUMN     "TV" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "airCondition" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "balcony" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bathroomCount" INTEGER NOT NULL,
ADD COLUMN     "bedCount" INTEGER NOT NULL,
ADD COLUMN     "breakFastPrice" INTEGER NOT NULL,
ADD COLUMN     "cityView" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "forestView" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "freeWiFi" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "guestCount" INTEGER NOT NULL,
ADD COLUMN     "kingBed" INTEGER NOT NULL,
ADD COLUMN     "mountainView" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "oceanView" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "queenBen" INTEGER NOT NULL,
ADD COLUMN     "roomPrice" INTEGER NOT NULL,
ADD COLUMN     "roomService" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "soundProofed" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "updatedAt" DROP DEFAULT;
