import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { apiError } from "@/lib/kite";

export async function GET() {
  try {
    const session = await requireSession();
    const sql = getDb();
    return Response.json(await sql`select * from zeta_gain.orders_log where user_id = ${session.userId} order by placed_at desc limit 200`);
  } catch (error) { return apiError(error); }
}
