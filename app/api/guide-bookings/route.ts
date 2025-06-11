import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const guideId = url.searchParams.get("guideId");

    if (!guideId) {
      return NextResponse.json(
        { error: "guideId là bắt buộc" },
        { status: 400 }
      );
    }

    const bookings = await prisma.guideBooking.findMany({
      where: { guideId },
    });

    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error("Error fetching guide bookings:", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy lịch đặt" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để đặt lịch" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { guideId, startTime, endTime, totalPrice, notes } = body;

    if (!guideId || !startTime || !endTime || !totalPrice) {
      return NextResponse.json(
        { error: "Thiếu thông tin yêu cầu" },
        { status: 400 }
      );
    }

    // Kiểm tra hướng dẫn viên tồn tại
    const guide = await prisma.localGuide.findUnique({
      where: { id: guideId },
    });
    if (!guide) {
      return NextResponse.json(
        { error: "Hướng dẫn viên không tồn tại" },
        { status: 404 }
      );
    }

    // Kiểm tra trùng lịch
    const overlappingBookings = await prisma.guideBooking.findMany({
      where: {
        guideId,
        OR: [
          {
            startTime: { lte: new Date(endTime) },
            endTime: { gte: new Date(startTime) },
          },
        ],
      },
    });

    if (overlappingBookings.length > 0) {
      return NextResponse.json(
        { error: "Lịch đã được đặt bởi người khác" },
        { status: 409 }
      );
    }

    const booking = await prisma.guideBooking.create({
      data: {
        guideId,
        userId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        totalPrice,
        notes,
        status: "PENDING",
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating guide booking:", error);
    return NextResponse.json({ error: "Lỗi khi đặt lịch" }, { status: 500 });
  }
}
