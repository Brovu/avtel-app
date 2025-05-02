import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const {
      name,
      bio,
      languages,
      specialties,
      pricePerDay,
      city,
      phoneNumber,
      email,
      profileImage,
    } = data;

    // Kiểm tra xem người dùng đã đăng ký làm hướng dẫn viên chưa
    const existingGuide = await prisma.localGuide.findFirst({
      where: { userId },
    });

    if (existingGuide) {
      return NextResponse.json(
        { error: "Bạn đã đăng ký làm hướng dẫn viên" },
        { status: 400 }
      );
    }

    // Tạo mới hướng dẫn viên
    const localGuide = await prisma.localGuide.create({
      data: {
        userId,
        name,
        bio,
        languages,
        specialties,
        pricePerDay: parseFloat(pricePerDay),
        city,
        phoneNumber: phoneNumber || null,
        email: email || null,
        profileImage: profileImage || null,
        rating: null,
      },
    });

    return NextResponse.json(localGuide, { status: 201 });
  } catch (error) {
    console.error("Error registering local guide:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
