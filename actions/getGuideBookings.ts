import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { GuideBooking, LocalGuide, User } from "@prisma/client";
import { NextRequest } from "next/server";

export const getGuideBookingsByUserId = async (req?: NextRequest) => {
  try {
    let userId: string | null = null;

    if (req) {
      const { userId: authUserId } = getAuth(req);
      userId = authUserId;
    } else {
      const { auth } = await import("@clerk/nextjs/server");
      const { userId: authUserId } = await auth();
      userId = authUserId;
    }

    if (!userId) {
      console.error("User not authenticated");
      return null;
    }

    const bookings = await prisma.guideBooking.findMany({
      where: {
        userId,
      },
      include: {
        guide: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: {
        bookedAt: "desc",
      },
    });

    return bookings;
  } catch (error) {
    console.error("Error fetching guide bookings by userId:", error);
    return null;
  }
};

export const getGuideBookingsByGuideId = async (req?: NextRequest) => {
  try {
    let userId: string | null = null;

    if (req) {
      const { userId: authUserId } = getAuth(req);
      userId = authUserId;
    } else {
      const { auth } = await import("@clerk/nextjs/server");
      const { userId: authUserId } = await auth();
      userId = authUserId;
    }

    if (!userId) {
      console.error("User not authenticated in getGuideBookingsByGuideId");
      return null;
    }

    console.log("Checking if user is a local guide, userId:", userId);

    const guide = await prisma.localGuide.findUnique({
      where: { userId },
    });

    if (!guide) {
      console.log("User is not a local guide, userId:", userId);
      return [];
    }

    console.log("Fetching bookings for guideId:", guide.id);

    const bookings = await prisma.guideBooking.findMany({
      where: {
        guideId: guide.id,
      },
      include: {
        user: { select: { name: true, email: true } },
        guide: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: {
        bookedAt: "desc",
      },
    });

    console.log(
      "Bookings found for guideId:",
      guide.id,
      "Count:",
      bookings.length
    );

    return bookings;
  } catch (error) {
    console.error("Error fetching guide bookings by guideId:", error);
    return null;
  }
};
