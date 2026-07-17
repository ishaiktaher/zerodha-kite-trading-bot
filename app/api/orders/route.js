import { apiError, getAuthenticatedKite } from "@/lib/kite";

export async function POST(request) {
  try {
    const { symbol, action, quantity } = await request.json();
    const normalizedQuantity = Number.parseInt(quantity, 10);
    if (!symbol || !["BUY", "SELL"].includes(action) || !Number.isInteger(normalizedQuantity) || normalizedQuantity < 1) {
      return Response.json({ error: "Valid symbol, action, and quantity are required" }, { status: 400 });
    }
    const kite = await getAuthenticatedKite();
    const orderId = await kite.placeOrder("regular", {
      exchange: "NSE",
      tradingsymbol: symbol.trim().toUpperCase(),
      transaction_type: action,
      quantity: normalizedQuantity,
      product: "MIS",
      order_type: "MARKET",
    });
    return Response.json({ success: true, orderId });
  } catch (error) {
    return apiError(error);
  }
}
