-- CreateEnum
CREATE TYPE "GuideStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "LocalGuide" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "languages" TEXT[],
    "specialties" TEXT[],
    "pricePerHour" DOUBLE PRECISION NOT NULL,
    "availability" JSONB[],
    "city" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,
    "profileImage" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideBooking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "status" "GuideStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" BOOLEAN NOT NULL DEFAULT false,
    "paymentIntentId" TEXT,
    "notes" TEXT,
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LocalGuide_userId_key" ON "LocalGuide"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideBooking_paymentIntentId_key" ON "GuideBooking"("paymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideReview_bookingId_key" ON "GuideReview"("bookingId");

-- AddForeignKey
ALTER TABLE "LocalGuide" ADD CONSTRAINT "LocalGuide_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideBooking" ADD CONSTRAINT "GuideBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideBooking" ADD CONSTRAINT "GuideBooking_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "LocalGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideReview" ADD CONSTRAINT "GuideReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideReview" ADD CONSTRAINT "GuideReview_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "LocalGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;
