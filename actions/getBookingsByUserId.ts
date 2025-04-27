import { auth } from "@clerk/nextjs";
import prisma from "@/lib/prisma";

export const getBookingsByUserId = async () => {
  try {
    const { userId } = auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: userId, // Lọc theo userId thay vì hotelOwnerId
      },
      include: {
        Room: true,
        Hotel: true,
      },
      orderBy: {
        bookedAt: "desc",
      },
    });

    if (!bookings) return null;
    return bookings;
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    throw new Error(error.message || "Failed to fetch bookings");
  }
};
