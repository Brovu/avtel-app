import prisma from "@/lib/prisma";

export const getHotelById = async (hotelId: string) => {
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: {
        rooms: true,
      },
    });

    if (!hotel) return null;
    return hotel;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Error getting hotel by id: ${error.message}`);
    }
    throw new Error("Unknown error occurred while getting hotel");
  }
};
