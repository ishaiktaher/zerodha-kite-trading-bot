import { NextResponse } from "next/server";
import { createKite } from "@/lib/kite";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.redirect(createKite().getLoginURL());
  } catch (error) {
    const url = new URL("/", process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
    url.searchParams.set("error", error.message);
    return NextResponse.redirect(url);
  }
}
