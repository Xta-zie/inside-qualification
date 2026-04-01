import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as any)?.role;

  // Root redirect: authenticated → dashboard, anonymous → assessment
  if (pathname === "/") {
    const target = isLoggedIn ? "/dashboard" : "/assessment";
    return NextResponse.redirect(new URL(target, req.nextUrl.origin));
  }

  // Public routes - no auth needed
  const publicPaths = ["/assessment", "/api/auth", "/api/questions", "/api/baselines", "/api/training"];
  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isPublic) {
    return NextResponse.next();
  }

  // API assessments POST is public (anonymous assessments allowed)
  if (pathname === "/api/assessments" && req.method === "POST") {
    return NextResponse.next();
  }

  // Protected routes - require auth
  if (!isLoggedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const signInUrl = new URL("/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Admin routes - require admin role
  if (pathname.startsWith("/admin") && userRole !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (pathname.startsWith("/api/admin") && userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|images|fonts).*)"],
};
