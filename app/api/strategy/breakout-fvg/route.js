import { apiError, getAuthenticatedKite } from "@/lib/kite";
import { KiteDataProvider } from "@/lib/market-data";
import { evaluateBreakoutFVGStrategy } from "@/lib/breakout-fvg";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { symbol, lookback = 14 } = await request.json();
    if (!symbol || typeof symbol !== "string") {
      return Response.json({ error: "Symbol is required" }, { status: 400 });
    }

    const normalizedSymbol = symbol.trim().toUpperCase();
    const kite = await getAuthenticatedKite();
    const provider = new KiteDataProvider(kite);

    // Fetch 15m candles (last 15 days) and 5m candles (last 5 days) in parallel
    const [candles15m, candles5m] = await Promise.all([
      provider.candles(normalizedSymbol, "15minute", 15),
      provider.candles(normalizedSymbol, "5minute", 5),
    ]);

    const evaluation = evaluateBreakoutFVGStrategy({
      candles15m,
      candles5m,
      lookback: Number(lookback) || 14,
    });

    return Response.json({
      symbol: normalizedSymbol,
      lookback: Number(lookback) || 14,
      ...evaluation,
    });
  } catch (error) {
    return apiError(error);
  }
}

