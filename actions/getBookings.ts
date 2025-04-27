import prisma from "@/lib/prisma";

export const getBookings = async (hotelId: string) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const bookings = await prisma.booking.findMany({
      where: {
        hotelId,
        endDate: {
          gt: yesterday,
        },
      },
    });

    return bookings;
  } catch (error: any) {
    console.log(error);
    throw new Error(error);
  }
};
