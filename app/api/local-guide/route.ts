import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const guides = await prisma.localGuide.findMany();
    return NextResponse.json(guides, { status: 200 });
  } catch (error) {
    console.error("Error fetching local guides:", error);
    return NextResponse.json(
      { error: "Failed to fetch local guides" },
      { status: 500 }
    );
  }
}
