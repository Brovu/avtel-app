import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { hotelId } = await req.json();
    if (!hotelId) {
      return new NextResponse("Missing hotelId", { status: 400 });
    }

    // Kiểm tra xem khách sạn đã có trong danh sách yêu thích chưa
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId,
        hotelId,
      },
    });

    if (existingFavorite) {
      // Nếu đã có, xóa khỏi danh sách yêu thích
      await prisma.favorite.delete({
        where: {
          id: existingFavorite.id,
        },
      });
      return NextResponse.json({ isFavorited: false });
    } else {
      // Nếu chưa có, thêm vào danh sách yêu thích
      await prisma.favorite.create({
        data: {
          userId,
          hotelId,
        },
      });
      return NextResponse.json({ isFavorited: true });
    }
  } catch (error: any) {
    console.error("Error at /api/favorite POST:", error.message);
    return new NextResponse("Internal Server Error: " + error.message, {
      status: 500,
    });
  }
};
