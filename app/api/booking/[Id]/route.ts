import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { toast } from "sonner";

export async function PATCH(
  req: Request,
  { params }: { params: { Id: string } }
) {
  try {
    const { userId } = auth();

    if (!params.Id) {
      return new NextResponse("Thiếu Payment Intent ID", { status: 400 });
    }
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const booking = await prisma.booking.update({
      where: { paymentIntentId: params.Id },
      data: { paymentStatus: true },
    });

    return NextResponse.json(booking);
  } catch (error) {
    toast.error("Lỗi tại api/booking/Id Patch", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { Id: string } }
) {
  try {
    const { userId } = auth();

    if (!params.Id) {
      return new NextResponse("Thiếu Payment Intent ID", { status: 400 });
    }
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { paymentIntentId: params.Id },
    });

    if (!booking) {
      return new NextResponse("Không tìm thấy booking", { status: 404 });
    }

    await prisma.booking.delete({
      where: { paymentIntentId: params.Id },
    });

    return new NextResponse("Booking đã được xóa thành công", { status: 200 });
  } catch (error: any) {
    console.error("Lỗi tại api/booking/Id DELETE:", error);
    return new NextResponse(`Lỗi server: ${error.message}`, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { Id: string } }
) {
  try {
    const { userId } = auth();

    if (!params.Id) {
      return new NextResponse("Payment Intent ID is required", { status: 400 });
    }
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const bookings = await prisma.booking.findMany({
      where: {
        paymentStatus: true,
        hotelId: params.Id,
        endDate: {
          gt: yesterday,
        },
      },
    });

    return NextResponse.json(bookings); // Sửa booking thành bookings
  } catch (error: any) {
    console.error("Lỗi tại api/booking/Id GET:", error);
    return new NextResponse(`Internal Server Error: ${error.message}`, {
      status: 500,
    });
  }
}
