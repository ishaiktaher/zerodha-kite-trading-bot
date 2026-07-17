import { apiError, getAuthenticatedKite } from "@/lib/kite";
import { evaluateLiquidityGrab, getDailyCandles } from "@/lib/strategy";

export async function POST(request) {
  try {
    const { symbol } = await request.json();
    if (!symbol || typeof symbol !== "string") {
      return Response.json({ error: "Symbol is required" }, { status: 400 });
    }
    const kite = await getAuthenticatedKite();
    const candles = await getDailyCandles(kite, symbol);
    return Response.json({ symbol: symbol.trim().toUpperCase(), ...evaluateLiquidityGrab(candles) });
  } catch (error) {
    return apiError(error);
  }
}
