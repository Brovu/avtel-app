import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const guideId = url.searchParams.get("guideId");

    console.log("Fetching reviews for guideId:", guideId);

    if (!guideId) {
      console.error("guideId is missing");
      return NextResponse.json(
        { error: "guideId là bắt buộc" },
        { status: 400 }
      );
    }

    const reviews = await prisma.guideReview.findMany({
      where: { guideId },
      include: { user: { select: { name: true } } },
    });

    console.log("Reviews fetched successfully:", reviews.length, "records");
    return NextResponse.json(reviews, { status: 200 });
  } catch (error) {
    console.error("Error fetching guide reviews:", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy đánh giá", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = getAuth(request);
    console.log("POST /api/guide-reviews - userId:", userId);

    if (!userId) {
      console.error("User not authenticated");
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để gửi đánh giá" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("POST /api/guide-reviews - Request body:", body);

    const { guideId, rating, comment } = body;

    if (!guideId || !rating || !comment) {
      console.error("Missing required fields:", { guideId, rating, comment });
      return NextResponse.json(
        { error: "Thiếu thông tin yêu cầu" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      console.error("Invalid rating:", rating);
      return NextResponse.json(
        { error: "Đánh giá phải từ 1-5 sao" },
        { status: 400 }
      );
    }

    // Kiểm tra hướng dẫn viên tồn tại
    const guide = await prisma.localGuide.findUnique({
      where: { id: guideId },
    });
    if (!guide) {
      console.error("Guide not found:", guideId);
      return NextResponse.json(
        { error: "Hướng dẫn viên không tồn tại" },
        { status: 404 }
      );
    }

    // Kiểm tra xem người dùng đã đánh giá chưa
    const existingReview = await prisma.guideReview.findFirst({
      where: { guideId, userId },
    });
    if (existingReview) {
      console.error("User already reviewed this guide:", userId, guideId);
      return NextResponse.json(
        { error: "Bạn đã đánh giá hướng dẫn viên này rồi" },
        { status: 400 }
      );
    }

    // Tạo đánh giá mới
    const review = await prisma.guideReview.create({
      data: {
        guideId,
        userId,
        rating,
        comment,
      },
      include: { user: { select: { name: true } } },
    });

    console.log("Review created successfully:", review.id);

    // Cập nhật rating trung bình của hướng dẫn viên
    const reviews = await prisma.guideReview.findMany({
      where: { guideId },
    });
    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await prisma.localGuide.update({
      where: { id: guideId },
      data: { rating: averageRating },
    });

    console.log("Updated average rating for guide:", guideId, averageRating);

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating guide review:", error);
    return NextResponse.json(
      { error: "Lỗi khi tạo đánh giá", details: error.message },
      { status: 500 }
    );
  }
}
