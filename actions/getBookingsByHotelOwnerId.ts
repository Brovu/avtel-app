import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const getBookingsByHotelOwnerId = async () => {
  try {
    const { userId } = auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const bookings = await prisma.booking.findMany({
      where: {
        hotelOwnerId: userId,
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
    console.log("Bookings from getBookingsByHotelOwnerId:", bookings);

    return bookings;
  } catch (error: any) {
    console.error("Error in getBookingsByHotelOwnerId:", error.message);
    throw new Error(error.message);
  }
};
