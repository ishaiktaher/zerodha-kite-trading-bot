import { requireSession } from "@/lib/auth";
import { importFilters } from "@/lib/filter-store";
import { apiError } from "@/lib/kite";

export async function POST(request) {
  try {
    const session = await requireSession();
    const { filters } = await request.json();
    if (!Array.isArray(filters)) return Response.json({ error: "filters must be an array" }, { status: 400 });
    return Response.json({ filters: await importFilters(session.userId, filters) });
  } catch (error) { return apiError(error); }
}
