import { NextResponse } from "next/server";
import { GESTORA_SESSION_COOKIE } from "../../../../../lib/commercial/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(GESTORA_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
