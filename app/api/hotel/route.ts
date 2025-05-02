import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"; // Sử dụng /server để rõ ràng
import { NextResponse } from "next/server";

console.log("Create loaded");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Request body:", body);

    // Sử dụng await để lấy userId từ auth()
    const { userId } = await auth();
    console.log("User ID from auth:", userId);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const hotel = await prisma.hotel.create({
      data: {
        ...body,
        userId,
      },
    });

    return NextResponse.json(hotel);
  } catch (error: any) {
    console.error("Error at /api/hotel POST:", error.message);
    console.error("Full error:", error);
    return new NextResponse("Internal Server Error: " + error.message, {
      status: 500,
    });
  }
}
