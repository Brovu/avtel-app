import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { hotelId: string } }
) {
  const hotelId = params.hotelId;
  console.log("PATCH request received for hotelId:", hotelId);
  try {
    const body = await req.json();
    const { userId } = auth();

    if (!hotelId) {
      return new NextResponse("Hotel ID is required", { status: 400 });
    }
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const hotel = await prisma.hotel.update({
      where: { id: hotelId },
      data: { ...body },
    });

    return NextResponse.json(hotel);
  } catch (error) {
    console.error("Error in PATCH /api/hotel/[hotelId]:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { hotelId: string } }
) {
  const hotelId = params.hotelId;
  console.log("DELETE request received for hotelId:", hotelId);
  try {
    const { userId } = auth();

    if (!hotelId) {
      return new NextResponse("Hotel ID is required", { status: 400 });
    }
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Optional: kiểm tra xem user có quyền xóa (chủ sở hữu) trước khi xóa
    const existing = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { userId: true },
    });
    if (!existing) {
      return new NextResponse("Hotel not found", { status: 404 });
    }
    if (existing.userId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Thực hiện xóa
    await prisma.hotel.delete({
      where: { id: hotelId },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error("Error in DELETE /api/hotel/[hotelId]:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
