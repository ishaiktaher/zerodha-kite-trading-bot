import { apiError, getAuthenticatedKite } from "@/lib/kite";

const readers = {
  orders: (kite) => kite.getOrders(),
  holdings: (kite) => kite.getHoldings(),
  positions: (kite) => kite.getPositions(),
  margins: (kite, request) => kite.getMargins(request.nextUrl.searchParams.get("segment") || "equity"),
};

export async function GET(request, { params }) {
  const { resource } = await params;
  if (!readers[resource]) return Response.json({ error: "Unknown account resource" }, { status: 404 });
  try {
    const kite = await getAuthenticatedKite();
    return Response.json(await readers[resource](kite, request));
  } catch (error) {
    return apiError(error);
  }
}
