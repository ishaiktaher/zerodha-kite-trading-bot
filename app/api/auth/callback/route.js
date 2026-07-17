import { NextResponse } from "next/server";
import { createKite, createSession, SESSION_COOKIE } from "@/lib/kite";

export const runtime = "nodejs";

export async function GET(request) {
  const requestToken = request.nextUrl.searchParams.get("request_token");
  const destination = new URL("/", request.url);
  if (!requestToken) {
    destination.searchParams.set("error", "Zerodha did not return a request token");
    return NextResponse.redirect(destination);
  }

  try {
    const session = await createKite().generateSession(requestToken, process.env.KITE_API_SECRET);
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
    destination.searchParams.set("error", error.message || "Zerodha login failed");
    return NextResponse.redirect(destination);
  }
}
