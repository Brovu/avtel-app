import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  try {
    const authResult = auth();
    console.log("Clerk auth result in /api/favorites:", authResult);

    const { userId } = authResult;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Lấy danh sách khách sạn yêu thích của người dùng
    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
      },
      include: {
        hotel: {
          include: {
            rooms: true,
            reviews: true,
          },
        },
      },
    });

    // Chuyển đổi dữ liệu để khớp với định dạng của HotelList
    const hotels = favorites.map((favorite) => {
      const hotel = favorite.hotel;

      // Tính điểm đánh giá trung bình
      const totalRating = hotel.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const avgRating =
        hotel.reviews.length > 0
          ? (totalRating / hotel.reviews.length).toFixed(1)
          : null;

      // Thêm trường isFavorited
      return {
        ...hotel,
        avgRating,
        isFavorited: true,
      };
    });

    return NextResponse.json(hotels);
  } catch (error: any) {
    console.error("Error at /api/favorites GET:", error.message);
    return new NextResponse("Internal Server Error: " + error.message, {
      status: 500,
    });
  }
};
