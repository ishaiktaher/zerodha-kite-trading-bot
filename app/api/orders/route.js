import { requireSession } from "@/lib/auth";
import { ensureUser, getDb, logOrder } from "@/lib/db";
import { apiError, createKite } from "@/lib/kite";

const PRODUCTS = new Set(["MIS", "CNC", "NRML"]);
const ORDER_TYPES = new Set(["MARKET", "LIMIT", "SL", "SL-M"]);

function validated(body) {
  const symbol = body.symbol?.trim().toUpperCase();
  const quantity = Number.parseInt(body.quantity, 10);
  if (!symbol || !["BUY", "SELL"].includes(body.side) || !Number.isInteger(quantity) || quantity < 1 || !PRODUCTS.has(body.product) || !ORDER_TYPES.has(body.orderType)) {
    const error = new Error("Valid symbol, side, quantity, product, and order type are required"); error.statusCode = 400; throw error;
  }
  return { symbol, quantity, side: body.side, product: body.product, orderType: body.orderType, price: body.orderType === "MARKET" ? undefined : Number(body.price), triggerPrice: body.triggerPrice ? Number(body.triggerPrice) : undefined, validity: body.validity || "DAY" };
}

export async function POST(request) {
  try {
    const session = await requireSession();
    const order = validated(await request.json());
    const sql = getDb(); await ensureUser(session.userId, sql);
    const orderId = await createKite(session.accessToken).placeOrder("regular", { exchange: "NSE", tradingsymbol: order.symbol, transaction_type: order.side, quantity: order.quantity, product: order.product, order_type: order.orderType, price: order.price, trigger_price: order.triggerPrice, validity: order.validity });
    await logOrder({ userId: session.userId, kiteOrderId: String(orderId), symbol: order.symbol, side: order.side, qty: order.quantity, price: order.price, orderType: order.orderType, product: order.product, status: "SUBMITTED", action: "PLACE" }, sql);
    return Response.json({ success: true, orderId });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const order = validated(body);
    if (!body.orderId) return Response.json({ error: "orderId is required" }, { status: 400 });
    const result = await createKite(session.accessToken).modifyOrder("regular", body.orderId, { quantity: order.quantity, order_type: order.orderType, price: order.price, trigger_price: order.triggerPrice, validity: order.validity });
    await logOrder({ userId: session.userId, kiteOrderId: body.orderId, symbol: order.symbol, side: order.side, qty: order.quantity, price: order.price, orderType: order.orderType, product: order.product, status: "MODIFIED", action: "MODIFY" });
    return Response.json({ success: true, orderId: result });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    if (!body.orderId || !body.symbol) return Response.json({ error: "orderId and symbol are required" }, { status: 400 });
    await createKite(session.accessToken).cancelOrder("regular", body.orderId);
    await logOrder({ userId: session.userId, kiteOrderId: body.orderId, symbol: body.symbol, side: body.side || "BUY", qty: Number(body.quantity) || 1, price: body.price, orderType: body.orderType || "MARKET", product: body.product || "MIS", status: "CANCELLED", action: "CANCEL" });
    return Response.json({ success: true });
  } catch (error) { return apiError(error); }
}
