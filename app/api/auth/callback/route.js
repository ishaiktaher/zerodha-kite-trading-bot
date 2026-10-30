import { NextResponse } from "next/server";
import { createKite, createSession, SESSION_COOKIE } from "@/lib/kite";
import { ensureUser } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request) {
  const requestToken = request.nextUrl.searchParams.get("request_token")?.trim();
  const destination = new URL("/", request.url);
  if (!requestToken) {
    destination.searchParams.set("error", "Zerodha did not return a request token");
    return NextResponse.redirect(destination);
  }

  try {
    const apiSecret = process.env.KITE_API_SECRET?.trim();
    const session = await createKite().generateSession(requestToken, apiSecret);
    if (process.env.DATABASE_URL) await ensureUser(session.user_id);
    const token = createSession({
      accessToken: session.access_token,
      userId: session.user_id,
    });
    const response = NextResponse.redirect(destination);
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 23 * 60 * 60,
    });
    return response;
  } catch (error) {
    console.error("Zerodha Kite auth callback error:", error);
    const message = error.message?.includes("Token is invalid or has expired")
      ? "Zerodha request token is invalid, expired, or already used. Please click 'Connect Zerodha' to start a fresh login."
      : (error.message || "Zerodha login failed");
    destination.searchParams.set("error", message);
    return NextResponse.redirect(destination);
  }
}
