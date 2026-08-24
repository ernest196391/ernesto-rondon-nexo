import { NextRequest, NextResponse } from "next/server";
import { STUDIO_SESSION_COOKIE, verifyStudioSession } from "./lib/studio/session";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const publicStudio = path === "/studio/login" || path === "/api/studio/auth/login";
  if (publicStudio) return NextResponse.next();

  const protectedPath = path === "/studio" || path.startsWith("/studio/") || path === "/api/studio" || path.startsWith("/api/studio/");
  if (!protectedPath) return NextResponse.next();

  const token = request.cookies.get(STUDIO_SESSION_COOKIE)?.value;
  const authorized = await verifyStudioSession(token, process.env.NEXO_STUDIO_SESSION_SECRET);
  if (authorized) return NextResponse.next();

  if (path.startsWith("/api/")) return NextResponse.json({ error: "Studio authentication required" }, { status: 401 });
  const login = new URL("/studio/login", request.url);
  login.searchParams.set("next", `${path}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/studio/:path*", "/api/studio/:path*"],
};
