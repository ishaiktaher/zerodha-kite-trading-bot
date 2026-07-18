import { apiError, getAuthenticatedKite } from "@/lib/kite";
import { KiteDataProvider } from "@/lib/market-data";

export async function GET(request) {
  try {
    const symbol = request.nextUrl.searchParams.get("symbol")?.toUpperCase();
    const timeframe = request.nextUrl.searchParams.get("timeframe") || "day";
    if (!symbol) return Response.json({ error: "Symbol is required" }, { status: 400 });
    const provider = new KiteDataProvider(await getAuthenticatedKite());
    return Response.json({ symbol, timeframe, candles: await provider.candles(symbol, timeframe) });
  } catch (error) { return apiError(error); }
}
