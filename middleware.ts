import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/api/uploadthing",
    "/api/hotel/(.*)",
    "/api/review",
    "/api/sync-user",
  ],
  afterAuth: async (auth, req) => {
    const { userId, sessionClaims, getToken } = auth;

    console.log("Clerk auth in middleware:", { userId, sessionClaims });

    if (!userId) {
      console.log("No userId found, skipping user sync");
      return NextResponse.next();
    }

    // Chỉ gọi sync-user cho các route không phải API hoặc file tĩnh
    const isApiRoute = req.nextUrl.pathname.startsWith("/api");
    const isStaticFile = req.nextUrl.pathname.includes("_next");
    const isSyncUserRoute = req.nextUrl.pathname === "/api/sync-user";

    if (isApiRoute || isStaticFile || isSyncUserRoute) {
      console.log("Skipping sync-user for route:", req.nextUrl.pathname);
      return NextResponse.next();
    }

    try {
      const token = await getToken();
      console.log("Session token:", token ? "Token exists" : "No token");

      const apiUrl = `${req.nextUrl.origin}/api/sync-user`;
      console.log("Calling sync-user API at:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to sync user: " + (await response.text()));
      }

      const result = await response.json();
      console.log("User sync result:", result);
    } catch (error: any) {
      console.error("Error calling sync-user API:", error.message);
      console.error("Error details:", error);
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)", // Bỏ qua file tĩnh và _next
    "/", // Trang chủ
    "/(api|trpc)(.*)", // Áp dụng cho tất cả /api/* và /trpc/*
  ],
};
