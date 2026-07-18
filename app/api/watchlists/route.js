import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { ensureUser, getDb } from "@/lib/db";
import { apiError } from "@/lib/kite";

export async function GET() { try { const session = await requireSession(); const sql = getDb(); return Response.json(await sql`select * from zeta_gain.watchlists where user_id = ${session.userId} order by updated_at desc`); } catch (error) { return apiError(error); } }
export async function POST(request) { try { const session = await requireSession(); const { id = randomUUID(), name, symbols = [] } = await request.json(); const sql = getDb(); await ensureUser(session.userId, sql); const [row] = await sql`insert into zeta_gain.watchlists (id, user_id, name, symbols) values (${id}, ${session.userId}, ${name || "Watchlist"}, ${sql.json(symbols)}) on conflict (id) do update set name = excluded.name, symbols = excluded.symbols, updated_at = now() where zeta_gain.watchlists.user_id = ${session.userId} returning *`; return Response.json(row); } catch (error) { return apiError(error); } }

