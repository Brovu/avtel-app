import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs";

export const getHotelsByUserId = async () => {
  try {
    const { userId } = auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const hotels = await prisma.hotel.findMany({
      where: {
        userId,
      },
      include: {
        rooms: true,
      },
    });

    if (!hotels || hotels.length === 0) {
      return null;
    }

    return hotels;
  } catch (error: any) {
    console.error("Error fetching hotels:", error);
    throw new Error(error.message || "Failed to fetch hotels");
  }
};
