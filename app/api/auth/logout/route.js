import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/kite";

export async function POST(request) {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, "", { expires: new Date(0), path: "/" });
  return response;
}
