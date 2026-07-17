import { apiError, getAuthenticatedKite } from "@/lib/kite";
import { evaluateConditions } from "@/lib/screener";
import { mapRateLimited } from "@/lib/batch";
import { KiteDataProvider } from "@/lib/market-data";
import { resolveUniverse } from "@/lib/universe";
import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request) {
  try {
    const { filterId, conditions, universe = "NIFTY_50", timeframe = "day", symbols = [] } = await request.json();
    if ((!Array.isArray(conditions) && !conditions?.items?.length) || !["day", "week", "15minute", "60minute"].includes(timeframe)) {
      return Response.json({ error: "Valid conditions and timeframe are required" }, { status: 400 });
    }
    const session = await requireSession();
    const kite = await getAuthenticatedKite();
    const provider = new KiteDataProvider(kite);
    const instruments = await provider.instruments();
    const universeSymbols = resolveUniverse(universe, instruments, symbols);
    const failures = [];
    const rows = await mapRateLimited(universeSymbols, async (symbol) => {
      try {
        const candles = await provider.candles(symbol, timeframe);
        const evaluation = evaluateConditions(candles, conditions);
        if (!evaluation.matched) return null;
        const latest = candles.at(-1);
        const previous = candles.at(-2);
        return { symbol, ltp: Number(latest.close), change: previous?.close ? ((latest.close - previous.close) / previous.close) * 100 : 0, details: evaluation.details };
      } catch (error) {
        failures.push({ symbol, error: error.message || "Data unavailable" });
        return null;
      }
    }, { concurrency: 2, interval: 350 });
    const matches = rows.filter(Boolean);
    if (filterId && process.env.DATABASE_URL) {
      const sql = getDb();
      const owned = await sql`select id from zeta_gain.filters where id = ${filterId} and user_id = ${session.userId}`;
      if (owned.length) {
        await sql`insert into zeta_gain.scan_runs (filter_id, matched_symbols, status) values (${filterId}, ${sql.json(matches.map((item) => item.symbol))}, 'completed')`;
        await sql`update zeta_gain.alerts set last_triggered_at = now() where filter_id = ${filterId} and is_active and ${matches.length} > 0`;
      }
    }
    return Response.json({ matches, scanned: universeSymbols.length, failures: failures.length, universe, timeframe });
  } catch (error) { return apiError(error); }
}
