import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const getBookingsByUserId = async () => {
  try {
    const { userId } = auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId,
      },
      include: {
        room: true,
        hotel: true,
        user: true,
      },
      orderBy: {
        bookedAt: "desc",
      },
    });

    // Log dữ liệu để kiểm tra
    console.log("Bookings from getBookingsByUserId:", bookings);

    return bookings;
  } catch (error: any) {
    console.error("Error in getBookingsByUserId:", error.message);
    throw new Error(error.message);
  }
};
