import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"; // Sử dụng /server để rõ ràng
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received room data:", body);

    // Sử dụng await để lấy userId từ auth()
    const { userId } = await auth();
    console.log("User ID from auth:", userId);

    if (!userId) {
      console.log("No userId found in auth");
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const { hotelId } = body;
    if (!hotelId) {
      console.log("Missing hotelId in request body");
      return new NextResponse(
        JSON.stringify({ message: "Hotel ID is required" }),
        {
          status: 400,
        }
      );
    }

    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { userId: true },
    });

    if (!hotel) {
      console.log(`Hotel not found for hotelId: ${hotelId}`);
      return new NextResponse(JSON.stringify({ message: "Hotel not found" }), {
        status: 404,
      });
    }

    if (hotel.userId !== userId) {
      console.log(`User ${userId} does not own hotel ${hotelId}`);
      return new NextResponse(
        JSON.stringify({ message: "Forbidden: You do not own this hotel" }),
        { status: 403 }
      );
    }

    // Kiểm tra dữ liệu trước khi tạo phòng
    const requiredFields = [
      "title",
      "description",
      "bedCount",
      "guestCount",
      "bathroomCount",
      "kingBed",
      "queenBen",
      "image",
      "breakFastPrice",
      "roomPrice",
    ];
    const missingFields = requiredFields.filter((field) => !(field in body));
    if (missingFields.length > 0) {
      console.log("Missing fields:", missingFields);
      return new NextResponse(
        JSON.stringify({
          message: `Missing required fields: ${missingFields.join(", ")}`,
        }),
        { status: 400 }
      );
    }

    // Tạo phòng mới
    console.log("Creating room with data:", { ...body, hotelId });
    const room = await prisma.room.create({
      data: {
        title: body.title,
        description: body.description,
        bedCount: body.bedCount,
        guestCount: body.guestCount,
        bathroomCount: body.bathroomCount,
        kingBed: body.kingBed,
        queenBen: body.queenBen,
        image: body.image,
        breakFastPrice: body.breakFastPrice,
        roomPrice: body.roomPrice,
        roomService: body.roomService || false,
        TV: body.TV || false,
        balcony: body.balcony || false,
        freeWiFi: body.freeWiFi || false, // Sửa freeWifi thành freeWiFi
        cityView: body.cityView || false,
        oceanView: body.oceanView || false,
        forestView: body.forestView || false,
        mountainView: body.mountainView || false,
        airCondition: body.airCondition || false,
        soundProofed: body.soundProofed || false,
        hotelId,
      },
    });

    console.log("Room created successfully:", room);
    return NextResponse.json(room);
  } catch (error: any) {
    console.error("Error at /api/room POST:", error.message);
    console.error("Full error:", error);
    return new NextResponse(
      JSON.stringify({
        message: "Internal Server Error",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
