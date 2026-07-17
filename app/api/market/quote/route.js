import { apiError, getAuthenticatedKite } from "@/lib/kite";

export async function GET(request) {
  const symbol = request.nextUrl.searchParams.get("symbol")?.trim().toUpperCase();
  if (!symbol) return Response.json({ error: "Symbol is required" }, { status: 400 });
  try {
    const kite = await getAuthenticatedKite();
    const key = `NSE:${symbol}`;
    const quote = await kite.getQuote([key]);
    return Response.json(quote[key]);
  } catch (error) {
    return apiError(error);
  }
}
