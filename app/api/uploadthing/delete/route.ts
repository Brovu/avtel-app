import { UTApi } from "uploadthing/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { fileKey } = await req.json();

    if (!fileKey) {
      return NextResponse.json(
        { error: "File key is required" },
        { status: 400 }
      );
    }

    // Khởi tạo UTApi với UPLOADTHING_TOKEN từ biến môi trường
    const utapi = new UTApi({
      token: process.env.UPLOADTHING_TOKEN,
    });

    // Xóa file trên UploadThing
    await utapi.deleteFiles(fileKey);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
