import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { userId, sessionClaims } = await auth();

    console.log("Clerk auth in /api/sync-user:", { userId, sessionClaims });

    if (!userId) {
      console.log("No userId found in auth");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    // Nếu không có email, tạo email duy nhất dựa trên userId
    const email =
      clerkUser.primaryEmailAddress?.emailAddress ||
      `user_${userId}@example.com`;
    const name =
      clerkUser.firstName ||
      clerkUser.lastName ||
      clerkUser.username ||
      "Unknown";

    console.log("Attempting to sync user:", { userId, email, name });

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        email,
        name,
        updatedAt: new Date(),
      },
      create: {
        id: userId,
        email,
        name,
        role: "CUSTOMER",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`User ${userId} synced to database:`, user);

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Error syncing user in API:", error.message);
    console.error("Full error:", error);
    return new NextResponse("Internal Server Error: " + error.message, {
      status: 500,
    });
  }
}
