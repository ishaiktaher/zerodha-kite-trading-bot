import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/kite";
import { listFilters, saveFilter } from "@/lib/filter-store";

export async function GET() {
  try {
    const session = await requireSession();
    return Response.json(await listFilters(session.userId));
  } catch (error) { return apiError(error); }
}

export async function POST(request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    return Response.json(await saveFilter(session.userId, { ...body, id: body.id || randomUUID() }), { status: 201 });
  } catch (error) { return apiError(error); }
}

