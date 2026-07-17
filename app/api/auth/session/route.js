import { getSession } from "@/lib/kite";

export async function GET() {
  const session = await getSession();
  return Response.json({ authenticated: Boolean(session), userId: session?.userId || null });
}
