import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { guideId: string } }
) {
  try {
    const { guideId } = params;
    const guide = await prisma.localGuide.findUnique({
      where: { id: guideId },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    if (!guide) {
      return NextResponse.json(
        { error: "Hướng dẫn viên không tồn tại" },
        { status: 404 }
      );
    }

    return NextResponse.json(guide, { status: 200 });
  } catch (error) {
    console.error("Error fetching guide:", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy thông tin hướng dẫn viên" },
      { status: 500 }
    );
  }
}
