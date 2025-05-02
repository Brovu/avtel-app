import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const getHotelById = async (hotelId: string) => {
  try {
    const { userId } = await auth();

    const hotel = await prisma.hotel.findUnique({
      where: {
        id: hotelId,
      },
      include: {
        rooms: true,
        reviews: true,
      },
    });

    if (!hotel) {
      return null;
    }

    // Tính điểm đánh giá trung bình
    const totalRating = hotel.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const avgRating =
      hotel.reviews.length > 0
        ? (totalRating / hotel.reviews.length).toFixed(1)
        : null;

    // Kiểm tra trạng thái yêu thích
    const isFavorited = userId
      ? (await prisma.favorite.findFirst({
          where: {
            userId,
            hotelId: hotel.id,
          },
        }))
        ? true
        : false
      : false;

    return {
      ...hotel,
      avgRating,
      isFavorited, // Thêm trường isFavorited
    };
  } catch (error) {
    console.error("Error getting hotel by ID:", error);
    throw error;
  }
};
