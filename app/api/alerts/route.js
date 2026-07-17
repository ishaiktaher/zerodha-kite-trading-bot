import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { apiError } from "@/lib/kite";

export async function GET() { try { const session = await requireSession(); const sql = getDb(); const rows = await sql`select a.*, f.name as filter_name from zeta_gain.alerts a join zeta_gain.filters f on f.id = a.filter_id where a.user_id = ${session.userId} and a.is_active order by coalesce(a.last_triggered_at, a.created_at) desc`; return Response.json(rows); } catch (error) { return apiError(error); } }
export async function PATCH() { try { const session = await requireSession(); const sql = getDb(); await sql`update zeta_gain.alerts set last_viewed_at = now() where user_id = ${session.userId}`; return Response.json({ success: true }); } catch (error) { return apiError(error); } }

