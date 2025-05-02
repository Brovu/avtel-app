import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { userId } = auth(); // Lấy userId từ Clerk

    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || undefined;
    const country = searchParams.get("country") || undefined;
    const state = searchParams.get("state") || undefined;
    const city = searchParams.get("city") || undefined;
    const sortPrice = searchParams.get("sortPrice") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const limit = parseInt(searchParams.get("limit") || "6");
    const page = parseInt(searchParams.get("page") || "1");
    const amenity = searchParams.get("amenity") || undefined; // Thêm tham số amenity

    const where: any = {};

    if (title) {
      where.title = {
        contains: title,
        mode: "insensitive",
      };
    }

    if (country) where.country = country;
    if (state) where.state = state;
    if (city) where.city = city;

    // Lọc theo tiện ích (amenity)
    if (amenity) {
      where[amenity] = true; // Lọc khách sạn có tiện ích tương ứng (ví dụ: where: { spa: true })
    }

    const hotels = await prisma.hotel.findMany({
      where,
      include: {
        rooms: {
          include: {
            bookings: true,
          },
        },
        reviews: true,
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        reviews: {
          _count: "desc",
        },
      },
    });

    // Lọc khách sạn có ít nhất một phòng khả dụng trong khoảng ngày
    const filteredHotels = hotels.filter((hotel) => {
      if (!startDate || !endDate) {
        return true; // Nếu không có ngày, trả về tất cả khách sạn
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      // Kiểm tra từng phòng của khách sạn
      const availableRooms = hotel.rooms.filter((room) => {
        // Tìm các booking đã thanh toán trong khoảng ngày
        const conflictingBookings = room.bookings.filter((booking) => {
          if (!booking.paymentStatus) return false; // Chỉ tính các booking đã thanh toán
          const bookingStart = new Date(booking.startDate);
          const bookingEnd = new Date(booking.endDate);
          return bookingStart <= end && bookingEnd >= start;
        });

        // Phòng khả dụng nếu số lượng booking trùng nhỏ hơn quantity
        return conflictingBookings.length < room.quantity;
      });

      // Chỉ giữ khách sạn nếu có ít nhất một phòng khả dụng
      return availableRooms.length > 0;
    });

    // Tính điểm đánh giá trung bình, giá phòng thấp nhất và trạng thái yêu thích
    const hotelsWithRating = await Promise.all(
      filteredHotels.map(async (hotel) => {
        const totalRating = hotel.reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const avgRating =
          hotel.reviews.length > 0
            ? (totalRating / hotel.reviews.length).toFixed(1)
            : null;

        const minPrice =
          hotel.rooms.length > 0
            ? Math.min(...hotel.rooms.map((room) => room.roomPrice))
            : Infinity;

        // Kiểm tra xem khách sạn có trong danh sách yêu thích không
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
          minPrice,
          isFavorited, // Thêm trường isFavorited
        };
      })
    );

    // Sắp xếp dựa trên sortPrice (nếu có), nếu không thì theo logic mặc định
    if (sortPrice) {
      hotelsWithRating.sort((a, b) => {
        const priceA = a.minPrice;
        const priceB = b.minPrice;
        return sortPrice === "asc" ? priceA - priceB : priceB - priceA;
      });
    } else {
      hotelsWithRating.sort((a, b) => {
        const ratingA = a.avgRating ? parseFloat(a.avgRating) : 0;
        const ratingB = b.avgRating ? parseFloat(b.avgRating) : 0;
        return ratingB - ratingA;
      });
    }

    return NextResponse.json(hotelsWithRating);
  } catch (error) {
    console.error("Error getting hotels:", error);
    return NextResponse.json(
      { message: "Lỗi server: " + (error as Error).message },
      { status: 500 }
    );
  }
}
