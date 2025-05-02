import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    if (!roomId) {
      return NextResponse.json({ message: "Thiếu roomId" }, { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json(
        { message: "Không tìm thấy phòng" },
        { status: 404 }
      );
    }

    return NextResponse.json(room);
  } catch (error: any) {
    console.error("Error in /api/room/[roomId] GET:", error);
    return NextResponse.json(
      { message: "Lỗi server: " + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  console.log("PATCH request received for roomId:", roomId);
  try {
    const body = await req.json();
    console.log("PATCH request body:", body);
    const { userId } = await auth();

    if (!roomId) {
      return new NextResponse("Room ID is required", { status: 400 });
    }
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Kiểm tra phòng tồn tại và quyền sở hữu khách sạn
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { hotel: { select: { userId: true } } }, // Sửa Hotel thành hotel
    });

    if (!room) {
      return new NextResponse("Room not found", { status: 404 });
    }

    if (!room.hotel || room.hotel.userId !== userId) {
      return new NextResponse("Forbidden: You do not own this hotel", {
        status: 403,
      });
    }

    // Cập nhật phòng
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: { ...body },
    });

    console.log("Room updated successfully:", updatedRoom);
    return NextResponse.json(updatedRoom);
  } catch (error: any) {
    console.error("Error in PATCH /api/room/[roomId]:", error);
    return new NextResponse("Internal Server Error: " + error.message, {
      status: 500,
    });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { userId } = await auth();
    const { roomId } = await params;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    if (!roomId) return new NextResponse("Room ID Required", { status: 400 });

    // Kiểm tra phòng tồn tại và thuộc về user
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { hotel: { select: { userId: true } } }, // Sửa Hotel thành hotel
    });

    if (!room) return new NextResponse("Room Not Found", { status: 404 });
    if (room.hotel?.userId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.room.delete({ where: { id: roomId } });
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("[ROOM_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
