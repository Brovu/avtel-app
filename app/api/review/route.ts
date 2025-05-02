import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

// Lấy danh sách đánh giá của một khách sạn
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get("hotelId");

  if (!hotelId) {
    return NextResponse.json(
      { error: "Hotel ID is required" },
      { status: 400 }
    );
  }

  try {
    const reviews = await prisma.review.findMany({
      where: { hotelId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// Tạo đánh giá mới
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    console.log("User ID from auth:", userId);

    if (!userId) {
      console.log("No userId found in auth");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Received review data:", body);

    const { hotelId, rating, comment } = body;

    if (!hotelId || !rating || !comment) {
      console.log("Missing fields:", { hotelId, rating, comment });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      console.log("Invalid rating:", rating);
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Kiểm tra xem người dùng đã đánh giá khách sạn này chưa
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        hotelId,
      },
    });
    console.log("Existing review check:", existingReview);

    if (existingReview) {
      console.log("User already reviewed hotel:", { userId, hotelId });
      return NextResponse.json(
        { error: "You have already reviewed this hotel" },
        { status: 403 }
      );
    }

    // Kiểm tra xem userId có tồn tại trong bảng User không
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });
    console.log("User exists in database:", userExists);

    if (!userExists) {
      console.log("User not found in database:", userId);
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Tạo đánh giá mới nếu chưa có
    console.log("Creating review with data:", {
      userId,
      hotelId,
      rating,
      comment,
    });
    const review = await prisma.review.create({
      data: {
        userId,
        hotelId,
        rating,
        comment,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("Review created successfully:", review);
    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    console.error("Error creating review:", error.message);
    console.error("Full error:", error);
    return NextResponse.json(
      { error: "Failed to create review", details: error.message },
      { status: 500 }
    );
  }
}
